import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { listMyPayments, createPayment, confirmPaymentReceived, disputePayment } from '../controllers/paymentController.js';

const router = express.Router();
router.use(protect);
router.get('/me', authorize('worker', 'employer'), listMyPayments);
router.post('/', authorize('employer'), createPayment);
router.put('/:id/confirm-received', authorize('worker'), confirmPaymentReceived);
router.post('/:id/dispute', authorize('worker', 'employer'), disputePayment);
export default router;
