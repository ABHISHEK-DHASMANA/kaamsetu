import { find, findOne, insert, update, flushStorage } from '../services/storage.js';
import { calculateJobMatch } from '../services/matchingEngine.js';

const idOf = user => user?._id || user?.id;

const notify = (userId, title, message, type = 'info', actionUrl = '/worker/applications') => insert('notifications', {
  userId, title, message, type, actionUrl, isRead: false
});

export const applyJob = async (req, res) => {
  try {
    const workerUserId = idOf(req.user);
    const { jobId, coverNote } = req.body;
    if (!jobId) return res.status(400).json({ success: false, message: 'Please provide a valid Job ID.' });
    const job = findOne('jobs', j => j._id === jobId || j.id === jobId);
    if (!job || job.status !== 'active') return res.status(404).json({ success: false, message: 'Job not found or no longer active.' });
    const existing = findOne('applications', a => a.jobId === jobId && a.workerId === workerUserId && a.status !== 'Cancelled');
    if (existing) return res.status(409).json({ success: false, message: 'You already have an active application for this job.', existingStatus: existing.status });
    const workerProfile = findOne('workerProfiles', wp => wp.userId === workerUserId);
    if (!workerProfile) return res.status(400).json({ success: false, message: 'Please complete your worker profile before applying.' });
    const match = calculateJobMatch(workerProfile, job);
    const application = insert('applications', {
      jobId, workerId: workerUserId, employerId: job.employerId, status: 'Applied',
      matchScore: { total: match.matchScore, breakdown: match.breakdown, distanceKm: match.distanceKm, explanations: match.explanations },
      coverNote: coverNote || '', employerNotes: ''
    });
    update('jobs', job._id || job.id, { applicantsCount: (job.applicantsCount || 0) + 1 });
    notify(job.employerId, 'New candidate applied', `${workerProfile.fullName} applied for "${job.title}".`, 'success');
    res.status(201).json({ success: true, message: 'Application submitted. The employer has been notified.', application });
  } catch (error) {
    console.error('applyJob error:', error);
    res.status(500).json({ success: false, message: 'Error submitting application.' });
  }
};

export const getWorkerApplications = async (req, res) => {
  try {
    const workerUserId = idOf(req.user);
    const hydrated = find('applications', a => a.workerId === workerUserId).map(app => {
      const job = findOne('jobs', j => j._id === app.jobId || j.id === app.jobId);
      const employer = findOne('employerProfiles', ep => ep.userId === app.employerId);
      const employerReviews = find('reviews', review => review.toUserId === app.employerId);
      const completedEmployerHires = find('applications', item => item.employerId === app.employerId && item.status === 'Completed');
      const employerTrustScore = employerReviews.length && completedEmployerHires.length
        ? Math.round((employerReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / employerReviews.length) * 20)
        : null;
      const unlocked = ['Accepted', 'InProgress', 'CompletionRequested', 'PaymentPending', 'Completed'].includes(app.status);
      const employerUser = unlocked ? findOne('users', u => idOf(u) === app.employerId) : null;
      return {
        ...app,
        workerReviewed: findOne('reviews', r => r.jobId === app.jobId && r.fromUserId === app.workerId && r.toUserId === app.employerId) !== null,
        employerReviewed: findOne('reviews', r => r.jobId === app.jobId && r.fromUserId === app.employerId && r.toUserId === app.workerId) !== null,
        job: job ? { ...job, employerContact: unlocked ? job.employerContact : { ...job.employerContact, phone: undefined } } : { title: 'Unknown Job', offeredWage: 0, location: {} },
        employer: employer ? { ...employer, trustScore: employerTrustScore, trustReviewsCount: employerReviews.length, completedHiresCount: completedEmployerHires.length, phone: unlocked ? (employer.phone || employerUser?.phone) : undefined, email: unlocked ? employer.email : undefined } : { companyName: 'Employer', trustScore: null, trustReviewsCount: 0, completedHiresCount: 0, ...(unlocked && employerUser?.phone ? { phone: employerUser.phone } : {}) }
      };
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, count: hydrated.length, applications: hydrated });
  } catch (error) {
    console.error('getWorkerApplications error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving applications.' });
  }
};

export const getEmployerApplications = async (req, res) => {
  try {
    const employerUserId = idOf(req.user);
    const { jobId, status } = req.query;
    let applications = find('applications', a => a.employerId === employerUserId);
    if (jobId) applications = applications.filter(a => a.jobId === jobId);
    if (status && status !== 'All') applications = applications.filter(a => a.status === status);
    const hydrated = applications.map(app => {
      const workerProfile = findOne('workerProfiles', wp => wp.userId === app.workerId);
      const workerUser = findOne('users', u => idOf(u) === app.workerId);
      const workerReviews = find('reviews', review => review.toUserId === app.workerId);
      const workerCompletedJobs = find('applications', item => item.workerId === app.workerId && item.status === 'Completed');
      const workerAverageRating = workerReviews.length
        ? Math.round((workerReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / workerReviews.length) * 10) / 10
        : null;
      const job = findOne('jobs', j => j._id === app.jobId || j.id === app.jobId);
      const unlocked = ['Accepted', 'InProgress', 'CompletionRequested', 'PaymentPending', 'Completed'].includes(app.status);
      return {
        ...app,
        workerReviewed: findOne('reviews', r => r.jobId === app.jobId && r.fromUserId === app.workerId && r.toUserId === app.employerId) !== null,
        employerReviewed: findOne('reviews', r => r.jobId === app.jobId && r.fromUserId === app.employerId && r.toUserId === app.workerId) !== null,
        workerProfile: workerProfile ? {
          ...workerProfile,
          skillPassport: workerProfile.skillPassport ? {
            ...workerProfile.skillPassport,
            rating: workerAverageRating,
            reviewsCount: workerReviews.length,
            completedJobsCount: workerCompletedJobs.length
          } : undefined,
          phone: unlocked ? (workerProfile.phone || workerUser?.phone) : undefined,
          email: undefined,
          upiId: unlocked ? workerProfile.upiId : undefined,
          location: unlocked ? workerProfile.location : { ...workerProfile.location, coordinates: undefined }
        } : { fullName: workerUser?.name || 'Worker', skills: [] },
        workerUser: { name: workerUser?.name, phone: unlocked ? workerUser?.phone : undefined, verificationStatus: workerUser?.verificationStatus },
        job: job || { title: 'Job', offeredWage: 0 }
      };
    }).sort((a, b) => (b.matchScore?.total || 0) - (a.matchScore?.total || 0));
    res.json({ success: true, count: hydrated.length, applications: hydrated });
  } catch (error) {
    console.error('getEmployerApplications error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving candidates.' });
  }
};

// Employer may decide applications, but work completion/cancellation has dedicated audited actions.
export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, employerNotes } = req.body || {};
    const allowed = ['Viewed', 'Shortlisted', 'Accepted', 'Rejected'];
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: 'Use the dedicated work lifecycle actions for starting, completing, or cancelling work.' });
    const application = findOne('applications', a => (a._id || a.id) === id);
    if (!application) return res.status(404).json({ success: false, message: 'Application not found.' });
    if (application.employerId !== idOf(req.user) && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Unauthorized to manage this application.' });
    if (!['Applied', 'Viewed', 'Shortlisted'].includes(application.status)) return res.status(409).json({ success: false, message: 'This application can no longer be changed using this action.' });
    const updated = update('applications', id, { status, employerNotes: employerNotes !== undefined ? employerNotes : application.employerNotes });
    const job = findOne('jobs', j => String(j._id || j.id) === String(application.jobId));
    if (status === 'Accepted') {
      if (job) update('jobs', job._id || job.id, { acceptedWorkerId: application.workerId, status: 'in_progress' });
      notify(application.workerId, 'You have been hired', `Your application for "${job?.title || 'the job'}" was accepted. You can now message the employer.`, 'success', `/chats?applicationId=${encodeURIComponent(String(application._id || application.id))}`);
    } else {
      notify(application.workerId, status === 'Rejected' ? 'Application not selected' : 'Application update', `Your application for "${job?.title || 'the job'}" is now ${status.toLowerCase()}.`);
    }
    res.json({ success: true, message: `Application marked as ${status}.`, application: updated });
  } catch (error) {
    console.error('updateApplicationStatus error:', error);
    res.status(500).json({ success: false, message: 'Error updating application status.' });
  }
};

export const updateWorkLifecycle = async (req, res) => {
  try {
    const actorId = idOf(req.user);
    const { action, reason } = req.body || {};
    const application = findOne('applications', a => String(a._id || a.id) === String(req.params.id));
    if (!application) return res.status(404).json({ success: false, message: 'Application not found.' });
    const isWorker = String(application.workerId) === String(actorId) && req.user.role === 'worker';
    const isEmployer = String(application.employerId) === String(actorId) && req.user.role === 'employer';
    if (!isWorker && !isEmployer && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Only the worker or employer on this job can update it.' });
    const job = findOne('jobs', j => (j._id || j.id) === application.jobId);
    const now = new Date().toISOString();
    let changes = {};
    let recipient = null;
    let title = 'Work update';
    let message = '';

    if (action === 'start_work') {
      if (!isWorker || application.status !== 'Accepted') return res.status(409).json({ success: false, message: 'Only the accepted worker can mark this job as started.' });
      changes = { status: 'InProgress', startedAt: now };
      recipient = application.employerId; title = 'Work started'; message = `${job?.title || 'The job'} has been marked as started by the worker.`;
    } else if (action === 'request_completion') {
      if (!isWorker || application.status !== 'InProgress') return res.status(409).json({ success: false, message: 'Only the assigned worker can request completion after starting the job.' });
      changes = { status: 'CompletionRequested', completionRequestedAt: now };
      recipient = application.employerId; title = 'Completion confirmation needed'; message = `The worker marked "${job?.title || 'the job'}" as finished. Please confirm the work before recording payment.`;
    } else if (action === 'confirm_completion') {
      const paymentMode = String(req.body?.paymentMode || '').toLowerCase();
      if (!isEmployer || application.status !== 'CompletionRequested') return res.status(409).json({ success: false, message: 'The employer can confirm only after the worker requests completion.' });
      if (!['online', 'offline'].includes(paymentMode)) return res.status(400).json({ success: false, message: 'Choose Online or Offline payment to finish this job.' });
      changes = paymentMode === 'offline'
        ? { status: 'Completed', paymentMode, completedAt: now, completionConfirmedAt: now }
        : { status: 'PaymentPending', paymentMode, completionConfirmedAt: now, paymentRequestedAt: now };
      recipient = application.workerId;
      title = paymentMode === 'offline' ? 'Work completed — please rate your experience' : 'Online payment is pending';
      message = paymentMode === 'offline'
        ? `The employer confirmed "${job?.title || 'the job'}" as completed with offline payment. You can now rate each other.`
        : `The employer confirmed the work and selected online payment for "${job?.title || 'the job'}". The job will be completed after you confirm that the payment arrived.`;
      if (paymentMode === 'offline') {
        const workerProfile = findOne('workerProfiles', wp => wp.userId === application.workerId);
        if (workerProfile) {
          const passport = workerProfile.skillPassport || {};
          update('workerProfiles', String(workerProfile._id || workerProfile.id), {
            skillPassport: { ...passport, completedJobsCount: (passport.completedJobsCount || 0) + 1 }
          });
        }
        const otherActive = find('applications', a => a.jobId === application.jobId && (a._id || a.id) !== req.params.id && ['Accepted', 'InProgress', 'CompletionRequested', 'PaymentPending'].includes(a.status));
        if (job) update('jobs', job._id || job.id, { status: otherActive.length ? 'in_progress' : 'completed' });
      }
    } else if (action === 'cancel') {
      const cancellationReason = String(reason || '').trim();
      if (cancellationReason.length < 5 || cancellationReason.length > 500) return res.status(400).json({ success: false, message: 'Provide a cancellation reason between 5 and 500 characters.' });
      if (!['Applied', 'Viewed', 'Shortlisted', 'Accepted', 'InProgress', 'CompletionRequested'].includes(application.status)) return res.status(409).json({ success: false, message: 'This application can no longer be cancelled.' });
      if (!isWorker && !isEmployer && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Not allowed to cancel this application.' });
      const afterStart = ['InProgress', 'CompletionRequested'].includes(application.status);
      changes = {
        status: 'Cancelled', cancelledAt: now, cancelledBy: actorId, cancellationReason,
        cancellationStage: afterStart ? 'after_work_started' : 'before_work_started',
        cancellationReviewRequired: afterStart,
        cancellationResolution: afterStart ? 'Pending admin review' : 'No review required'
      };
      recipient = isWorker ? application.employerId : application.workerId;
      title = afterStart ? 'Work cancellation needs review' : 'Application cancelled';
      message = afterStart
        ? `The other party cancelled "${job?.title || 'the job'}" after work had started. Reason: ${cancellationReason}. This has been flagged for review.`
        : `The other party cancelled "${job?.title || 'the job'}". Reason: ${cancellationReason}.`;
    } else {
      return res.status(400).json({ success: false, message: 'Unknown work lifecycle action.' });
    }

    const updated = update('applications', String(application._id || application.id), changes);
    if (!updated) return res.status(409).json({ success: false, message: 'The application changed before this update could be saved. Refresh and try again.' });
    if (action === 'cancel' && changes.cancellationReviewRequired) {
      insert('reports', {
        reportedBy: actorId,
        targetType: 'application',
        targetId: req.params.id,
        targetName: job?.title || 'Work cancellation after start',
        reason: 'Cancellation dispute',
        details: `Cancellation after work started. Reason: ${String(reason).trim()}`,
        status: 'Pending',
        actionTaken: 'Awaiting admin review',
        createdAt: now
      });
    }
    if (recipient) insert('notifications', { userId: String(recipient), title, message, type: action === 'cancel' ? 'warning' : 'info', actionUrl: action === 'cancel' ? (isWorker ? '/employer/candidates' : '/worker/applications') : (action === 'request_completion' ? '/employer/candidates' : action === 'confirm_completion' ? '/worker/applications' : `/chats?applicationId=${encodeURIComponent(String(application._id || application.id))}`), isRead: false });
    await flushStorage();
    res.json({ success: true, message: action === 'cancel' ? 'Cancellation recorded and the other party notified.' : 'Work status updated and the other party notified.', application: updated });
  } catch (error) {
    console.error('updateWorkLifecycle error:', error);
    res.status(500).json({ success: false, message: 'Error updating work status.' });
  }
};
