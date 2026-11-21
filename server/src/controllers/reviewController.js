import { find, findOne, insert } from '../services/storage.js';

export const createReview = async (req, res) => {
  try {
    const fromUserId = req.user._id || req.user.id;
    const { toUserId, jobId, rating, punctualityScore, workQualityScore, communicationScore, reviewText } = req.body;

    if (!toUserId || !rating || !reviewText || Number(rating) < 1 || Number(rating) > 5) {
      return res.status(400).json({ success: false, message: 'Provide a target user, review text, and a rating from 1 to 5.' });
    }

    const completedWork = findOne('applications', a =>
      a.status === 'Completed' && a.jobId === jobId &&
      ((a.workerId === fromUserId && a.employerId === toUserId) ||
       (a.employerId === fromUserId && a.workerId === toUserId))
    );
    if (!completedWork) {
      return res.status(403).json({ success: false, message: 'Reviews are available only between the two people on a completed KaamSetu job.' });
    }
    if (findOne('reviews', r => r.fromUserId === fromUserId && r.toUserId === toUserId && r.jobId === jobId)) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this completed job.' });
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
      reviewText,
      isVerifiedWork: true,
      createdAt: new Date().toISOString()
    });

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
