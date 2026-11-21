import { find, findOne, insert, update } from '../services/storage.js';

const userId = user => user?._id || user?.id;

const hydratePayment = payment => {
  const job = findOne('jobs', j => (j._id || j.id) === payment.jobId);
  const worker = findOne('workerProfiles', p => p.userId === payment.workerId);
  const employer = findOne('employerProfiles', p => p.userId === payment.employerId);
  return {
    ...payment,
    jobTitle: job?.title || 'Completed job',
    workerName: worker?.fullName || 'Worker',
    employerName: employer?.companyName || 'Employer'
  };
};

export const listMyPayments = (req, res) => {
  const id = userId(req.user);
  const payments = find('payments', p => p.workerId === id || p.employerId === id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(hydratePayment);
  const isWorker = req.user.role === 'worker';
  const own = payments.filter(p => isWorker ? p.workerId === id : p.employerId === id);
  const paid = own.filter(p => p.status === 'paid');
  const pending = own.filter(p => p.status !== 'paid' && p.status !== 'disputed');
  res.json({
    success: true,
    payments: own,
    summary: {
      paidTotal: paid.reduce((sum, p) => sum + p.amount, 0),
      onlineTotal: paid.filter(p => p.method === 'online').reduce((sum, p) => sum + p.amount, 0),
      offlineTotal: paid.filter(p => p.method !== 'online').reduce((sum, p) => sum + p.amount, 0),
      pendingTotal: pending.reduce((sum, p) => sum + p.amount, 0),
      paidCount: paid.length
    }
  });
};

export const createPayment = (req, res) => {
  const employerId = userId(req.user);
  const { applicationId, amount, method, transactionReference, note } = req.body || {};
  const numericAmount = Number(amount);

  if (!applicationId || !Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > 1000000) {
    return res.status(400).json({ success: false, message: 'Choose a completed job and enter a valid amount.' });
  }
  if (!['cash', 'direct_upi'].includes(method)) {
    return res.status(400).json({ success: false, message: 'Live online payments are not enabled yet. Use Cash or Direct UPI for now.' });
  }

  const application = findOne('applications', a => (a._id || a.id) === applicationId);
  if (!application || application.employerId !== employerId) {
    return res.status(404).json({ success: false, message: 'Completed job application not found for this employer.' });
  }
  if (application.status !== 'Completed') {
    return res.status(400).json({ success: false, message: 'Payments can only be recorded after the employer marks the job completed.' });
  }
  const existing = findOne('payments', p => p.applicationId === applicationId && p.status !== 'cancelled');
  if (existing) {
    return res.status(409).json({ success: false, message: 'A payment record already exists for this job.' });
  }

  const payment = insert('payments', {
    applicationId,
    jobId: application.jobId,
    employerId,
    workerId: application.workerId,
    amount: Math.round(numericAmount * 100) / 100,
    currency: 'INR',
    method,
    transactionReference: method === 'direct_upi' ? String(transactionReference || '').trim().slice(0, 100) : '',
    note: String(note || '').trim().slice(0, 300),
    employerConfirmed: true,
    workerConfirmed: false,
    status: 'awaiting_worker_confirmation',
    verificationType: 'two_party_confirmation',
    confirmedAt: null,
    events: [{ type: 'employer_recorded_payment', actorId: employerId, at: new Date().toISOString() }]
  });

  insert('notifications', {
    userId: application.workerId,
    title: 'Payment confirmation requested',
    message: `Your employer recorded ₹${payment.amount} for a completed job. Please confirm only if you received it.`,
    type: 'info',
    actionUrl: '/payments',
    isRead: false
  });

  res.status(201).json({ success: true, message: 'Payment recorded. Waiting for the worker to confirm receipt.', payment: hydratePayment(payment) });
};

export const confirmPaymentReceived = (req, res) => {
  const workerId = userId(req.user);
  const payment = findOne('payments', p => (p._id || p.id) === req.params.id);
  if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found.' });
  if (payment.workerId !== workerId) return res.status(403).json({ success: false, message: 'Only the assigned worker can confirm receipt.' });
  if (payment.status === 'disputed') return res.status(409).json({ success: false, message: 'This payment is under dispute.' });
  if (payment.status === 'paid') return res.json({ success: true, message: 'Payment was already confirmed.', payment: hydratePayment(payment) });

  const updated = update('payments', payment._id, {
    workerConfirmed: true,
    status: 'paid',
    confirmedAt: new Date().toISOString(),
    events: [...(payment.events || []), { type: 'worker_confirmed_receipt', actorId: workerId, at: new Date().toISOString() }]
  });
  insert('notifications', {
    userId: payment.employerId,
    title: 'Worker confirmed payment',
    message: `The worker confirmed receipt of ₹${payment.amount}.`,
    type: 'success',
    actionUrl: '/payments',
    isRead: false
  });
  res.json({ success: true, message: 'Receipt confirmed. Earnings have been updated.', payment: hydratePayment(updated) });
};

export const disputePayment = (req, res) => {
  const id = userId(req.user);
  const payment = findOne('payments', p => (p._id || p.id) === req.params.id);
  if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found.' });
  if (payment.workerId !== id && payment.employerId !== id) {
    return res.status(403).json({ success: false, message: 'You are not part of this payment.' });
  }
  if (payment.status === 'paid') return res.status(409).json({ success: false, message: 'A confirmed payment cannot be disputed here. Contact support for assistance.' });
  const reason = String(req.body?.reason || '').trim().slice(0, 500);
  if (reason.length < 5) return res.status(400).json({ success: false, message: 'Please explain the payment issue (at least 5 characters).' });
  const updated = update('payments', payment._id, {
    status: 'disputed',
    dispute: { reason, raisedBy: id, raisedAt: new Date().toISOString() },
    events: [...(payment.events || []), { type: 'payment_disputed', actorId: id, at: new Date().toISOString() }]
  });
  insert('notifications', {
    userId: id === payment.workerId ? payment.employerId : payment.workerId,
    title: 'Payment disputed',
    message: 'A payment has been disputed. Please review the payment record.',
    type: 'warning',
    actionUrl: '/payments',
    isRead: false
  });
  res.json({ success: true, message: 'Payment marked as disputed.', payment: hydratePayment(updated) });
};
