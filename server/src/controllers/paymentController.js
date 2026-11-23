import mongoose from 'mongoose';
import PaymentIntent from '../models/PaymentIntent.js';
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
  try {
    const employerId = idOf(req.user);
    const { applicationId, amount, method, transactionReference, note } = req.body || {};
    const normalizedApplicationId = idOf(applicationId);
    if (!normalizedApplicationId || method !== 'direct_upi') {
      return res.status(400).json({ success: false, message: 'Choose a job awaiting online UPI payment.' });
    }
    const normalizedReference = String(transactionReference || '').trim();
    if (!/^[A-Za-z0-9._-]{6,100}$/.test(normalizedReference)) {
      return res.status(400).json({ success: false, message: 'Enter the UPI transaction reference / UTR shown by your payment app.' });
    }

    const application = findOne('applications', a => idOf(a._id || a.id) === normalizedApplicationId);
    if (!application || idOf(application.employerId) !== employerId) {
      return res.status(404).json({ success: false, message: 'Job application not found for this employer.' });
    }
    if (application.status !== 'PaymentPending' || application.paymentMode !== 'online') {
      return res.status(409).json({ success: false, message: 'This job is not awaiting online payment.' });
    }
    const job = findOne('jobs', j => idOf(j._id || j.id) === idOf(application.jobId));
    if (!job) return res.status(404).json({ success: false, message: 'Job listing not found.' });

    const agreed = Number(application.agreedPaymentAmount);
    let expectedAmount = Number.isFinite(agreed) && agreed > 0 ? agreed : null;
    if (expectedAmount === null) {
      const rate = Number(job.offeredWage);
      const wageType = String(job.wageType || 'daily').toLowerCase();
      if (Number.isFinite(rate) && rate > 0 && wageType === 'task') expectedAmount = rate;
      else {
        const duration = String(job.workDuration || '').toLowerCase();
        const match = duration.match(/(\\d+(?:\\.\\d+)?)\\s*(day|days|week|weeks|month|months)/);
        if (match) {
          const count = Number(match[1]);
          if (Number.isFinite(count) && count > 0 && wageType === 'daily') {
            const days = match[2].startsWith('week') ? count * 7 : match[2].startsWith('month') ? count * 30 : count;
            expectedAmount = rate * days;
          } else if (Number.isFinite(count) && count > 0 && wageType === 'monthly') {
            expectedAmount = rate * (match[2].startsWith('month') ? count : match[2].startsWith('week') ? count / 4.345 : count / 30);
          }
        }
      }
    }
    expectedAmount = Number.isFinite(expectedAmount) ? Math.round(expectedAmount * 100) / 100 : null;
    const submittedAmount = Number(amount);
    if (!expectedAmount || expectedAmount < 1 || expectedAmount > 1000000 ||
        !Number.isFinite(submittedAmount) || Math.round(submittedAmount * 100) !== Math.round(expectedAmount * 100)) {
      return res.status(409).json({ success: false, message: 'The payment amount does not match the agreed job amount. Refresh the payment page before paying.' });
    }

    const existing = findOne('payments', p => idOf(p.applicationId) === normalizedApplicationId && p.status !== 'cancelled');
    if (existing) return res.status(409).json({ success: false, message: 'A payment record already exists for this job. Check payment history before trying again.' });
    if (mongoose.connection.readyState === 1) {
      const gatewayOrder = await PaymentIntent.findOne({ applicationId: normalizedApplicationId, status: { $in: ['pending', 'paid'] } });
      if (gatewayOrder) return res.status(409).json({ success: false, message: 'A PhonePe checkout already exists for this job. Check its status before using direct UPI.' });
    }

    const payment = insert('payments', {
      applicationId: normalizedApplicationId,
      jobId: idOf(application.jobId),
      employerId,
      workerId: idOf(application.workerId),
      amount: expectedAmount,
      currency: 'INR',
      method: 'direct_upi',
      transactionReference: normalizedReference,
      note: String(note || '').trim().slice(0, 300),
      employerConfirmed: true,
      workerConfirmed: false,
      status: 'awaiting_worker_confirmation',
      verificationType: 'two_party_confirmation',
      confirmedAt: null,
      events: [{ type: 'employer_recorded_payment', actorId: employerId, at: new Date().toISOString() }]
    });

    notify(application.workerId, 'UPI payment confirmation requested',
      'Your employer recorded a direct UPI payment of ₹' + payment.amount + '. Check your own UPI app and confirm only if the amount has arrived.');
    if (!await persistOrFail(res)) return;
    return res.status(201).json({
      success: true,
      message: 'UPI payment reference recorded. The worker must confirm receipt before the job is marked completed.',
      payment: hydratePayment(payment)
    });
  } catch (error) {
    console.error('[Payments] createPayment failed:', error);
    return res.status(500).json({ success: false, message: 'Could not record the UPI payment. Please refresh and try again.' });
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
