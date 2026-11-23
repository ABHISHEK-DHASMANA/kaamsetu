import express from 'express';
import { register, login, getMe, firebaseLogin, verifyEmail, resendVerification } from '../controllers/authController.js';
import { deleteMyAccount } from '../controllers/accountController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/firebase', firebaseLogin);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.get('/me', protect, getMe);
router.delete('/account', protect, deleteMyAccount);

export default router;
