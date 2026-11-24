import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { listMyPayments, getPaymentQuote, createPayment, confirmPaymentReceived, disputePayment } from '../controllers/paymentController.js';

const router = express.Router();
router.use(protect);
router.get('/me', authorize('worker', 'employer'), listMyPayments);
router.get('/quote/:applicationId', authorize('employer'), getPaymentQuote);
router.post('/', authorize('employer'), createPayment);
router.put('/:id/confirm-received', authorize('worker'), confirmPaymentReceived);
router.post('/:id/dispute', authorize('worker', 'employer'), disputePayment);
export default router;
