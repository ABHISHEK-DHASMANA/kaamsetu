import mongoose from 'mongoose';
import { isValidPhonePeWebhookAuthorization } from '../services/phonepeWebhookAuth.js';
import PaymentIntent from '../models/PaymentIntent.js';
import { findOne, insert } from '../services/storage.js';
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

const ensureMongo = res => {
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({ success: false, message: 'Secure online payments require the production MongoDB ledger. Online checkout is unavailable in demo storage.' });
    return false;
  }
  return true;
};

const safeStatus = intent => ({
  merchantOrderId: intent.merchantOrderId,
  applicationId: intent.applicationId,
  amount: intent.amount,
  currency: intent.currency,
  status: intent.status,
  payoutStatus: intent.payoutStatus || 'not_configured',
  providerState: intent.providerState,
  verifiedAt: intent.verifiedAt,
  createdAt: intent.createdAt
});

export const getPhonePeAvailability = (req, res) => {
  res.json({
    success: true,
    available: isPhonePeConfigured() && mongoose.connection.readyState === 1,
    webhookConfigured: Boolean(process.env.PHONEPE_WEBHOOK_USERNAME && process.env.PHONEPE_WEBHOOK_PASSWORD),
    environment: (process.env.PHONEPE_ENV || 'sandbox').toLowerCase(),
    message: isPhonePeConfigured()
      ? 'PhonePe credentials are configured. Checkout availability also requires MongoDB.'
      : 'PhonePe merchant credentials have not been configured.'
  });
};

export const getPhonePePaymentQuote = async (req, res) => {
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
    const paymentQuery = { applicationId: String(application._id || application.id) };
    const existingPayment = await PaymentIntent.findOne({ ...paymentQuery, status: 'paid' });
    const pendingPayment = await PaymentIntent.findOne({ ...paymentQuery, status: 'pending' });
    const directPayment = findOne('payments', p => String(p.applicationId) === String(application._id || application.id) && p.status !== 'cancelled');
    if (!Number.isFinite(amount) || amount < 1 || amount > 1000000) {
      return res.status(422).json({ success: false, message: 'The agreed payment cannot be calculated safely from the job listing. Please contact support.' });
    }
    res.json({ success: true, quote: { applicationId: String(application._id || application.id), jobTitle: job.title, workerName: findOne('workerProfiles', p => String(p.userId) === String(application.workerId))?.fullName || 'Worker', amount, currency: 'INR', wageType: job.wageType || 'daily', duration: job.workDuration || '', alreadyCollected: Boolean(existingPayment), directPaymentPending: Boolean(directPayment), directPaymentStatus: directPayment?.status || null, payoutStatus: existingPayment?.payoutStatus || null, checkoutPending: Boolean(pendingPayment), checkoutUrl: pendingPayment?.checkoutUrl || '' } });
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

    const directPayment = findOne('payments', p => String(p.applicationId) === String(applicationId) && p.status !== 'cancelled');
    if (directPayment) return res.status(409).json({ success: false, message: 'A direct UPI payment is already recorded for this job. Check its confirmation status before paying again.' });

    const existingPaid = await PaymentIntent.findOne({ applicationId, status: 'paid' });
    if (existingPaid) return res.status(409).json({ success: false, message: 'PhonePe has already collected payment for this job. Do not pay again; worker payout is awaiting the approved settlement process.' });

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
      applicationId: String(application._id || application.id),
      activeApplicationId: String(application._id || application.id),
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
      // A definite 4xx validation/auth rejection means PhonePe did not create an order.
      // A timeout, network failure, or 5xx is ambiguous: keep this order locked and pending
      // until the PhonePe status API or support can reconcile it, preventing duplicate charges.
      const providerStatus = Number(providerError.providerStatusCode || 0);
      const definitiveRejection = [400, 401, 403, 422, 429].includes(providerStatus);
      if (definitiveRejection) {
        intent.status = 'failed';
        intent.activeApplicationId = undefined;
        intent.providerState = 'INITIATION_FAILED';
      } else {
        intent.status = 'pending';
        intent.providerState = 'INITIATION_UNCERTAIN';
        providerError.paymentInitiationUncertain = true;
      }
      await intent.save();
      throw providerError;
    }
  } catch (error) {
    console.error('[PhonePe] Checkout creation failed:', error.message);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'A PhonePe checkout already exists for this job. Check its status before paying again.' });
    }
    if (error.paymentInitiationUncertain) {
      return res.status(503).json({ success: false, message: 'PhonePe did not confirm whether checkout was created. This order is being held pending to prevent duplicate charges. Refresh its status or contact KaamSetu support; do not start another payment.' });
    }
    return res.status(error.statusCode || 502).json({ success: false, message: error.statusCode === 503 ? error.message : 'Unable to start PhonePe checkout. Please check your payment status before trying again.' });
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
      if (provider.merchantOrderId && String(provider.merchantOrderId) !== String(intent.merchantOrderId)) {
        return res.status(409).json({ success: false, message: 'PhonePe returned a different merchant order. This payment remains unconfirmed; contact support.' });
      }
      if (intent.phonepeOrderId && provider.orderId && String(provider.orderId) !== String(intent.phonepeOrderId)) {
        return res.status(409).json({ success: false, message: 'PhonePe returned a different order ID. This payment remains unconfirmed; contact support.' });
      }
      if (state === 'COMPLETED') {
        if (!Number.isFinite(providerAmount) || providerAmount !== intent.amountPaisa) {
          return res.status(409).json({ success: false, message: 'Payment amount mismatch. The payment has not been marked as paid; contact support.' });
        }
        intent.status = 'paid';
        intent.verifiedAt = new Date();
        // PhonePe PG confirms collection into the merchant account; this is NOT proof
        // that a separate worker payout has happened. Keep payout explicitly pending.
        intent.payoutStatus = 'pending_provider_settlement';
        insert('notifications', {
          userId: String(intent.workerId),
          title: 'Employer payment received by KaamSetu',
          message: 'PhonePe confirmed collection of ₹' + intent.amount + '. Your worker payout is not yet confirmed; KaamSetu will update this status after the approved settlement process completes.',
          type: 'info', actionUrl: '/payments', isRead: false
        });
        insert('notifications', {
          userId: String(intent.employerId),
          title: 'Payment collected',
          message: 'PhonePe confirmed collection of ₹' + intent.amount + '. Worker payout is tracked separately and is not marked complete yet.',
          type: 'success', actionUrl: '/payments', isRead: false
        });
      } else if (['FAILED', 'EXPIRED', 'CANCELLED'].includes(state)) {
        intent.status = 'failed';
        intent.activeApplicationId = undefined;
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

export const receivePhonePeWebhook = async (req, res) => {
  try {
    if (!ensureMongo(res)) return;
    const authorization = req.get('authorization') || '';
    if (!isValidPhonePeWebhookAuthorization(authorization)) {
      return res.status(401).json({ success: false, message: 'Invalid PhonePe webhook authorization.' });
    }

    const event = String(req.body?.event || '').toLowerCase();
    if (!['checkout.order.completed', 'checkout.order.failed'].includes(event)) {
      return res.status(200).json({ success: true, ignored: true });
    }

    const payload = req.body?.payload || {};
    const merchantOrderId = String(payload.merchantOrderId || '');
    if (!merchantOrderId) {
      return res.status(400).json({ success: false, message: 'Webhook is missing merchantOrderId.' });
    }

    const intent = await PaymentIntent.findOne({ merchantOrderId });
    if (!intent) return res.status(404).json({ success: false, message: 'Payment order not found.' });

    const state = String(payload.state || '').toUpperCase();
    const amount = Number(payload.amount);
    if (intent.phonepeOrderId && payload.orderId && String(payload.orderId) !== String(intent.phonepeOrderId)) {
      return res.status(409).json({ success: false, message: 'Webhook order ID does not match the stored PhonePe order.' });
    }
    if (!Number.isFinite(amount) || amount !== intent.amountPaisa) {
      console.error('[PhonePe] Webhook amount mismatch for order:', merchantOrderId);
      return res.status(409).json({ success: false, message: 'Webhook amount does not match the stored order.' });
    }

    const wasPaid = intent.status === 'paid';
    if (event === 'checkout.order.completed' && state === 'COMPLETED') {
      if (!wasPaid) {
        intent.status = 'paid';
        intent.payoutStatus = 'pending_provider_settlement';
        intent.verifiedAt = new Date();
      }
    } else if (event === 'checkout.order.failed' && state === 'FAILED' && !wasPaid && intent.status === 'pending') {
      intent.status = 'failed';
      intent.activeApplicationId = undefined;
    } else {
      return res.status(200).json({ success: true, ignored: true });
    }

    intent.providerState = state;
    intent.providerResponse = {
      event,
      state,
      amount,
      orderId: String(payload.orderId || ''),
      paymentDetails: Array.isArray(payload.paymentDetails) ? payload.paymentDetails.map(item => ({
        paymentMode: item.paymentMode,
        transactionId: item.transactionId,
        state: item.state
      })) : []
    };
    await intent.save();

    if (!wasPaid && intent.status === 'paid') {
      insert('notifications', {
        userId: String(intent.workerId),
        title: 'Employer payment received by KaamSetu',
        message: 'PhonePe confirmed collection of ₹' + intent.amount + '. Your worker payout is not yet confirmed; KaamSetu will update this status after the approved settlement process completes.',
        type: 'info', actionUrl: '/payments', isRead: false
      });
      insert('notifications', {
        userId: String(intent.employerId),
        title: 'Payment collected',
        message: 'PhonePe confirmed collection of ₹' + intent.amount + '. Worker payout is tracked separately and is not marked complete yet.',
        type: 'success', actionUrl: '/payments', isRead: false
      });
    }

    return res.status(200).json({ success: true, received: true });
  } catch (error) {
    console.error('[PhonePe] Webhook processing failed:', error.message);
    return res.status(500).json({ success: false, message: 'Webhook could not be processed.' });
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
