import { find, findOne, update } from '../services/storage.js';

export const getEmployerProfile = async (req, res) => {
  try {
    const employerUserId = req.params.userId || req.user._id || req.user.id;
    const profile = findOne('employerProfiles', ep => ep.userId === employerUserId || ep._id === employerUserId);

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Employer profile not found.' });
    }

    const user = findOne('users', u => u._id === profile.userId || u.id === profile.userId);
    const activeJobs = find('jobs', j => j.employerId === profile.userId && j.status === 'active');
    const totalJobs = find('jobs', j => j.employerId === profile.userId);

    res.status(200).json({
      success: true,
      profile: {
        ...profile,
        activeJobsCount: activeJobs.length,
        jobsPostedCount: totalJobs.length
      },
      user: {
        name: user?.name,
        phone: user?.phone,
        email: user?.email,
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

    const updates = {};
    if (companyName) updates.companyName = companyName;
    if (contactPerson) updates.contactPerson = contactPerson;
    if (phone) updates.phone = phone;
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
          phone: workerUser?.phone,
          avatar: workerProfile?.avatar,
          workerId: workerProfile?.workerId,
          primarySkill: workerProfile?.primarySkill,
          experienceLevel: workerProfile?.experienceLevel,
          skills: workerProfile?.skills,
          location: workerProfile?.location,
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
