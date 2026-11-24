import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
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

const buildProviderSnapshot = (state, payload = {}, event) => ({
  ...(event ? { event } : {}),
  state,
  amount: Number.isFinite(Number(payload.amount)) ? Number(payload.amount) : null,
  ...(payload.orderId ? { orderId: String(payload.orderId) } : {}),
  paymentDetails: Array.isArray(payload.paymentDetails)
    ? payload.paymentDetails.map(item => ({
        paymentMode: item.paymentMode,
        transactionId: item.transactionId,
        state: item.state,
        errorCode: item.errorCode,
        detailedErrorCode: item.detailedErrorCode
      }))
    : []
});

const notifyCollectionVerified = intent => {
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
};

// Only the first transition out of pending may win. This makes webhook and
// status-poll races idempotent and prevents late provider responses reversing
// a final paid/failed state.
const applyProviderStateIfPending = async (intent, state, providerResponse) => {
  const set = { providerState: state, providerResponse };
  const update = { $set: set };
  const completed = state === 'COMPLETED';
  const failed = ['FAILED', 'EXPIRED', 'CANCELLED'].includes(state);

  if (completed) {
    Object.assign(set, {
      status: 'paid',
      payoutStatus: 'pending_provider_settlement',
      verifiedAt: new Date()
    });
  } else if (failed) {
    set.status = 'failed';
    update.$unset = { activeApplicationId: 1 };
  }

  const changed = await PaymentIntent.findOneAndUpdate(
    { _id: intent._id, status: 'pending' },
    update,
    { new: true, runValidators: true }
  );
  if (changed) {
    if (completed) notifyCollectionVerified(changed);
    return changed;
  }
  return await PaymentIntent.findById(intent._id) || intent;
};

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
    const merchantOrderId = `KS${randomUUID().replace(/-/g, '').toUpperCase()}`;
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
      // Update only checkout metadata. A webhook may have already marked this
      // order paid while the create-checkout request was completing.
      await PaymentIntent.updateOne(
        { _id: intent._id },
        { $set: {
          phonepeOrderId: checkout.orderId || '',
          checkoutUrl: checkout.redirectUrl,
          providerState: checkout.state || 'PENDING',
          providerResponse: { state: checkout.state || 'PENDING', orderId: checkout.orderId || '' }
        } }
      );
      const savedIntent = await PaymentIntent.findById(intent._id);

      return res.status(201).json({
        success: true,
        message: 'Secure checkout created. Complete payment on PhonePe.',
        checkoutUrl: intent.checkoutUrl,
        payment: safeStatus(savedIntent || intent)
      });
    } catch (providerError) {
      // A definite 4xx validation/auth rejection means PhonePe did not create an order.
      // A timeout, network failure, or 5xx is ambiguous: keep this order locked and pending
      // until the PhonePe status API or support can reconcile it, preventing duplicate charges.
      const providerStatus = Number(providerError.providerStatusCode || 0);
      const definitiveRejection = [400, 401, 403, 422, 429].includes(providerStatus);
      if (definitiveRejection) {
        // Only release the order lock if no authenticated webhook/status poll has
        // already completed the payment.
        await PaymentIntent.updateOne(
          { _id: intent._id, status: 'pending' },
          { $set: { providerState: 'INITIATION_FAILED', status: 'failed' }, $unset: { activeApplicationId: 1 } }
        );
      } else {
        await PaymentIntent.updateOne(
          { _id: intent._id, status: 'pending' },
          { $set: { providerState: 'INITIATION_UNCERTAIN' } }
        );
        providerError.paymentInitiationUncertain = true;
      }
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

    let currentIntent = intent;
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
      if (state === 'COMPLETED' && (!Number.isFinite(providerAmount) || providerAmount !== intent.amountPaisa)) {
        return res.status(409).json({ success: false, message: 'Payment amount mismatch. The payment has not been marked as paid; contact support.' });
      }

      const providerResponse = buildProviderSnapshot(state, provider);
      currentIntent = await applyProviderStateIfPending(intent, state, providerResponse);
    }

    return res.json({ success: true, payment: safeStatus(currentIntent) });
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

    const isCompletedEvent = event === 'checkout.order.completed' && state === 'COMPLETED';
    const isFailedEvent = event === 'checkout.order.failed' && state === 'FAILED';
    if (!isCompletedEvent && !isFailedEvent) {
      return res.status(200).json({ success: true, ignored: true });
    }

    await applyProviderStateIfPending(
      intent,
      state,
      buildProviderSnapshot(state, payload, event)
    );

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
