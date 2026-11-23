import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { find, findOne, insert, update, remove } from '../services/storage.js';
import { createHash, randomBytes } from 'node:crypto';
import { isEmailDeliveryConfigured, sendVerificationEmail } from '../services/emailService.js';
import { getFirebaseAdminAuth } from '../config/firebaseAdmin.js';

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured.');
  return jwt.sign(
    { id: user._id || user.id, role: user.role, name: user.name, phone: user.phone },
    secret,
    { expiresIn: '30d' }
  );
};

const normalizePhone = value => {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.startsWith('0091')) digits = digits.slice(4);
  else if (digits.startsWith('91') && digits.length === 12) digits = digits.slice(2);
  else if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1);
  return digits;
};

export const firebaseLogin = async (req, res) => {
  try {
    const authorization = req.headers.authorization || '';
    const idToken = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
    if (!idToken) {
      return res.status(401).json({ success: false, message: 'A Firebase ID token is required.' });
    }

    const firebaseAuth = getFirebaseAdminAuth();
    const decoded = await firebaseAuth.verifyIdToken(idToken, true);
    const firebaseUser = await firebaseAuth.getUser(decoded.uid);
    const hasVerifiedPhoneProvider = decoded.firebase?.sign_in_provider === 'phone' ||
      firebaseUser.providerData?.some(provider => provider.providerId === 'phone');
    const hasVerifiedGoogleEmail = decoded.firebase?.sign_in_provider === 'google.com' &&
      decoded.email_verified === true && !!decoded.email &&
      firebaseUser.providerData?.some(provider => provider.providerId === 'google.com');

    let user = null;
    if (hasVerifiedGoogleEmail) {
      const verifiedEmail = String(decoded.email).trim().toLowerCase();
      // A Google-verified address may only match an app account after that
      // address was independently verified during the app's registration flow.
      user = findOne('users', candidate =>
        candidate.emailVerified === true &&
        String(candidate.email || '').trim().toLowerCase() === verifiedEmail
      );
    }
    if (!user && hasVerifiedPhoneProvider && decoded.phone_number) {
      const verifiedPhone = normalizePhone(decoded.phone_number);
      if (verifiedPhone.length < 10) {
        return res.status(400).json({ success: false, message: 'Firebase returned an invalid phone number.' });
      }
      user = findOne('users', candidate => normalizePhone(candidate.phone) === verifiedPhone);
    }
    if (!hasVerifiedGoogleEmail && !hasVerifiedPhoneProvider) {
      return res.status(403).json({ success: false, message: 'Use a verified Google account or verify your mobile number to sign in.' });
    }
    if (!user) {
      return res.status(404).json({
        success: false,
        code: 'ACCOUNT_NOT_FOUND',
        message: 'No KAAMSETU account is linked to this verified Google email or phone number. Register first, or link your registered phone using OTP.'
      });
    }

    if (user.firebaseUid !== decoded.uid) update('users', user._id || user.id, { firebaseUid: decoded.uid });

    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: 'This account has been suspended by administration.' });
    }

    const token = generateToken(user);
    const userSafe = { ...user };
    delete userSafe.password;
    delete userSafe.firebaseUid;
    delete userSafe.emailVerificationTokenHash;
    delete userSafe.emailVerificationExpiresAt;
    delete userSafe.emailVerificationLastSentAt;

    let profile = null;
    if (user.role === 'worker') {
      profile = findOne('workerProfiles', item => item.userId === user._id || item.userId === user.id);
    } else if (user.role === 'employer') {
      profile = findOne('employerProfiles', item => item.userId === user._id || item.userId === user.id);
    }

    return res.status(200).json({
      success: true,
      message: 'Firebase phone verification successful.',
      token,
      user: userSafe,
      profile
    });
  } catch (error) {
    console.error('[Auth] Firebase sign-in failed:', error.message);
    const isTokenError = error.code?.startsWith('auth/');
    return res.status(isTokenError ? 401 : 503).json({
      success: false,
      message: isTokenError
        ? 'Firebase sign-in token is invalid, expired, or revoked.'
        : 'Firebase authentication is temporarily unavailable.'
    });
  }
};

export const register = async (req, res) => {
  let createdUserId = null;
  try {
    const {
      name, phone, email, password, role, preferredLanguage, skills,
      experienceLevel, location, preferences, avatar, firebaseIdToken
    } = req.body || {};

    const cleanName = String(name || '').trim();
    const cleanPhone = String(phone || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanRole = role === 'employer' ? 'employer' : 'worker';

    if (!cleanName || cleanName.length > 120 || !password) {
      return res.status(400).json({ success: false, message: 'Enter your name and a password.' });
    }
    if (!cleanPhone && !cleanEmail) {
      return res.status(400).json({ success: false, message: 'Enter an email address or mobile number to register.' });
    }
    if (cleanPhone && normalizePhone(cleanPhone).length !== 10) {
      return res.status(400).json({ success: false, message: 'Enter a valid 10-digit Indian mobile number.' });
    }
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
    }
    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ success: false, message: 'Password must be 8–128 characters.' });
    }
    const passwordClasses = [/[a-z]/.test(password), /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
    if (passwordClasses < 3) {
      return res.status(400).json({ success: false, message: 'Use at least 3 of: lowercase, uppercase, number, and special character.' });
    }

    let verifiedPhone = null;
    let firebaseUid = null;
    if (cleanPhone) {
      if (!firebaseIdToken) {
        return res.status(400).json({ success: false, code: 'PHONE_OTP_REQUIRED', message: 'Verify your mobile number using the SMS OTP before registering.' });
      }
      const decoded = await getFirebaseAdminAuth().verifyIdToken(String(firebaseIdToken), true);
      const firebaseUser = await getFirebaseAdminAuth().getUser(decoded.uid);
      const hasPhoneProvider = decoded.firebase?.sign_in_provider === 'phone' ||
        firebaseUser.providerData?.some(provider => provider.providerId === 'phone');
      if (!hasPhoneProvider || !decoded.phone_number ||
          normalizePhone(decoded.phone_number) !== normalizePhone(cleanPhone)) {
        return res.status(403).json({ success: false, code: 'PHONE_NOT_VERIFIED', message: 'The Firebase OTP verification does not match the mobile number entered.' });
      }
      verifiedPhone = normalizePhone(decoded.phone_number);
      firebaseUid = decoded.uid;
    } else if (firebaseIdToken) {
      return res.status(400).json({ success: false, message: 'A mobile verification token was supplied without a mobile number.' });
    }

    if (cleanPhone && findOne('users', u => normalizePhone(u.phone) === verifiedPhone)) {
      return res.status(409).json({ success: false, message: 'An account with this verified mobile number already exists.' });
    }
    if (cleanEmail && findOne('users', u => String(u.email || '').trim().toLowerCase() === cleanEmail)) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists. Use another email or sign in.' });
    }
    if (!verifiedPhone && !isEmailDeliveryConfigured()) {
      return res.status(503).json({ success: false, code: 'EMAIL_NOT_CONFIGURED', message: 'Email registration is temporarily unavailable. The administrator must configure the email verification service first.' });
    }

    const passwordHash = await bcrypt.hash(password, await bcrypt.genSalt(12));
    const verificationToken = cleanEmail ? randomBytes(32).toString('hex') : null;
    const newUser = insert('users', {
      name: cleanName,
      phone: verifiedPhone || undefined,
      phoneVerified: Boolean(verifiedPhone),
      firebaseUid,
      email: cleanEmail,
      emailVerified: false,
      emailVerificationTokenHash: verificationToken ? createHash('sha256').update(verificationToken).digest('hex') : null,
      emailVerificationExpiresAt: verificationToken ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null,
      password: passwordHash,
      role: cleanRole,
      verificationStatus: verifiedPhone ? 'Phone Verified' : 'Email Verification Pending',
      avatar: avatar || '',
      isActive: true
    });
    createdUserId = newUser._id;

    let emailDeliveryFailed = false;
    if (cleanEmail) {
      try {
        await sendVerificationEmail({ to: cleanEmail, token: verificationToken, name: cleanName });
      } catch (emailError) {
        emailDeliveryFailed = true;
        if (!verifiedPhone) {
          remove('users', newUser._id);
          createdUserId = null;
          return res.status(503).json({ success: false, code: emailError.code || 'EMAIL_DELIVERY_FAILED', message: emailError.message });
        }
        update('users', newUser._id, {
          emailVerificationTokenHash: null,
          emailVerificationExpiresAt: null
        });
      }
    }

    if (cleanRole === 'worker') {
      const parsedSkills = (Array.isArray(skills) && skills.length ? skills : ['General Worker']).map(s => ({
        skillName: typeof s === 'string' ? s : s.skillName,
        category: 'General',
        experienceYears: 1,
        verificationStatus: 'Self-declared',
        endorsementsCount: 0
      }));
      insert('workerProfiles', {
        userId: newUser._id,
        fullName: cleanName,
        phone: verifiedPhone || '',
        email: cleanEmail,
        avatar: newUser.avatar,
        preferredLanguage: preferredLanguage || 'Hindi',
        workerId: 'KS-W-' + randomBytes(4).toString('hex').toUpperCase(),
        primarySkill: parsedSkills[0]?.skillName || 'General Worker',
        experienceLevel: experienceLevel || '1–3 years',
        experienceYearsNum: 2,
        skills: parsedSkills,
        location: location || {
          state: 'Uttar Pradesh', city: 'Noida', area: 'Sector 62',
          pincode: '201309', coordinates: { lat: 28.6280, lng: 77.3649 }
        },
        preferences: preferences || {
          expectedDailyWage: 800, expectedMonthlyWage: 22000,
          jobType: 'Daily Wage', availableDates: 'Immediate', maxDistanceKm: 10
        },
        skillPassport: {
          passportId: 'KSP-NEW-' + randomBytes(4).toString('hex').toUpperCase(),
          qrCodeString: 'https://kaamsetu.in/passport/new-' + newUser._id,
          verifiedSkillsCount: 0, trustScore: null, completedJobsCount: 0,
          rating: null, reviewsCount: 0, badges: ['New Joiner'],
          issueDate: new Date().toISOString()
        },
        bio: 'Ready to work on verified local projects.',
        isProfileComplete: true
      });
    } else {
      insert('employerProfiles', {
        userId: newUser._id,
        companyName: req.body.companyName || cleanName + "'s Services",
        contactPerson: cleanName,
        phone: verifiedPhone || '',
        email: cleanEmail,
        industry: req.body.industry || 'Contracting',
        businessType: req.body.businessType || 'Small Business / Shop',
        verificationStatus: verifiedPhone ? 'Phone Verified' : 'Email Pending',
        gstOrGovtId: req.body.gstOrGovtId || '',
        address: location || {
          state: 'Uttar Pradesh', city: 'Noida', area: 'Sector 63',
          pincode: '201301', coordinates: { lat: 28.6271, lng: 77.3820 }
        },
        rating: null, jobsPostedCount: 0, activeJobsCount: 0, hiredWorkersCount: 0,
        aboutCompany: req.body.aboutCompany || 'Local hiring business on KAAMSETU'
      });
    }

    const safeUser = { ...newUser };
    delete safeUser.password;
    delete safeUser.firebaseUid;
    delete safeUser.emailVerificationTokenHash;
    delete safeUser.emailVerificationExpiresAt;
    delete safeUser.emailVerificationLastSentAt;

    return res.status(201).json({
      success: true,
      message: cleanEmail
        ? (emailDeliveryFailed
          ? 'Account created with verified mobile. Email verification could not be sent; request a new link from sign-in.'
          : 'Account created. Check your email and verify the link before using email-and-password sign-in.')
        : 'Account created with verified mobile number. You can now sign in using SMS OTP.',
      emailVerificationRequired: Boolean(cleanEmail),
      phoneVerified: Boolean(verifiedPhone),
      user: safeUser
    });
  } catch (error) {
    console.error('[Auth] Register error:', error.message);
    if (createdUserId) {
      const workerProfile = findOne('workerProfiles', p => p.userId === createdUserId);
      const employerProfile = findOne('employerProfiles', p => p.userId === createdUserId);
      if (workerProfile) remove('workerProfiles', workerProfile._id || workerProfile.id);
      if (employerProfile) remove('employerProfiles', employerProfile._id || employerProfile.id);
      remove('users', createdUserId);
    }
    if (error.code?.startsWith('auth/')) {
      return res.status(400).json({ success: false, message: 'Firebase could not verify the phone OTP. Please request a new SMS code and try again.' });
    }
    return res.status(500).json({ success: false, message: 'Server error during registration. Please try again.' });
  }
};

export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'Please provide phone number/email and password.' });
    }

    const identifier = String(phone).trim();
    const normalizedIdentifier = identifier.toLowerCase();
    const isEmailIdentifier = normalizedIdentifier.includes('@');
    const user = isEmailIdentifier
      ? findOne('users', u => String(u.email || '').trim().toLowerCase() === normalizedIdentifier)
      : findOne('users', u => normalizePhone(u.phone) === normalizePhone(identifier));

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid phone number or password.' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: 'This account has been suspended by administration.' });
    }
    if (isEmailIdentifier && user.emailVerified !== true) {
      return res.status(403).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'This email has not been verified for your account yet. Sign in with your registered mobile number, or verify your email before using it to sign in.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid phone number or password.' });
    }

    const token = generateToken(user);
    const userSafe = { ...user };
    delete userSafe.password;
    delete userSafe.firebaseUid;
    delete userSafe.emailVerificationTokenHash;
    delete userSafe.emailVerificationExpiresAt;
    delete userSafe.emailVerificationLastSentAt;

    let profile = null;
    if (user.role === 'worker') {
      profile = findOne('workerProfiles', wp => wp.userId === user._id);
    } else if (user.role === 'employer') {
      profile = findOne('employerProfiles', ep => ep.userId === user._id);
    }

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: userSafe,
      profile
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = req.user;
    let profile = null;

    if (user.role === 'worker') {
      profile = findOne('workerProfiles', wp => wp.userId === user._id || wp.userId === user.id);
    } else if (user.role === 'employer') {
      profile = findOne('employerProfiles', ep => ep.userId === user._id || ep.userId === user.id);
    }

    const userSafe = { ...user };
    delete userSafe.password;
    delete userSafe.firebaseUid;
    delete userSafe.emailVerificationTokenHash;
    delete userSafe.emailVerificationExpiresAt;
    delete userSafe.emailVerificationLastSentAt;

    res.status(200).json({
      success: true,
      user: userSafe,
      profile
    });
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving user profile.' });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const token = String(req.query.token || '');
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({ success: false, message: 'This verification link is invalid or incomplete.' });
    }
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const user = findOne('users', candidate =>
      candidate.emailVerificationTokenHash === tokenHash &&
      candidate.emailVerificationExpiresAt &&
      new Date(candidate.emailVerificationExpiresAt).getTime() > Date.now()
    );
    if (!user) return res.status(400).json({ success: false, message: 'This verification link is invalid or expired. Request a new link.' });

    update('users', user._id || user.id, {
      emailVerified: true,
      emailVerificationTokenHash: null,
      emailVerificationExpiresAt: null,
      emailVerificationLastSentAt: null,
      verificationStatus: user.phoneVerified ? 'Phone and Email Verified' : 'Email Verified'
    });
    if (user.role === 'worker') {
      const profile = findOne('workerProfiles', p => p.userId === (user._id || user.id));
      if (profile) update('workerProfiles', profile._id || profile.id, { email: user.email });
    } else if (user.role === 'employer') {
      const profile = findOne('employerProfiles', p => p.userId === (user._id || user.id));
      if (profile) update('employerProfiles', profile._id || profile.id, { email: user.email });
    }
    return res.json({ success: true, message: 'Your email address has been verified. You can now sign in using email and password.' });
  } catch (error) {
    console.error('[Auth] Email verification error:', error.message);
    return res.status(500).json({ success: false, message: 'Email verification could not be completed.' });
  }
};

export const resendEmailVerification = async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
    }
    const user = findOne('users', candidate => String(candidate.email || '').toLowerCase() === email);
    if (!user || user.emailVerified === true) {
      return res.json({ success: true, message: 'If this email belongs to an unverified KaamSetu account, a verification link will be sent.' });
    }
    const lastSent = new Date(user.emailVerificationLastSentAt || 0).getTime();
    if (Date.now() - lastSent < 60 * 1000) {
      return res.status(429).json({ success: false, message: 'Please wait one minute before requesting another verification email.' });
    }
    const token = randomBytes(32).toString('hex');
    update('users', user._id || user.id, {
      emailVerificationTokenHash: createHash('sha256').update(token).digest('hex'),
      emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      emailVerificationLastSentAt: new Date().toISOString()
    });
    await sendVerificationEmail({ to: email, token, name: user.name });
    return res.json({ success: true, message: 'A new verification link has been sent if the email provider accepted the request.' });
  } catch (error) {
    console.error('[Auth] Resend verification error:', error.message);
    return res.status(error.code === 'EMAIL_NOT_CONFIGURED' ? 503 : 502).json({
      success: false,
      message: error.message || 'Could not send the verification email.'
    });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const password = String(req.body?.password || '');
    const userId = String(req.user._id || req.user.id);
    const tombstoneId = 'deleted:' + userId;
    // Read the stored password hash directly; the auth middleware intentionally strips it from req.user.
    const user = findOne('users', item => String(item._id || item.id) === userId);
    if (!user) return res.status(404).json({ success: false, message: 'Account not found.' });
    if (!password || !(await bcrypt.compare(password, user.password || ''))) {
      return res.status(403).json({ success: false, message: 'Your current password is required to confirm account deletion.' });
    }

    // Keep application/payment/job audit records. Remove profile and private conversation data.
    const relatedApplications = find('applications', item =>
      String(item.workerId) === userId || String(item.employerId) === userId
    );
    const applicationIds = new Set(relatedApplications.map(item => String(item._id || item.id)));
    for (const application of relatedApplications) {
      const redactions = {};
      if (String(application.workerId) === userId && application.coverNote) redactions.coverNote = '[removed after account deletion]';
      if (String(application.employerId) === userId && application.employerNotes) redactions.employerNotes = '[removed after account deletion]';
      if (Object.keys(redactions).length) update('applications', application._id || application.id, redactions);
    }
    for (const review of find('reviews', item => String(item.fromUserId) === userId && item.reviewText)) {
      update('reviews', review._id || review.id, { reviewText: '[review text removed after account deletion]' });
    }
    for (const message of find('messages', item =>
      String(item.senderId) === userId || String(item.userId) === userId || applicationIds.has(String(item.applicationId))
    )) remove('messages', message._id || message.id);
    for (const item of find('notifications', row => String(row.userId) === userId)) remove('notifications', item._id || item.id);
    for (const item of find('savedJobs', row => String(row.userId) === userId)) remove('savedJobs', item._id || item.id);
    for (const item of find('userBlocks', row => String(row.blockerId) === userId || String(row.blockedId) === userId)) remove('userBlocks', item._id || item.id);

    const workerProfile = findOne('workerProfiles', item => String(item.userId) === userId);
    const employerProfile = findOne('employerProfiles', item => String(item.userId) === userId);
    if (user.role === 'employer') {
      for (const job of find('jobs', item => String(item.employerId) === userId)) {
        const jobUpdates = {};
        if (job.status === 'active') {
          jobUpdates.status = 'closed';
          jobUpdates.closedReason = 'Employer account deleted';
          jobUpdates.closedAt = new Date().toISOString();
        }
        if (employerProfile?.businessType === 'Home Owner') jobUpdates.companyName = 'Deleted Employer';
        if (Object.keys(jobUpdates).length) update('jobs', job._id || job.id, jobUpdates);
      }
    }
    if (workerProfile) remove('workerProfiles', workerProfile._id || workerProfile.id);
    if (employerProfile) remove('employerProfiles', employerProfile._id || employerProfile.id);

    // Retain payments, applications, completed jobs, and reviews for audit/dispute handling.
    update('users', userId, {
      name: 'Deleted KaamSetu User',
      phone: undefined,
      email: undefined,
      avatar: '',
      password: await bcrypt.hash(randomBytes(48).toString('hex'), 12),
      phoneVerified: false,
      emailVerified: false,
      firebaseUid: null,
      emailVerificationTokenHash: null,
      emailVerificationExpiresAt: null,
      isActive: false,
      deletedAt: new Date().toISOString(),
      deletionReference: tombstoneId
    });

    if (user.firebaseUid) {
      try {
        await getFirebaseAdminAuth().deleteUser(user.firebaseUid);
      } catch (firebaseError) {
        if (firebaseError.code !== 'auth/user-not-found') {
          console.error('[Auth] Firebase identity cleanup requires administrator review:', firebaseError.message);
        }
      }
    }

    return res.json({ success: true, message: 'Your account has been deleted. Payment and application records were retained for audit and dispute requirements.' });
  } catch (error) {
    console.error('[Auth] Account deletion error:', error.message);
    return res.status(500).json({ success: false, message: 'Account deletion could not be completed. Please contact support before retrying.' });
  }
};

