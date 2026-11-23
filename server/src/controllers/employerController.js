import { find, findOne, update } from '../services/storage.js';

export const getEmployerProfile = async (req, res) => {
  try {
    const employerUserId = req.params.userId || req.user._id || req.user.id;
    const profile = findOne('employerProfiles', ep => ep.userId === employerUserId || ep._id === employerUserId);

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Employer profile not found.' });
    }

    const user = findOne('users', u => u._id === profile.userId || u.id === profile.userId);
    // Older persisted demo records may not have profile.avatar; use the
    // corresponding account avatar so every seeded employer displays a photo.
    const employerAvatar = profile.avatar || user?.avatar || '';
    const activeJobs = find('jobs', j => j.employerId === profile.userId && j.status === 'active');
    const totalJobs = find('jobs', j => j.employerId === profile.userId);
    const completedHires = find('applications', a =>
      String(a.employerId) === String(profile.userId) && a.status === 'Completed'
    );
    const employerReviews = find('reviews', r =>
      String(r.toUserId) === String(profile.userId) && r.fromRole === 'worker' && r.isVerifiedWork === true
    );
    const averageEmployerRating = employerReviews.length
      ? Math.round((employerReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / employerReviews.length) * 10) / 10
      : null;
    res.status(200).json({
      success: true,
      profile: {
        ...profile,
        ...(req.params.userId ? { phone: undefined, email: undefined } : {}),
        avatar: employerAvatar,
        address: req.params.userId ? { ...profile.address, coordinates: undefined } : profile.address,
        activeJobsCount: activeJobs.length,
        jobsPostedCount: totalJobs.length,
        rating: averageEmployerRating,
        reviewsCount: employerReviews.length,
        completedHiresCount: completedHires.length,
        
      },
      user: {
        name: user?.name,
        phone: req.params.userId ? undefined : user?.phone,
        email: req.params.userId ? undefined : user?.email,
        verificationStatus: user?.verificationStatus,
        createdAt: user?.createdAt
      }
    });
  } catch (error) {
    console.error('getEmployerProfile error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving employer profile.' });
  }
};

export const updateEmployerProfile = async (req, res) => {
  try {
    const employerUserId = req.user._id || req.user.id;
    const profile = findOne('employerProfiles', ep => ep.userId === employerUserId);

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Employer profile not found.' });
    }

    const { companyName, contactPerson, phone, email, industry, businessType, address, aboutCompany, avatar, maxHiringDistanceKm } = req.body;

    const normalizePhone = value => String(value || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '').replace(/^0(?=\d{10}$)/, '');
    if (phone && normalizePhone(phone) !== normalizePhone(req.user.phone)) {
      return res.status(400).json({ success: false, message: 'Changing your mobile number requires a new SMS OTP verification. Your saved number was not changed.' });
    }
    if (email && String(email).trim().toLowerCase() !== String(req.user.email || '').trim().toLowerCase()) {
      return res.status(400).json({ success: false, message: 'Changing your email requires a new email verification. Your saved email was not changed.' });
    }
    const updates = {};
    if (companyName) updates.companyName = companyName;
    if (contactPerson) updates.contactPerson = contactPerson;
    if (email) updates.email = email;
    if (industry) updates.industry = industry;
    if (businessType) updates.businessType = businessType;
    if (address) updates.address = address;
    if (aboutCompany) updates.aboutCompany = aboutCompany;
    if (avatar) updates.avatar = avatar;
    if (maxHiringDistanceKm !== undefined) updates.maxHiringDistanceKm = Math.min(100, Math.max(1, Number(maxHiringDistanceKm) || 10));
    if (avatar) update('users', employerUserId, { avatar });

    const updated = update('employerProfiles', profile._id, updates);

    res.status(200).json({
      success: true,
      message: 'Employer profile updated successfully.',
      profile: updated
    });
  } catch (error) {
    console.error('updateEmployerProfile error:', error);
    res.status(500).json({ success: false, message: 'Error updating profile.' });
  }
};

export const getCandidatesForJob = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = findOne('jobs', j => j._id === jobId || j.id === jobId);

    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }
    if (job.employerId !== (req.user._id || req.user.id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'You can only view applicants for your own jobs.' });
    }

    const applications = find('applications', a => a.jobId === jobId);
    const candidates = applications.map(app => {
      const workerProfile = findOne('workerProfiles', wp => wp.userId === app.workerId);
      const workerUser = findOne('users', u => u._id === app.workerId || u.id === app.workerId);
      return {
        applicationId: app._id || app.id,
        status: app.status,
        appliedAt: app.createdAt,
        matchScore: app.matchScore,
        coverNote: app.coverNote,
        worker: {
          id: workerProfile?.userId,
          fullName: workerProfile?.fullName || workerUser?.name,
          phone: ['Accepted', 'Completed'].includes(app.status) ? (workerProfile?.phone || workerUser?.phone) : undefined,
          avatar: workerProfile?.avatar,
          workerId: workerProfile?.workerId,
          primarySkill: workerProfile?.primarySkill,
          experienceLevel: workerProfile?.experienceLevel,
          skills: workerProfile?.skills,
          location: workerProfile
            ? (['Accepted', 'Completed'].includes(app.status) ? workerProfile.location : { ...workerProfile.location, coordinates: undefined })
            : undefined,
          upiId: ['Accepted', 'Completed'].includes(app.status) ? workerProfile?.upiId : undefined,
          skillPassport: workerProfile?.skillPassport
        }
      };
    });

    res.status(200).json({
      success: true,
      job,
      count: candidates.length,
      candidates
    });
  } catch (error) {
    console.error('getCandidatesForJob error:', error);
    res.status(500).json({ success: false, message: 'Error fetching candidates.' });
  }
};
