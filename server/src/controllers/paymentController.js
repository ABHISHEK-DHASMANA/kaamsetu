import { find, findOne, insert, update, flushStorage } from '../services/storage.js';

const idOf = value => String(value?._id || value?.id || value || '');

const hydratePayment = payment => {
  const job = findOne('jobs', j => idOf(j._id || j.id) === idOf(payment.jobId));
  const worker = findOne('workerProfiles', p => idOf(p.userId) === idOf(payment.workerId));
  const employer = findOne('employerProfiles', p => idOf(p.userId) === idOf(payment.employerId));
  return {
    ...payment,
    jobTitle: job?.title || 'Completed job',
    workerName: worker?.fullName || 'Worker',
    employerName: employer?.companyName || 'Employer'
  };
};

const notify = (userId, title, message, type = 'info') => insert('notifications', {
  userId: idOf(userId), title, message, type, actionUrl: '/payments', isRead: false
});

const persistOrFail = async res => {
  try {
    await flushStorage();
    return true;
  } catch (error) {
    console.error('[Payments] Persistence failed:', error.message);
    res.status(503).json({ success: false, message: 'The payment record could not be safely saved. Refresh the page before trying again.' });
    return false;
  }
};

export const listMyPayments = (req, res) => {
  const id = idOf(req.user);
  const isWorker = req.user.role === 'worker';
  const own = find('payments', p =>
    isWorker ? idOf(p.workerId) === id : idOf(p.employerId) === id
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(hydratePayment);

  const paid = own.filter(p => p.status === 'paid');
  const pending = own.filter(p => p.status === 'awaiting_worker_confirmation');
  res.json({
    success: true,
    payments: own,
    summary: {
      paidTotal: paid.reduce((sum, p) => sum + Number(p.amount || 0), 0),
      directUpiTotal: paid.filter(p => p.method === 'direct_upi').reduce((sum, p) => sum + Number(p.amount || 0), 0),
      cashTotal: paid.filter(p => p.method === 'cash').reduce((sum, p) => sum + Number(p.amount || 0), 0),
      pendingTotal: pending.reduce((sum, p) => sum + Number(p.amount || 0), 0),
      paidCount: paid.length
    }
  });
};

const getPromisedJobAmount = (job, application) => {
  const agreed = Number(application?.agreedPaymentAmount);
  if (Number.isFinite(agreed) && agreed > 0) return Math.round(agreed * 100) / 100;
  const rate = Number(job?.offeredWage);
  if (!Number.isFinite(rate) || rate <= 0) return null;
  const wageType = String(job?.wageType || 'daily').toLowerCase();
  if (wageType === 'task') return Math.round(rate * 100) / 100;
  const duration = String(job?.workDuration || '').toLowerCase();
  const match = duration.match(/(\d+(?:\.\d+)?)\s*(day|days|week|weeks|month|months)/);
  if (!match) return null;
  const count = Number(match[1]);
  if (!Number.isFinite(count) || count <= 0) return null;
  if (wageType === 'daily') {
    const days = match[2].startsWith('week') ? count * 7 : match[2].startsWith('month') ? count * 30 : count;
    return Math.round(rate * days * 100) / 100;
  }
  if (wageType === 'monthly') {
    const months = match[2].startsWith('month') ? count : match[2].startsWith('week') ? count / 4.345 : count / 30;
    return Math.round(rate * months * 100) / 100;
  }
  return null;
};

export const getPaymentQuote = async (req, res) => {
  try {
    const employerId = idOf(req.user);
    const application = findOne('applications', a => idOf(a._id || a.id) === String(req.params.applicationId));
    if (!application || idOf(application.employerId) !== employerId) {
      return res.status(404).json({ success: false, message: 'Job application not found for this employer.' });
    }
    if (application.status !== 'PaymentPending' || !['direct_upi', 'cash'].includes(application.paymentMode)) {
      return res.status(409).json({ success: false, message: 'This job is not awaiting direct UPI or cash payment.' });
    }
    const job = findOne('jobs', j => idOf(j._id || j.id) === idOf(application.jobId));
    if (!job) return res.status(404).json({ success: false, message: 'Job listing not found.' });
    const amount = getPromisedJobAmount(job, application);
    if (!Number.isFinite(amount) || amount < 1 || amount > 1000000) {
      return res.status(422).json({ success: false, message: 'The agreed payment cannot be calculated safely. Please contact support.' });
    }
    const worker = findOne('workerProfiles', p => idOf(p.userId) === idOf(application.workerId));
    const workerUpiId = application.paymentMode === 'direct_upi' ? String(worker?.upiId || '').trim() : null;
    if (application.paymentMode === 'direct_upi' && (!workerUpiId || !/^[\w.\-]{2,256}@[\w]{2,64}$/.test(workerUpiId))) {
      return res.status(422).json({ success: false, message: 'The worker has not added a valid UPI ID yet. Ask them to save it in Worker Profile before proceeding.' });
    }
    const existing = findOne('payments', p => idOf(p.applicationId) === idOf(application._id || application.id) && p.status !== 'cancelled');
    return res.json({
      success: true,
      quote: {
        applicationId: idOf(application._id || application.id),
        jobTitle: job.title || 'Completed job',
        workerName: worker?.fullName || 'Worker',
        amount,
        currency: 'INR',
        paymentMode: application.paymentMode,
        workerUpiId,
        existingPayment: existing ? { _id: idOf(existing._id || existing.id), status: existing.status, method: existing.method } : null
      }
    });
  } catch (error) {
    console.error('[Payments] Quote failed:', error.message);
    return res.status(500).json({ success: false, message: 'Could not calculate the agreed job payment.' });
  }
};

export const createPayment = async (req, res) => {
  try {
    const employerId = idOf(req.user);
    const { applicationId } = req.body || {};
    const method = String(req.body?.method || '').toLowerCase();
    if (!applicationId) return res.status(400).json({ success: false, message: 'Choose the job you want to pay for.' });
    if (!['direct_upi', 'cash'].includes(method)) return res.status(400).json({ success: false, message: 'Choose direct UPI or cash payment.' });

    const application = findOne('applications', a => idOf(a._id || a.id) === String(applicationId));
    if (!application || idOf(application.employerId) !== employerId) {
      return res.status(404).json({ success: false, message: 'Job application not found for this employer.' });
    }
    if (application.status !== 'PaymentPending' || application.paymentMode !== method) {
      return res.status(409).json({ success: false, message: 'The selected job is not awaiting this payment method.' });
    }
    const existing = findOne('payments', p => idOf(p.applicationId) === String(applicationId) && p.status !== 'cancelled');
    if (existing) {
      if (existing.method !== method) return res.status(409).json({ success: false, message: 'A different payment method is already recorded for this job. Contact support before changing it.' });
      const existingMessage = existing.status === 'paid'
        ? 'The worker has already confirmed this payment.'
        : existing.status === 'disputed'
          ? 'This payment report is disputed. Contact support before taking further action.'
          : 'This payment report already exists. The worker must confirm receipt.';
      return res.status(200).json({ success: true, message: existingMessage, payment: hydratePayment(existing) });
    }

    const job = findOne('jobs', j => idOf(j._id || j.id) === idOf(application.jobId));
    if (!job) return res.status(404).json({ success: false, message: 'Job listing not found.' });
    const amount = getPromisedJobAmount(job, application);
    if (!Number.isFinite(amount) || amount < 1 || amount > 1000000) {
      return res.status(422).json({ success: false, message: 'The agreed payment cannot be calculated safely. Please contact support.' });
    }
    if (method === 'direct_upi') {
      const worker = findOne('workerProfiles', p => idOf(p.userId) === idOf(application.workerId));
      const workerUpiId = String(worker?.upiId || '').trim();
      if (!/^[\w.\-]{2,256}@[\w]{2,64}$/.test(workerUpiId)) {
        return res.status(422).json({ success: false, message: 'The worker has not added a valid UPI ID. Ask them to update their profile.' });
      }
    }

    const now = new Date().toISOString();
    const payment = insert('payments', {
      applicationId: idOf(application._id || application.id),
      jobId: idOf(application.jobId),
      employerId,
      workerId: idOf(application.workerId),
      amount,
      method,
      status: 'awaiting_worker_confirmation',
      employerConfirmed: true,
      workerConfirmed: false,
      reportedAt: now,
      verificationLevel: 'employer_reported',
      events: [{ type: 'employer_reported_payment', actorId: employerId, at: now }]
    });
    notify(application.workerId, 'Payment reported by employer', method === 'direct_upi'
      ? `The employer reported sending ₹${amount} by direct UPI for ${job.title || 'your completed job'}. Check your own UPI app or bank account. Confirm only if the money has actually arrived.`
      : `The employer reported handing over ₹${amount} in cash for ${job.title || 'your completed job'}. Confirm only after you have received the cash.`, 'info');
    if (!await persistOrFail(res)) return;
    return res.status(201).json({
      success: true,
      message: method === 'direct_upi'
        ? 'Payment report saved. This is not bank-verified; the worker must check their account and confirm receipt.'
        : 'Cash handover report saved. The worker must confirm receipt.',
      payment: hydratePayment(payment)
    });
  } catch (error) {
    console.error('[Payments] createPayment failed:', error);
    return res.status(500).json({ success: false, message: 'Could not record the payment report. Please refresh and try again.' });
  }
};

export const confirmPaymentReceived = async (req, res) => {
  try {
    const workerId = idOf(req.user);
    const payment = findOne('payments', p => idOf(p._id || p.id) === idOf(req.params.id));
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found.' });
    if (idOf(payment.workerId) !== workerId) return res.status(403).json({ success: false, message: 'Only the assigned worker can confirm receipt.' });
    if (payment.status === 'disputed') return res.status(409).json({ success: false, message: 'This payment is under dispute.' });
    if (payment.status === 'paid') return res.json({ success: true, message: 'Payment was already confirmed.', payment: hydratePayment(payment) });
    if (payment.status !== 'awaiting_worker_confirmation' || payment.employerConfirmed !== true) {
      return res.status(409).json({ success: false, message: 'This payment is not awaiting worker confirmation.' });
    }

    const now = new Date().toISOString();
    const application = findOne('applications', a => idOf(a._id || a.id) === idOf(payment.applicationId));
    const compatibleMode = application && (
      application.paymentMode === payment.method ||
      (payment.method === 'direct_upi' && application.paymentMode === 'online')
    );
    if (!application || application.status !== 'PaymentPending' || !compatibleMode) {
      return res.status(409).json({ success: false, message: 'The job is no longer waiting for this payment. Contact support before retrying.' });
    }
    const updated = update('payments', idOf(payment._id || payment.id), {
      workerConfirmed: true,
      workerConfirmedAt: now,
      status: 'paid',
      verificationLevel: 'party_confirmed',
      confirmedAt: now,
      events: [...(payment.events || []), { type: 'worker_confirmed_receipt', actorId: workerId, at: now }]
    });
    if (!updated) return res.status(409).json({ success: false, message: 'Payment could not be updated. Refresh and try again.' });
    const completedApplication = update('applications', idOf(application._id || application.id), { status: 'Completed', completedAt: now, paymentConfirmedAt: now });
    const workerProfile = findOne('workerProfiles', p => idOf(p.userId) === workerId);
    if (workerProfile) {
      const passport = workerProfile.skillPassport || {};
      update('workerProfiles', idOf(workerProfile._id || workerProfile.id), {
        skillPassport: { ...passport, completedJobsCount: (passport.completedJobsCount || 0) + 1 }
      });
    }
    const job = findOne('jobs', j => idOf(j._id || j.id) === idOf(application.jobId));
    const otherActive = find('applications', a => idOf(a.jobId) === idOf(application.jobId) && idOf(a._id || a.id) !== idOf(application._id || application.id) && ['Accepted', 'InProgress', 'CompletionRequested', 'PaymentPending'].includes(a.status));
    if (job) update('jobs', idOf(job._id || job.id), { status: otherActive.length ? 'in_progress' : 'completed' });
    notify(payment.employerId, 'Worker confirmed payment',
      `The worker confirmed receipt of ₹${payment.amount} for ${hydratePayment(payment).jobTitle}.`, 'success');
    if (!await persistOrFail(res)) return;
    return res.json({ success: true, message: 'Worker-confirmed receipt recorded. This confirmation is not independent bank or gateway verification. The job is now completed and both sides can rate each other.', payment: hydratePayment(updated), application: completedApplication });
  } catch (error) {
    console.error('[Payments] confirmPaymentReceived failed:', error);
    return res.status(500).json({ success: false, message: 'Could not confirm payment receipt. Please refresh and try again.' });
  }
};

export const disputePayment = async (req, res) => {
  try {
    const actorId = idOf(req.user);
    const payment = findOne('payments', p => idOf(p._id || p.id) === idOf(req.params.id));
    if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found.' });
    if (idOf(payment.workerId) !== actorId && idOf(payment.employerId) !== actorId) {
      return res.status(403).json({ success: false, message: 'You are not part of this payment.' });
    }
    if (payment.status === 'paid') return res.status(409).json({ success: false, message: 'A confirmed payment cannot be disputed here. Contact support for assistance.' });
    if (payment.status === 'disputed') return res.status(409).json({ success: false, message: 'This payment is already disputed.' });

    const reason = String(req.body?.reason || '').trim().slice(0, 500);
    if (reason.length < 5) return res.status(400).json({ success: false, message: 'Please explain the payment issue (at least 5 characters).' });
    const now = new Date().toISOString();
    const updated = update('payments', idOf(payment._id || payment.id), {
      status: 'disputed',
      dispute: { reason, raisedBy: actorId, raisedAt: now },
      events: [...(payment.events || []), { type: 'payment_disputed', actorId, at: now }]
    });
    if (!updated) return res.status(409).json({ success: false, message: 'Payment could not be updated. Refresh and try again.' });
    const otherParty = idOf(payment.workerId) === actorId ? payment.employerId : payment.workerId;
    notify(otherParty, 'Payment disputed', 'A payment has been disputed. Please review the payment record.', 'warning');
    if (!await persistOrFail(res)) return;
    return res.json({ success: true, message: 'Payment marked as disputed. The other party has been notified.', payment: hydratePayment(updated) });
  } catch (error) {
    console.error('[Payments] disputePayment failed:', error);
    return res.status(500).json({ success: false, message: 'Could not update the payment dispute. Please refresh and try again.' });
  }
};
