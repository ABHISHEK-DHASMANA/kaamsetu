import express from 'express';
import jwt from 'jsonwebtoken';
import { findOne } from '../services/storage.js';

const router = express.Router();

// Only curated, non-admin sample identities can be opened without credentials.
const DEMO_ACCOUNTS = {
  worker: { id: 'usr_ramesh_kumar', role: 'worker' },
  employer: { id: 'usr_sharma_services', role: 'employer' }
};

router.post('/demo-login', (req, res) => {
  if (process.env.PUBLIC_DEMO_LOGIN !== 'true') {
    return res.status(404).json({ success: false, message: 'Demo access is currently disabled.' });
  }

  const role = String(req.body?.role || '');
  const demoAccount = DEMO_ACCOUNTS[role];
  if (!demoAccount) {
    return res.status(400).json({ success: false, message: 'Choose a valid worker or employer demo account.' });
  }

  try {
    const user = findOne('users', item =>
      String(item._id || item.id) === demoAccount.id &&
      item.role === demoAccount.role &&
      item.isActive !== false
    );

    if (!user) {
      return res.status(503).json({ success: false, message: 'The sample account is not available right now. Please try again later.' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not configured.');

    const token = jwt.sign(
      { id: user._id || user.id, role: user.role, name: user.name, demo: true },
      secret,
      { expiresIn: '4h' }
    );

    const safeUser = { ...user };
    delete safeUser.password;
    delete safeUser.firebaseUid;
    delete safeUser.emailVerificationTokenHash;
    delete safeUser.emailVerificationExpiresAt;
    delete safeUser.emailVerificationLastSentAt;

    const profile = role === 'worker'
      ? findOne('workerProfiles', item => String(item.userId) === String(user._id || user.id))
      : findOne('employerProfiles', item => String(item.userId) === String(user._id || user.id));

    return res.status(200).json({
      success: true,
      message: 'Demo account opened. Changes may be visible to other demo visitors.',
      token,
      user: safeUser,
      profile,
      demo: true
    });
  } catch (error) {
    console.error('[Auth] Demo login failed:', error.message);
    return res.status(503).json({ success: false, message: 'Demo login is temporarily unavailable. Please try again.' });
  }
});

export default router;
