import mongoose from 'mongoose';
import PaymentIntent from '../models/PaymentIntent.js';
import { findOne } from '../services/storage.js';
import { createPhonePeCheckout, fetchPhonePeOrderStatus, isPhonePeConfigured } from '../services/phonepeService.js';

const currentUserId = user => user?._id || user?.id;

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

export const createPhonePePayment = async (req, res) => {
  try {
    if (!ensureMongo(res)) return;
    if (!isPhonePeConfigured()) {
      return res.status(503).json({ success: false, message: 'PhonePe merchant credentials are not configured. Checkout is disabled until the authorized business representative completes onboarding.' });
    }

    const employerId = currentUserId(req.user);
    const { applicationId, amount } = req.body || {};
    const numericAmount = Number(amount);
    if (!applicationId || !Number.isFinite(numericAmount) || numericAmount < 1 || numericAmount > 1000000) {
      return res.status(400).json({ success: false, message: 'Choose a completed job and enter a valid amount.' });
    }

    const application = findOne('applications', a => (a._id || a.id) === applicationId);
    if (!application || application.employerId !== employerId) {
      return res.status(404).json({ success: false, message: 'Completed job application not found for this employer.' });
    }
    if (application.status !== 'Completed') {
      return res.status(400).json({ success: false, message: 'Online payment is available only after the job is marked completed.' });
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
        if (Number.isFinite(providerAmount) && providerAmount !== intent.amountPaisa) {
          return res.status(409).json({ success: false, message: 'Payment amount mismatch. The payment has not been marked as paid; contact support.' });
        }
        intent.status = 'paid';
        intent.verifiedAt = new Date();
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
