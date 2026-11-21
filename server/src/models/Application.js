import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  status: {
    type: String,
    enum: ['Applied', 'Viewed', 'Shortlisted', 'Accepted', 'Rejected', 'Completed', 'Cancelled'],
    default: 'Applied'
  },

  matchScore: {
    total: { type: Number, default: 85 },
    breakdown: {
      skillScore: { type: Number, default: 90 },
      locationScore: { type: Number, default: 85 },
      wageScore: { type: Number, default: 100 },
      availabilityScore: { type: Number, default: 100 }
    },
    distanceKm: { type: Number, default: 2.1 },
    explanations: [{ type: String }]
  },

  coverNote: { type: String, default: '' },
  employerNotes: { type: String, default: '' },
  interviewScheduledAt: { type: Date }
}, {
  timestamps: true
});

// Ensure uniqueness per worker and job
applicationSchema.index({ jobId: 1, workerId: 1 }, { unique: true });

export const Application = mongoose.models.Application || mongoose.model('Application', applicationSchema);
