import { find, findOne, update } from '../services/storage.js';

export const getWorkerProfile = async (req, res) => {
  try {
    const workerUserId = req.params.userId || req.user._id || req.user.id;
    const workerProfile = findOne('workerProfiles', wp => wp.userId === workerUserId || wp._id === workerUserId);

    if (!workerProfile) {
      return res.status(404).json({ success: false, message: 'Worker profile not found.' });
    }

    const user = findOne('users', u => u._id === workerProfile.userId || u.id === workerProfile.userId);
    const reviews = find('reviews', r => r.toUserId === workerProfile.userId);

    res.status(200).json({
      success: true,
      workerProfile: req.params.userId ? { ...workerProfile, location: { ...workerProfile.location, coordinates: undefined } } : workerProfile,
      user: {
        name: user?.name,
        phone: user?.phone,
        email: user?.email,
        verificationStatus: user?.verificationStatus,
        createdAt: user?.createdAt
      },
      reviews
    });
  } catch (error) {
    console.error('getWorkerProfile error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving profile.' });
  }
};

export const updateWorkerProfile = async (req, res) => {
  try {
    const workerUserId = req.user._id || req.user.id;
    const workerProfile = findOne('workerProfiles', wp => wp.userId === workerUserId);

    if (!workerProfile) {
      return res.status(404).json({ success: false, message: 'Worker profile not found.' });
    }

    const {
      fullName,
      phone,
      bio,
      preferredLanguage,
      primarySkill,
      skills,
      experienceLevel,
      location,
      preferences,
      avatar,
      upiId
    } = req.body;

    const updates = {};
    if (fullName) updates.fullName = fullName;
    if (phone) updates.phone = phone;
    if (bio !== undefined) updates.bio = bio;
    if (preferredLanguage) updates.preferredLanguage = preferredLanguage;
    if (primarySkill) updates.primarySkill = primarySkill;
    if (skills) updates.skills = skills;
    if (experienceLevel) updates.experienceLevel = experienceLevel;
    if (avatar) updates.avatar = avatar;
    if (location) updates.location = location;
    if (preferences) updates.preferences = preferences;
    if (upiId !== undefined) {
      const cleanUpiId = String(upiId).trim();
      if (cleanUpiId && !/^[\w.\-]{2,256}@[\w]{2,64}$/.test(cleanUpiId)) {
        return res.status(400).json({ success: false, message: 'Enter a valid UPI ID, for example name@bank.' });
      }
      updates.upiId = cleanUpiId;
    }

    const updated = update('workerProfiles', workerProfile._id, updates);

    // Also update base user record
    if (avatar) update('users', workerUserId, { avatar });
    if (fullName || phone) {
      update('users', workerUserId, {
        ...(fullName && { name: fullName }),
        ...(phone && { phone: phone })
      });
    }

    res.status(200).json({
      success: true,
      message: 'Worker profile updated successfully.',
      workerProfile: updated
    });
  } catch (error) {
    console.error('updateWorkerProfile error:', error);
    res.status(500).json({ success: false, message: 'Error updating profile.' });
  }
};

export const getSkillPassport = async (req, res) => {
  try {
    const { passportId } = req.params;
    let workerProfile = null;

    if (passportId) {
      workerProfile = findOne('workerProfiles', wp => 
        wp.skillPassport?.passportId === passportId ||
        wp.workerId === passportId ||
        wp._id === passportId ||
        wp.userId === passportId
      );
    } else if (req.user) {
      const workerUserId = req.user._id || req.user.id;
      workerProfile = findOne('workerProfiles', wp => wp.userId === workerUserId);
    }

    if (!workerProfile) {
      return res.status(404).json({ success: false, message: 'Skill Passport not found.' });
    }

    const user = findOne('users', u => u._id === workerProfile.userId || u.id === workerProfile.userId);
    const reviews = find('reviews', r => r.toUserId === workerProfile.userId);
    const completedApps = find('applications', a => a.workerId === workerProfile.userId && a.status === 'Completed');

    res.status(200).json({
      success: true,
      skillPassport: {
        ...workerProfile.skillPassport,
        workerName: workerProfile.fullName,
        workerId: workerProfile.workerId,
        avatar: workerProfile.avatar,
        primarySkill: workerProfile.primarySkill,
        skills: workerProfile.skills,
        experienceLevel: workerProfile.experienceLevel,
        experienceYearsNum: workerProfile.experienceYearsNum,
        location: passportId ? { ...workerProfile.location, coordinates: undefined } : workerProfile.location,
        bio: workerProfile.bio,
        userVerification: user?.verificationStatus || 'Registered',
        memberSince: user?.createdAt,
        verifiedWorkHistory: completedApps.length,
        reviewsSummary: {
          averageRating: workerProfile.skillPassport?.rating || 4.9,
          totalReviews: reviews.length,
          reviews: reviews.slice(0, 5)
        }
      }
    });
  } catch (error) {
    console.error('getSkillPassport error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving Skill Passport.' });
  }
};

export const getAllWorkers = async (req, res) => {
  try {
    const { skill, city, area } = req.query;
    let workers = find('workerProfiles');

    if (skill && skill !== 'All') {
      workers = workers.filter(w => 
        (w.primarySkill && w.primarySkill.toLowerCase() === skill.toLowerCase()) ||
        (w.skills && w.skills.some(s => s.skillName.toLowerCase().includes(skill.toLowerCase())))
      );
    }

    if (city) {
      workers = workers.filter(w => w.location?.city?.toLowerCase() === city.toLowerCase());
    }

    if (area) {
      workers = workers.filter(w => w.location?.area?.toLowerCase().includes(area.toLowerCase()));
    }

    res.status(200).json({
      success: true,
      count: workers.length,
      workers
    });
  } catch (error) {
    console.error('getAllWorkers error:', error);
    res.status(500).json({ success: false, message: 'Error fetching workers.' });
  }
};
