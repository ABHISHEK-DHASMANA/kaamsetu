import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
  fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fromRole: { type: String, enum: ['worker', 'employer'], required: true },
  
  rating: { type: Number, required: true, min: 1, max: 5 },
  punctualityScore: { type: Number, min: 1, max: 5, default: 5 },
  workQualityScore: { type: Number, min: 1, max: 5, default: 5 },
  communicationScore: { type: Number, min: 1, max: 5, default: 5 },
  
  reviewText: { type: String, required: true },
  isVerifiedWork: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const Review = mongoose.models.Review || mongoose.model('Review', reviewSchema);
