import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findOne, insert, update } from '../services/storage.js';

const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'kaamsetu_super_secure_jwt_secret_key_2026_hackathon';
  return jwt.sign(
    { id: user._id || user.id, role: user.role, name: user.name, phone: user.phone },
    secret,
    { expiresIn: '30d' }
  );
};

export const register = async (req, res) => {
  try {
    const { name, phone, email, password, role, preferredLanguage, skills, experienceLevel, location, preferences } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ success: false, message: 'Please provide full name, phone number, and password.' });
    }

    const cleanPhone = phone.trim();
    const existing = findOne('users', u => u.phone === cleanPhone);
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this phone number already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = insert('users', {
      name,
      phone: cleanPhone,
      email: email || '',
      password: passwordHash,
      role: role || 'worker',
      verificationStatus: 'Contact Verified', // Phone verified upon registration
      avatar: `https://images.unsplash.com/photo-${1507003211169}?w=150`,
      isActive: true
    });

    // Create profile
    if (newUser.role === 'worker') {
      const parsedSkills = (skills && Array.isArray(skills) ? skills : ['General Worker']).map(s => ({
        skillName: typeof s === 'string' ? s : s.skillName,
        category: 'General',
        experienceYears: 1,
        verificationStatus: 'Self-declared',
        endorsementsCount: 0
      }));

      insert('workerProfiles', {
        userId: newUser._id,
        fullName: name,
        phone: cleanPhone,
        email: email || '',
        avatar: newUser.avatar,
        preferredLanguage: preferredLanguage || 'Hindi',
        workerId: `KS-W-${Math.floor(1000 + Math.random() * 9000)}`,
        primarySkill: parsedSkills[0]?.skillName || 'General Worker',
        experienceLevel: experienceLevel || '1–3 years',
        experienceYearsNum: 2,
        skills: parsedSkills,
        location: location || {
          state: 'Uttar Pradesh',
          city: 'Noida',
          area: 'Sector 62',
          pincode: '201309',
          coordinates: { lat: 28.6280, lng: 77.3649 }
        },
        preferences: preferences || {
          expectedDailyWage: 800,
          expectedMonthlyWage: 22000,
          jobType: 'Daily Wage',
          availableDates: 'Immediate',
          maxDistanceKm: 10
        },
        skillPassport: {
          passportId: `KSP-NEW-${Math.floor(1000 + Math.random() * 9000)}`,
          qrCodeString: `https://kaamsetu.in/passport/new-${newUser._id}`,
          verifiedSkillsCount: 0,
          trustScore: 80,
          completedJobsCount: 0,
          rating: 5.0,
          reviewsCount: 0,
          badges: ['New Joiner', 'Contact Verified'],
          issueDate: new Date().toISOString()
        },
        bio: 'Ready to work on verified local projects.',
        isProfileComplete: true
      });
    } else if (newUser.role === 'employer') {
      insert('employerProfiles', {
        userId: newUser._id,
        companyName: req.body.companyName || `${name}'s Services`,
        contactPerson: name,
        phone: cleanPhone,
        email: email || '',
        industry: req.body.industry || 'Contracting',
        businessType: req.body.businessType || 'Small Business / Shop',
        verificationStatus: 'Contact Verified',
        gstOrGovtId: req.body.gstOrGovtId || '',
        address: location || {
          state: 'Uttar Pradesh',
          city: 'Noida',
          area: 'Sector 63',
          pincode: '201301',
          coordinates: { lat: 28.6271, lng: 77.3820 }
        },
        rating: 5.0,
        jobsPostedCount: 0,
        activeJobsCount: 0,
        hiredWorkersCount: 0,
        aboutCompany: req.body.aboutCompany || 'Local hiring business on KAAMSETU'
      });
    }

    const token = generateToken(newUser);
    const userSafe = { ...newUser };
    delete userSafe.password;

    res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      token,
      user: userSafe
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
};

export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ success: false, message: 'Please provide phone number and password.' });
    }

    const cleanPhone = phone.trim();
    const user = findOne('users', u => u.phone === cleanPhone || u.email === cleanPhone);

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid phone number or password.' });
    }

    if (user.isActive === false) {
      return res.status(403).json({ success: false, message: 'This account has been suspended by administration.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid phone number or password.' });
    }

    const token = generateToken(user);
    const userSafe = { ...user };
    delete userSafe.password;

    // Fetch associated profile
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
