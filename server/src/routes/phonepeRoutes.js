import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { createPhonePePayment, getPhonePePaymentStatus, getPhonePeAvailability, listMyPhonePePayments, getPhonePePaymentQuote, receivePhonePeWebhook } from '../controllers/phonepeController.js';

const router = express.Router();
router.post('/webhook', receivePhonePeWebhook);
router.get('/availability', protect, authorize('worker', 'employer'), getPhonePeAvailability);
router.get('/me', protect, authorize('worker', 'employer'), listMyPhonePePayments);
router.get('/quote/:applicationId', protect, authorize('employer'), getPhonePePaymentQuote);
router.post('/checkout', protect, authorize('employer'), createPhonePePayment);
router.get('/:merchantOrderId/status', protect, authorize('worker', 'employer'), getPhonePePaymentStatus);
export default router;
