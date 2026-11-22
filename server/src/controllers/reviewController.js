import { find, findOne, insert, update } from '../services/storage.js';

export const createReview = async (req, res) => {
  try {
    const fromUserId = req.user._id || req.user.id;
    const { toUserId, jobId, rating, punctualityScore, workQualityScore, communicationScore, reviewText } = req.body;

    if (!toUserId || toUserId === fromUserId || !jobId || !reviewText || String(reviewText).trim().length < 3 || String(reviewText).length > 1000 || !Number.isInteger(Number(rating)) || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ success: false, message: 'Provide a target user, review text, and a rating from 1 to 5.' });
    }

    const completedWork = findOne('applications', a =>
      a.status === 'Completed' && a.jobId === jobId &&
      ((a.workerId === fromUserId && a.employerId === toUserId) ||
       (a.employerId === fromUserId && a.workerId === toUserId))
    );
    if (!completedWork || !['worker', 'employer'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Reviews are available only between the two people on a completed KaamSetu job.' });
    }
    if (findOne('reviews', r => r.fromUserId === fromUserId && r.toUserId === toUserId && r.jobId === jobId)) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this completed job.' });
    }

    const targetUser = findOne('users', user => (user._id || user.id) === toUserId);
    if (!targetUser || !['worker', 'employer'].includes(targetUser.role)) {
      return res.status(404).json({ success: false, message: 'The person you are reviewing could not be found.' });
    }

    const review = insert('reviews', {
      fromUserId,
      toUserId,
      jobId: jobId || null,
      fromRole: req.user.role,
      rating: Number(rating),
      punctualityScore: Number(punctualityScore) || 5,
      workQualityScore: Number(workQualityScore) || 5,
      communicationScore: Number(communicationScore) || 5,
      reviewText: String(reviewText).trim(),
      isVerifiedWork: true,
      createdAt: new Date().toISOString()
    });

    const targetReviews = find('reviews', item => item.toUserId === toUserId);
    const averageRating = targetReviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / Math.max(targetReviews.length, 1);
    if (targetUser.role === 'worker') {
      const workerProfile = findOne('workerProfiles', profile => profile.userId === toUserId);
      if (workerProfile) {
        const passport = workerProfile.skillPassport || {};
        update('workerProfiles', workerProfile._id || workerProfile.id, {
          skillPassport: { ...passport, rating: Math.round(averageRating * 10) / 10, reviewsCount: targetReviews.length }
        });
      }
    } else {
      const employerProfile = findOne('employerProfiles', profile => profile.userId === toUserId);
      if (employerProfile) update('employerProfiles', employerProfile._id || employerProfile.id, { rating: Math.round(averageRating * 10) / 10, reviewsCount: targetReviews.length });
    }

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully! It reflects on the worker Skill Passport / Employer profile.',
      review
    });
  } catch (error) {
    console.error('createReview error:', error);
    res.status(500).json({ success: false, message: 'Error submitting review.' });
  }
};

export const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const reviews = find('reviews', r => r.toUserId === userId);
    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    console.error('getUserReviews error:', error);
    res.status(500).json({ success: false, message: 'Error retrieving reviews.' });
  }
};
