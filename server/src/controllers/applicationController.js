import { find, findOne, insert, update } from '../services/storage.js';
import { calculateJobMatch } from '../services/matchingEngine.js';

export const applyJob = async (req, res) => {
  try {
    const workerUserId = req.user._id || req.user.id;
    const { jobId, coverNote } = req.body;

    if (!jobId) {
      return res.status(400).json({ success: false, message: 'Please provide a valid Job ID.' });
    }

    const job = findOne('jobs', j => j._id === jobId || j.id === jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found or no longer active.' });
    }

    if (job.status !== 'active') {
      return res.status(400).json({ success: false, message: `Cannot apply: This job listing is ${job.status}.` });
    }

    // Check duplicate applications (Requirement 13)
    const existing = findOne('applications', a => a.jobId === jobId && a.workerId === workerUserId);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted an application for this job.',
        existingStatus: existing.status
      });
    }

    // Worker profile
    const workerProfile = findOne('workerProfiles', wp => wp.userId === workerUserId);
    if (!workerProfile) {
      return res.status(400).json({ success: false, message: 'Please complete your worker profile before applying.' });
    }

    // Calculate match
    const match = calculateJobMatch(workerProfile, job);

    // Create application
    const application = insert('applications', {
      jobId,
      workerId: workerUserId,
      employerId: job.employerId,
      status: 'Applied',
      matchScore: {
        total: match.matchScore,
        breakdown: match.breakdown,
        distanceKm: match.distanceKm,
        explanations: match.explanations
      },
      coverNote: coverNote || '',
      employerNotes: ''
    });

    // Increment job applicantsCount
    update('jobs', jobId, {
      applicantsCount: (job.applicantsCount || 0) + 1
    });

    // Notify Employer
    insert('notifications', {
      userId: job.employerId,
      title: 'New Candidate Applied!',
      message: `${workerProfile.fullName} (${workerProfile.primarySkill}, ${match.matchScore}% Match) applied for "${job.title}".`,
      type: 'success',
      actionUrl: '/employer/candidates',
      isRead: false
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully! The employer has been notified.',
      application
    });
  } catch (error) {
    console.error('applyJob error:', error);
    res.status(500).json({ success: false, message: 'Error submitting application.' });
  }
};

export const getWorkerApplications = async (req, res) => {
  try {
    const workerUserId = req.user._id || req.user.id;
    const applications = find('applications', a => a.workerId === workerUserId);

    // Hydrate with job details
    const hydrated = applications.map(app => {
      const job = findOne('jobs', j => j._id === app.jobId || j.id === app.jobId);
      const employer = findOne('employerProfiles', ep => ep.userId === app.employerId);
      const employerUser = app.status === 'Accepted'
        ? findOne('users', u => u._id === app.employerId || u.id === app.employerId)
        : null;
      return {
        ...app,
        job: job || { title: 'Unknown Job', offeredWage: 0, location: {} },
        employer: employer
          ? {
              ...employer,
              phone: app.status === 'Accepted' ? (employer.phone || employerUser?.phone) : undefined
            }
          : {
              companyName: 'Employer',
              verificationStatus: 'Registered',
              ...(app.status === 'Accepted' && employerUser?.phone ? { phone: employerUser.phone } : {})
            }
      };
    });

    // Sort newest first
    hydrated.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json({
      success: true,
      count: hydrated.length,
      applications: hydrated
    });
  } catch (error) {
    console.error('getWorkerApplications error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving applications.' });
  }
};

export const getEmployerApplications = async (req, res) => {
  try {
    const employerUserId = req.user._id || req.user.id;
    const { jobId, status } = req.query;

    let applications = find('applications', a => a.employerId === employerUserId);

    if (jobId) {
      applications = applications.filter(a => a.jobId === jobId);
    }

    if (status && status !== 'All') {
      applications = applications.filter(a => a.status === status);
    }

    // Hydrate with worker profile and job details
    const hydrated = applications.map(app => {
      const workerProfile = findOne('workerProfiles', wp => wp.userId === app.workerId);
      const workerUser = findOne('users', u => u._id === app.workerId || u.id === app.workerId);
      const job = findOne('jobs', j => j._id === app.jobId || j.id === app.jobId);
      return {
        ...app,
        workerProfile: workerProfile
          ? { ...workerProfile, phone: app.status === 'Accepted' ? (workerProfile.phone || workerUser?.phone) : undefined }
          : { fullName: workerUser?.name || 'Worker', skills: [] },
        workerUser: {
          name: workerUser?.name,
          phone: app.status === 'Accepted' ? workerUser?.phone : undefined,
          verificationStatus: workerUser?.verificationStatus
        },
        job: job || { title: 'Job', offeredWage: 0 }
      };
    });

    hydrated.sort((a, b) => (b.matchScore?.total || 0) - (a.matchScore?.total || 0));

    res.status(200).json({
      success: true,
      count: hydrated.length,
      applications: hydrated
    });
  } catch (error) {
    console.error('getEmployerApplications error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving candidates.' });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, employerNotes } = req.body;

    const allowed = ['Applied', 'Viewed', 'Shortlisted', 'Accepted', 'Rejected', 'Completed', 'Cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${allowed.join(', ')}` });
    }

    const application = findOne('applications', a => a._id === id || a.id === id);
    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }

    if (application.employerId !== req.user._id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized to manage this application.' });
    }

    const updated = update('applications', id, {
      status,
      employerNotes: employerNotes !== undefined ? employerNotes : application.employerNotes
    });

    const job = findOne('jobs', j => j._id === application.jobId || j.id === application.jobId);
    const workerProfile = findOne('workerProfiles', wp => wp.userId === application.workerId);

    // If accepted:
    if (status === 'Accepted') {
      // Update job filled vacancies & acceptedWorkerId
      if (job) {
        update('jobs', job._id, {
          acceptedWorkerId: application.workerId,
          filledVacancies: (job.filledVacancies || 0) + 1,
          status: (job.filledVacancies + 1 >= job.vacancies) ? 'in_progress' : job.status
        });
      }

      // Worker gets notification
      insert('notifications', {
        userId: application.workerId,
        title: 'Congratulations! Application Accepted 🎉',
        message: `Your application for "${job?.title || 'Job'}" has been ACCEPTED by ${job?.companyName || 'the employer'}! Contact details unlocked.`,
        type: 'success',
        actionUrl: '/worker/applications',
        isRead: false
      });
    } else if (status === 'Shortlisted') {
      insert('notifications', {
        userId: application.workerId,
        title: 'Application Shortlisted ⭐',
        message: `You have been shortlisted for "${job?.title || 'Job'}" by ${job?.companyName || 'employer'}.`,
        type: 'info',
        actionUrl: '/worker/applications',
        isRead: false
      });
    } else if (status === 'Completed') {
      // Job completion update worker stats
      if (workerProfile) {
        const passport = workerProfile.skillPassport || {};
        update('workerProfiles', workerProfile._id, {
          skillPassport: {
            ...passport,
            completedJobsCount: (passport.completedJobsCount || 0) + 1,
            trustScore: Math.min(100, (passport.trustScore || 85) + 2)
          }
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Application marked as ${status}.`,
      application: updated
    });
  } catch (error) {
    console.error('updateApplicationStatus error:', error);
    res.status(500).json({ success: false, message: 'Error updating application status.' });
  }
};
