import mongoose from 'mongoose';
import PaymentIntent from '../models/PaymentIntent.js';
import { findOne, find, insert, update, flushStorage } from '../services/storage.js';
import { createPhonePeCheckout, fetchPhonePeOrderStatus, isPhonePeConfigured } from '../services/phonepeService.js';

const currentUserId = user => user?._id || user?.id;

const getPromisedJobAmount = (job, application) => {
  const agreed = Number(application?.agreedPaymentAmount);
  if (Number.isFinite(agreed) && agreed > 0) return Math.round(agreed * 100) / 100;
  const rate = Number(job?.offeredWage);
  if (!Number.isFinite(rate) || rate <= 0) return null;
  const wageType = String(job?.wageType || 'daily').toLowerCase();
  if (wageType === 'task') return Math.round(rate * 100) / 100;
  const duration = String(job?.workDuration || '').toLowerCase();
  const match = duration.match(/(\\d+(?:\\.\\d+)?)\\s*(day|days|week|weeks|month|months)/);
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

const ensureMongo = res => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ success: false, message: 'Secure online payments require the production MongoDB ledger. Online checkout is unavailable in demo storage.' });
    return false;
  }
  return true;
};

const safeStatus = intent => ({
  merchantOrderId: intent.merchantOrderId,
  amount: intent.amount,
  currency: intent.currency,
  status: intent.status,
  providerState: intent.providerState,
  verifiedAt: intent.verifiedAt,
  createdAt: intent.createdAt
});

export const getPhonePeAvailability = (req, res) => {
  res.json({
    success: true,
    available: isPhonePeConfigured() && mongoose.connection.readyState === 1,
    environment: (process.env.PHONEPE_ENV || 'sandbox').toLowerCase(),
    message: isPhonePeConfigured()
      ? 'PhonePe credentials are configured. Checkout availability also requires MongoDB.'
      : 'PhonePe merchant credentials have not been configured.'
  });
};

export const getPhonePePaymentQuote = (req, res) => {
  try {
    if (!ensureMongo(res)) return;
    const employerId = currentUserId(req.user);
    const application = findOne('applications', a => String(a._id || a.id) === String(req.params.applicationId));
    if (!application || String(application.employerId) !== String(employerId)) {
      return res.status(404).json({ success: false, message: 'Job application not found for this employer.' });
    }
    if (application.status !== 'PaymentPending' || application.paymentMode !== 'online') {
      return res.status(409).json({ success: false, message: 'This job is not awaiting online payment.' });
    }
    const job = findOne('jobs', j => String(j._id || j.id) === String(application.jobId));
    if (!job) return res.status(404).json({ success: false, message: 'Job listing not found.' });
    const amount = getPromisedJobAmount(job, application);
    if (!Number.isFinite(amount) || amount < 1 || amount > 1000000) {
      return res.status(422).json({ success: false, message: 'The agreed payment cannot be calculated safely from the job listing. Please contact support.' });
    }
    res.json({ success: true, quote: { applicationId: String(application._id || application.id), jobTitle: job.title, workerName: findOne('workerProfiles', p => String(p.userId) === String(application.workerId))?.fullName || 'Worker', amount, currency: 'INR', wageType: job.wageType || 'daily', duration: job.workDuration || '' } });
  } catch (error) {
    console.error('[PhonePe] Quote failed:', error.message);
    res.status(500).json({ success: false, message: 'Could not calculate the agreed job payment.' });
  }
};

export const createPhonePePayment = async (req, res) => {
  try {
    if (!ensureMongo(res)) return;
    if (!isPhonePeConfigured()) {
      return res.status(503).json({ success: false, message: 'PhonePe merchant credentials are not configured. Checkout is disabled until the authorized business representative completes onboarding.' });
    }

    const employerId = currentUserId(req.user);
    const { applicationId } = req.body || {};
    if (!applicationId) return res.status(400).json({ success: false, message: 'Choose the job you want to pay for.' });

    const application = findOne('applications', a => String(a._id || a.id) === String(applicationId));
    if (!application || String(application.employerId) !== String(employerId)) {
      return res.status(404).json({ success: false, message: 'Job application not found for this employer.' });
    }
    if (application.status !== 'PaymentPending' || application.paymentMode !== 'online') {
      return res.status(400).json({ success: false, message: 'This job is not awaiting an online payment.' });
    }
    const job = findOne('jobs', j => String(j._id || j.id) === String(application.jobId));
    if (!job) return res.status(404).json({ success: false, message: 'The original job listing could not be found.' });
    const numericAmount = getPromisedJobAmount(job, application);
    if (!Number.isFinite(numericAmount) || numericAmount < 1 || numericAmount > 1000000) {
      return res.status(400).json({ success: false, message: 'The agreed job amount cannot be calculated safely from this listing. Ask support to review the job payment terms before collecting payment.' });
    }

    const existingPaid = await PaymentIntent.findOne({ applicationId, status: 'paid' });
    if (existingPaid) return res.status(409).json({ success: false, message: 'This completed job already has a verified online payment.' });

    const existingPending = await PaymentIntent.findOne({ applicationId, status: 'pending' });
    if (existingPending) {
      return res.status(409).json({ success: false, message: 'A checkout is already pending for this job. Check its payment status before creating another.' });
    }

    const amountPaisa = Math.round(numericAmount * 100);
    const merchantOrderId = `KS${Date.now()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const clientUrl = (process.env.CLIENT_URL || '').replace(/\/$/, '');
    if (!clientUrl) return res.status(503).json({ success: false, message: 'CLIENT_URL is not configured on the server.' });

    const intent = await PaymentIntent.create({
      merchantOrderId,
      applicationId,
      jobId: application.jobId,
      employerId,
      workerId: application.workerId,
      amount: amountPaisa / 100,
      amountPaisa,
      status: 'pending'
    });

    try {
      const checkout = await createPhonePeCheckout({
        merchantOrderId,
        amountPaisa,
        redirectUrl: `${clientUrl}/payments?merchantOrderId=${encodeURIComponent(merchantOrderId)}`
      });
      if (!checkout.redirectUrl) throw new Error('PhonePe did not return a checkout URL.');
      intent.phonepeOrderId = checkout.orderId || '';
      intent.checkoutUrl = checkout.redirectUrl;
      intent.providerState = checkout.state || 'PENDING';
      intent.providerResponse = { state: checkout.state || 'PENDING', orderId: checkout.orderId || '' };
      await intent.save();

      return res.status(201).json({
        success: true,
        message: 'Secure checkout created. Complete payment on PhonePe.',
        checkoutUrl: intent.checkoutUrl,
        payment: safeStatus(intent)
      });
    } catch (providerError) {
      intent.status = 'failed';
      intent.providerState = 'INITIATION_FAILED';
      await intent.save();
      throw providerError;
    }
  } catch (error) {
    console.error('[PhonePe] Checkout creation failed:', error.message);
    res.status(error.statusCode || 502).json({ success: false, message: error.statusCode === 503 ? error.message : 'Unable to start PhonePe checkout. Please try again later.' });
  }
};

export const getPhonePePaymentStatus = async (req, res) => {
  try {
    if (!ensureMongo(res)) return;
    const intent = await PaymentIntent.findOne({ merchantOrderId: req.params.merchantOrderId });
    if (!intent) return res.status(404).json({ success: false, message: 'Payment order not found.' });

    const userId = currentUserId(req.user);
    if (intent.employerId !== userId && intent.workerId !== userId) {
      return res.status(403).json({ success: false, message: 'You are not authorized to view this payment.' });
    }

    if (intent.status === 'pending') {
      const provider = await fetchPhonePeOrderStatus(intent.merchantOrderId);
      const state = String(provider.state || 'PENDING').toUpperCase();
      const providerAmount = Number(provider.amount);
      if (state === 'COMPLETED') {
        if (!Number.isFinite(providerAmount) || providerAmount !== intent.amountPaisa) {
          return res.status(409).json({ success: false, message: 'Payment amount mismatch. The payment has not been marked as paid; contact support.' });
        }
        intent.status = 'paid';
        intent.verifiedAt = new Date();
        const application = findOne('applications', a => String(a._id || a.id) === String(intent.applicationId));
        if (application && application.status === 'PaymentPending' && application.paymentMode === 'online') {
          const now = new Date().toISOString();
          const existingLedgerPayment = findOne('payments', p => String(p.applicationId) === String(intent.applicationId) && p.method === 'phonepe_gateway');
          if (!existingLedgerPayment) {
            insert('payments', {
              applicationId: String(intent.applicationId), jobId: String(intent.jobId),
              employerId: String(intent.employerId), workerId: String(intent.workerId),
              amount: intent.amount, currency: 'INR', method: 'phonepe_gateway',
              transactionReference: String(provider.orderId || intent.phonepeOrderId || intent.merchantOrderId),
              note: 'Automatically confirmed by PhonePe server-side order status.',
              employerConfirmed: true, workerConfirmed: true, status: 'paid',
              verificationType: 'phonepe_gateway', confirmedAt: now,
              events: [{ type: 'phonepe_gateway_payment_verified', actorId: 'phonepe', at: now }]
            });
          }
          update('applications', String(application._id || application.id), {
            status: 'Completed', completedAt: now, paymentConfirmedAt: now, paymentProvider: 'phonepe'
          });
          const workerProfile = findOne('workerProfiles', p => String(p.userId) === String(intent.workerId));
          if (workerProfile) {
            const passport = workerProfile.skillPassport || {};
            update('workerProfiles', String(workerProfile._id || workerProfile.id), {
              skillPassport: { ...passport, completedJobsCount: (passport.completedJobsCount || 0) + 1 }
            });
          }
          const job = findOne('jobs', j => String(j._id || j.id) === String(intent.jobId));
          const otherActive = find('applications', a => String(a.jobId) === String(intent.jobId) && String(a._id || a.id) !== String(intent.applicationId) && ['Accepted', 'InProgress', 'CompletionRequested', 'PaymentPending'].includes(a.status));
          if (job) update('jobs', String(job._id || job.id), { status: otherActive.length ? 'in_progress' : 'completed' });
          insert('notifications', { userId: String(intent.workerId), title: 'Payment received', message: 'PhonePe confirmed your job payment of ₹' + intent.amount + '. Your job is now completed.', type: 'success', actionUrl: '/payments', isRead: false });
          insert('notifications', { userId: String(intent.employerId), title: 'Payment successful', message: 'PhonePe confirmed your payment of ₹' + intent.amount + '. The job is now completed.', type: 'success', actionUrl: '/payments', isRead: false });
          await flushStorage();
        }
      } else if (state === 'FAILED') {
        intent.status = 'failed';
      }
      intent.providerState = state;
      intent.providerResponse = {
        state,
        amount: Number.isFinite(providerAmount) ? providerAmount : null,
        paymentDetails: Array.isArray(provider.paymentDetails) ? provider.paymentDetails.map(item => ({
          paymentMode: item.paymentMode,
          transactionId: item.transactionId,
          state: item.state
        })) : []
      };
      await intent.save();
    }

    return res.json({ success: true, payment: safeStatus(intent) });
  } catch (error) {
    console.error('[PhonePe] Status verification failed:', error.message);
    res.status(error.statusCode || 502).json({ success: false, message: 'Could not verify payment with PhonePe right now. The payment remains unconfirmed until verification succeeds.' });
  }
};

export const listMyPhonePePayments = async (req, res) => {
  try {
    if (!ensureMongo(res)) return;
    const id = currentUserId(req.user);
    const records = await PaymentIntent.find({ $or: [{ employerId: id }, { workerId: id }] }).sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, payments: records.map(record => safeStatus(record)) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Unable to load online payment history.' });
  }
};
