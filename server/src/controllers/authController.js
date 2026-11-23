import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import { findOne, insert, update, remove, flushStorage } from '../services/storage.js';
import { getFirebaseAdminAuth } from '../config/firebaseAdmin.js';
import { isEmailDeliveryConfigured, sendVerificationEmail } from '../services/emailService.js';

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
    if (user && hasVerifiedPhoneProvider) {
      user = update('users', String(user._id || user.id), { phoneVerified: true, firebaseUid: decoded.uid, verificationStatus: 'Contact Verified' }) || user;
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

    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: 'This account has been suspended by administration.' });
    }

    const token = generateToken(user);
    const userSafe = { ...user };
    delete userSafe.password;
    delete userSafe.emailVerificationTokenHash;
    delete userSafe.emailVerificationExpiresAt;
    delete userSafe.firebaseUid;

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
  let createdUserId = '';
  let createdProfileId = '';
  try {
    const { name, phone, email, password, role, preferredLanguage, skills, experienceLevel, location, preferences, avatar, firebaseIdToken } = req.body || {};
    const cleanName = String(name || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const phoneDigits = normalizePhone(phone);
    const cleanPhone = phoneDigits ? '+91' + phoneDigits : '';
    const cleanPassword = String(password || '');
    const selectedRole = role === 'employer' ? 'employer' : role === 'worker' ? 'worker' : '';

    if (!cleanName || !cleanPassword || !selectedRole || (!cleanPhone && !cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Provide your name, a strong password, and at least one contact method: email or mobile number.' });
    }
    if (cleanPassword.length < 8 || cleanPassword.length > 128) {
      return res.status(400).json({ success: false, message: 'Password must be 8–128 characters.' });
    }
    const passwordClasses = [/[a-z]/.test(cleanPassword), /[A-Z]/.test(cleanPassword), /\d/.test(cleanPassword), /[^A-Za-z0-9]/.test(cleanPassword)].filter(Boolean).length;
    if (passwordClasses < 3) {
      return res.status(400).json({ success: false, message: 'Password must include at least 3 of: lowercase, uppercase, number, and special character.' });
    }
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }
    if (phone && phoneDigits.length !== 10) {
      return res.status(400).json({ success: false, message: 'Enter a valid 10-digit Indian mobile number.' });
    }
    if (cleanEmail && !isEmailDeliveryConfigured()) {
      return res.status(503).json({ success: false, code: 'EMAIL_DELIVERY_NOT_CONFIGURED', message: 'Email registration is temporarily unavailable because email verification has not been configured. Please contact the site administrator.' });
    }

    let firebaseUid = '';
    if (cleanPhone) {
      if (!firebaseIdToken || typeof firebaseIdToken !== 'string') {
        return res.status(401).json({ success: false, code: 'PHONE_VERIFICATION_REQUIRED', message: 'Verify ownership of your mobile number with the SMS OTP before creating the account.' });
      }
      const firebaseAuth = getFirebaseAdminAuth();
      const decoded = await firebaseAuth.verifyIdToken(firebaseIdToken, true);
      const firebaseUser = await firebaseAuth.getUser(decoded.uid);
      const hasVerifiedPhone = decoded.firebase?.sign_in_provider === 'phone' ||
        firebaseUser.providerData?.some(provider => provider.providerId === 'phone');
      const verifiedPhone = normalizePhone(decoded.phone_number || firebaseUser.phoneNumber);
      if (!hasVerifiedPhone || verifiedPhone !== phoneDigits) {
        return res.status(403).json({ success: false, code: 'PHONE_VERIFICATION_MISMATCH', message: 'The verified Firebase phone number does not match the mobile number entered.' });
      }
      firebaseUid = decoded.uid;
    } else if (firebaseIdToken) {
      return res.status(400).json({ success: false, message: 'A phone verification token was supplied without a mobile number.' });
    }

    if (cleanPhone && findOne('users', u => normalizePhone(u.phone) === phoneDigits && u.accountDeleted !== true)) {
      return res.status(409).json({ success: false, message: 'An account with this mobile number already exists. Sign in using phone OTP instead.' });
    }
    if (cleanEmail && findOne('users', u => String(u.email || '').trim().toLowerCase() === cleanEmail && u.accountDeleted !== true)) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists. Sign in or use another email address.' });
    }

    const passwordHash = await bcrypt.hash(cleanPassword, await bcrypt.genSalt(12));
    const verificationToken = cleanEmail ? randomBytes(32).toString('hex') : '';
    const verificationHash = verificationToken ? createHash('sha256').update(verificationToken).digest('hex') : '';
    const newUser = insert('users', {
      name: cleanName,
      phone: cleanPhone,
      phoneVerified: Boolean(cleanPhone),
      email: cleanEmail,
      emailVerified: false,
      emailVerificationTokenHash: verificationHash,
      emailVerificationExpiresAt: verificationToken ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null,
      firebaseUid,
      password: passwordHash,
      role: selectedRole,
      verificationStatus: cleanPhone ? 'Contact Verified' : 'Registered',
      avatar: avatar || '',
      isActive: true
    });
    createdUserId = String(newUser._id || newUser.id);

    if (selectedRole === 'worker') {
      const parsedSkills = (Array.isArray(skills) && skills.length ? skills : ['General Worker']).map(s => ({
        skillName: typeof s === 'string' ? s : s.skillName,
        category: 'General',
        experienceYears: 1,
        verificationStatus: 'Self-declared',
        endorsementsCount: 0
      }));
      const profile = insert('workerProfiles', {
        userId: createdUserId,
        fullName: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        avatar: newUser.avatar,
        preferredLanguage: preferredLanguage || 'Hindi',
        workerId: 'KS-W-' + Math.floor(1000 + Math.random() * 9000),
        primarySkill: parsedSkills[0]?.skillName || 'General Worker',
        experienceLevel: experienceLevel || '1–3 years',
        experienceYearsNum: 2,
        skills: parsedSkills,
        location: location || { state: 'Uttar Pradesh', city: 'Noida', area: 'Sector 62', pincode: '201309', coordinates: { lat: 28.6280, lng: 77.3649 } },
        preferences: preferences || { expectedDailyWage: 800, expectedMonthlyWage: 22000, jobType: 'Daily Wage', availableDates: 'Immediate', maxDistanceKm: 10 },
        skillPassport: {
          passportId: 'KSP-NEW-' + Math.floor(1000 + Math.random() * 9000),
          qrCodeString: 'https://kaamsetu.in/passport/new-' + createdUserId,
          verifiedSkillsCount: 0,
          trustScore: null,
          completedJobsCount: 0,
          rating: null,
          reviewsCount: 0,
          badges: ['New Joiner'],
          issueDate: new Date().toISOString()
        },
        bio: 'Ready to work on verified local projects.',
        isProfileComplete: true
      });
      createdProfileId = String(profile._id || profile.id);
    } else {
      const profile = insert('employerProfiles', {
        userId: createdUserId,
        companyName: req.body.companyName || cleanName + "'s Services",
        contactPerson: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        industry: req.body.industry || 'Contracting',
        businessType: req.body.businessType || 'Small Business / Shop',
        verificationStatus: cleanPhone ? 'Contact Verified' : 'Registered',
        gstOrGovtId: req.body.gstOrGovtId || '',
        address: location || { state: 'Uttar Pradesh', city: 'Noida', area: 'Sector 63', pincode: '201301', coordinates: { lat: 28.6271, lng: 77.3820 } },
        rating: null,
        jobsPostedCount: 0,
        activeJobsCount: 0,
        hiredWorkersCount: 0,
        aboutCompany: req.body.aboutCompany || 'Local hiring business on KAAMSETU'
      });
      createdProfileId = String(profile._id || profile.id);
    }

    if (cleanEmail) {
      try {
        await sendVerificationEmail({ to: cleanEmail, token: verificationToken });
      } catch (emailError) {
        if (createdProfileId) {
          const collection = selectedRole === 'worker' ? 'workerProfiles' : 'employerProfiles';
          remove(collection, createdProfileId);
        }
        remove('users', createdUserId);
        await flushStorage();
        console.error('[Auth] Verification email delivery failed:', emailError.message);
        return res.status(503).json({ success: false, code: 'EMAIL_DELIVERY_FAILED', message: 'The verification email could not be sent. No account was created. Please try again later or contact support.' });
      }
    }

    await flushStorage();
    return res.status(201).json({
      success: true,
      emailVerificationRequired: Boolean(cleanEmail),
      phoneVerified: Boolean(cleanPhone),
      message: cleanEmail
        ? 'Account created. Open the verification link sent to your email before signing in with email and password.'
        : 'Account created with a verified mobile number. Sign in using mobile OTP.'
    });
  } catch (error) {
    console.error('[Auth] Register error:', error.message);
    if (createdProfileId) {
      const collection = req.body?.role === 'employer' ? 'employerProfiles' : 'workerProfiles';
      remove(collection, createdProfileId);
    }
    if (createdUserId) remove('users', createdUserId);
    try { await flushStorage(); } catch {}
    const status = error.code?.startsWith('auth/') ? 401 : 500;
    return res.status(status).json({
      success: false,
      message: status === 401
        ? 'Mobile verification could not be confirmed. Please request a new OTP and try again.'
        : 'Server error during registration. Please try again.'
    });
  }
};

export const login = async (req, res) => {
  try {
    const identifier = String(req.body?.email || req.body?.phone || '').trim();
    const password = String(req.body?.password || '');
    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: 'Enter your verified email address and password. Mobile sign-in uses OTP.' });
    }

    const isEmailIdentifier = identifier.includes('@');
    let user = findOne('users', u =>
      (isEmailIdentifier && String(u.email || '').trim().toLowerCase() === identifier.toLowerCase()) ||
      (!isEmailIdentifier && normalizePhone(u.phone) === normalizePhone(identifier))
    );
    if (!user || user.accountDeleted === true) {
      return res.status(401).json({ success: false, message: 'Invalid email address or password.' });
    }

    const isDemoAccount = process.env.DEMO_MODE === 'true' &&
      ['usr_admin_01', 'usr_ramesh_kumar', 'usr_sharma_services'].includes(String(user._id || user.id));
    if (!isEmailIdentifier && !isDemoAccount) {
      return res.status(400).json({ success: false, code: 'PHONE_OTP_REQUIRED', message: 'For mobile numbers, use Sign in with phone OTP. Password sign-in is available with a verified email address.' });
    }
    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: 'This account has been suspended by administration.' });
    }
    if (isEmailIdentifier && user.emailVerified !== true && !isDemoAccount) {
      return res.status(403).json({
        success: false,
        code: 'EMAIL_NOT_VERIFIED',
        message: 'This email has not been verified. Open the verification link sent to your inbox before signing in.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email address or password.' });
    }
    if (isDemoAccount && (user.emailVerified !== true || user.phoneVerified !== true)) {
      user = update('users', String(user._id || user.id), { emailVerified: true, phoneVerified: true }) || user;
    }

    const token = generateToken(user);
    const userSafe = { ...user };
    delete userSafe.password;
    delete userSafe.emailVerificationTokenHash;
    delete userSafe.emailVerificationExpiresAt;
    delete userSafe.firebaseUid;

    let profile = null;
    if (user.role === 'worker') profile = findOne('workerProfiles', wp => wp.userId === user._id || wp.userId === user.id);
    else if (user.role === 'employer') profile = findOne('employerProfiles', ep => ep.userId === user._id || ep.userId === user.id);

    return res.status(200).json({ success: true, message: 'Login successful!', token, user: userSafe, profile });
  } catch (error) {
    console.error('[Auth] Login error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const token = String(req.query?.token || '').trim();
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({ success: false, message: 'This email verification link is invalid or incomplete.' });
    }
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const user = findOne('users', u =>
      u.emailVerificationTokenHash === tokenHash &&
      u.emailVerified !== true &&
      Date.parse(u.emailVerificationExpiresAt || '') > Date.now()
    );
    if (!user) {
      return res.status(400).json({ success: false, message: 'This verification link has expired or was already used. Request a new verification email.' });
    }
    const updated = update('users', String(user._id || user.id), {
      emailVerified: true,
      emailVerificationTokenHash: '',
      emailVerificationExpiresAt: null,
      verificationStatus: 'Contact Verified'
    });
    await flushStorage();
    return res.json({ success: true, message: 'Email address verified. You can now sign in using your email and password.', user: { email: updated.email } });
  } catch (error) {
    console.error('[Auth] Email verification failed:', error.message);
    return res.status(503).json({ success: false, message: 'Email verification is temporarily unavailable. Please try again.' });
  }
};

export const resendVerification = async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Enter a valid email address.' });
    }
    const user = findOne('users', u => String(u.email || '').trim().toLowerCase() === email && u.accountDeleted !== true);
    if (!user || user.emailVerified === true) {
      return res.json({ success: true, message: 'If an unverified account exists for that email, a new verification link will be sent.' });
    }
    if (!isEmailDeliveryConfigured()) {
      return res.status(503).json({ success: false, message: 'Email verification delivery is not configured. Please contact the site administrator.' });
    }
    const token = randomBytes(32).toString('hex');
    update('users', String(user._id || user.id), {
      emailVerificationTokenHash: createHash('sha256').update(token).digest('hex'),
      emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
    await sendVerificationEmail({ to: email, token });
    await flushStorage();
    return res.json({ success: true, message: 'If an unverified account exists for that email, a new verification link will be sent.' });
  } catch (error) {
    console.error('[Auth] Resend verification failed:', error.message);
    return res.status(503).json({ success: false, message: 'Could not send a verification email right now. Please try again later.' });
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
    delete userSafe.emailVerificationTokenHash;
    delete userSafe.emailVerificationExpiresAt;
    delete userSafe.firebaseUid;

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
