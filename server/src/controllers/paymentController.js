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

export const createPayment = async (req, res) => {
  return res.status(410).json({
    success: false,
    message: 'Manual UPI reference entry is no longer supported. Use the secure PhonePe checkout from the Payments page.'
  });
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
    if (!application || application.status !== 'PaymentPending' || application.paymentMode !== 'online') {
      return res.status(409).json({ success: false, message: 'The job is no longer waiting for this online payment. Contact support before retrying.' });
    }
    const updated = update('payments', idOf(payment._id || payment.id), {
      workerConfirmed: true,
      status: 'paid',
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
    return res.json({ success: true, message: 'Online payment confirmed. The job is now completed and both sides can rate each other.', payment: hydratePayment(updated), application: completedApplication });
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
