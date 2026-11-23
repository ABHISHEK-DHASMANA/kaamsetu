import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { find, findOne, update, remove, flushStorage } from '../services/storage.js';
import { getFirebaseAdminAuth } from '../config/firebaseAdmin.js';

const idOf = value => String(value?._id || value?.id || value || '');

export const deleteMyAccount = async (req, res) => {
  try {
    if (!['worker', 'employer'].includes(req.user?.role)) {
      return res.status(403).json({ success: false, message: 'Only worker and employer accounts can be deleted here.' });
    }
    const userId = idOf(req.user);
    const user = findOne('users', item => idOf(item) === userId);
    if (!user || user.accountDeleted === true) {
      return res.status(404).json({ success: false, message: 'Account not found or already deleted.' });
    }
    const password = String(req.body?.password || '');
    if (!password || !(await bcrypt.compare(password, user.password || ''))) {
      return res.status(401).json({ success: false, code: 'REAUTHENTICATION_REQUIRED', message: 'Enter your current password to confirm account deletion.' });
    }

    if (user.firebaseUid) {
      try {
        await getFirebaseAdminAuth().deleteUser(user.firebaseUid);
      } catch (firebaseError) {
        if (firebaseError.code !== 'auth/user-not-found') {
          console.warn('[Account] Firebase identity cleanup did not complete:', firebaseError.message);
        }
      }
    }

    const now = new Date().toISOString();
    const replacementPassword = await bcrypt.hash(randomBytes(48).toString('hex'), 12);
    const anonymized = update('users', userId, {
      name: 'Deleted account',
      phone: '',
      phoneVerified: false,
      email: '',
      emailVerified: false,
      emailVerificationTokenHash: '',
      emailVerificationExpiresAt: null,
      firebaseUid: '',
      password: replacementPassword,
      avatar: '',
      isActive: false,
      accountDeleted: true,
      deletedAt: now,
      verificationStatus: 'Registered'
    });
    if (!anonymized) return res.status(409).json({ success: false, message: 'The account could not be deleted. Please refresh and try again.' });

    // Remove profile/contact data, but retain jobs, applications, reviews and payment records for history and reconciliation.
    const profileCollection = user.role === 'worker' ? 'workerProfiles' : 'employerProfiles';
    for (const profile of find(profileCollection, item => idOf(item.userId) === userId)) {
      remove(profileCollection, idOf(profile));
    }
    for (const notification of find('notifications', item => idOf(item.userId) === userId)) {
      remove('notifications', idOf(notification));
    }
    for (const saved of find('savedJobs', item => idOf(item.userId) === userId || idOf(item.workerId) === userId)) {
      remove('savedJobs', idOf(saved));
    }
    for (const block of find('userBlocks', item => idOf(item.blockerId) === userId || idOf(item.blockedId) === userId)) {
      remove('userBlocks', idOf(block));
    }
    for (const message of find('messages', item => idOf(item.senderId) === userId)) {
      remove('messages', idOf(message));
    }
    if (user.role === 'employer') {
      for (const job of find('jobs', item => idOf(item.employerId) === userId && ['active', 'open'].includes(String(item.status || '').toLowerCase()))) {
        update('jobs', idOf(job), { status: 'closed', closedAt: now, closureReason: 'Employer account deleted' });
      }
    }

    await flushStorage();
    return res.json({
      success: true,
      message: 'Account deleted and personal profile information anonymized. Historical applications, reviews and payment records were retained.'
    });
  } catch (error) {
    console.error('[Account] Deletion failed:', error.message);
    return res.status(503).json({ success: false, message: 'Account deletion could not be completed safely. Please try again or contact support.' });
  }
};
