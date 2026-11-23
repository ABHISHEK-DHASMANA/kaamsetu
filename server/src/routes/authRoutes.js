import express from 'express';
import {
  register, login, getMe, firebaseLogin,
  verifyEmail, resendEmailVerification, deleteAccount
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import demoAuthRoutes from './demoAuthRoutes.js';

const router = express.Router();

router.use(demoAuthRoutes);

router.post('/register', register);
router.post('/login', login);
router.post('/firebase', firebaseLogin);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendEmailVerification);
router.get('/me', protect, getMe);
router.delete('/account', protect, deleteAccount);

export default router;
