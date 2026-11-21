import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: {
    type: String,
    enum: ['job', 'employer', 'worker'],
    required: true
  },
  targetId: { type: String, required: true },
  targetName: { type: String, required: true },
  reason: {
    type: String,
    enum: ['Wage Fraud / Unpaid', 'False Skill Representation', 'Abusive Behavior', 'Unsafe Working Conditions', 'Suspicious / Scam Listing', 'Other'],
    required: true
  },
  details: { type: String, required: true },
  evidenceUrls: [{ type: String }],
  status: {
    type: String,
    enum: ['Pending', 'Under Investigation', 'Resolved', 'Dismissed'],
    default: 'Pending'
  },
  adminNotes: { type: String, default: '' },
  actionTaken: { type: String, default: 'None' }
}, {
  timestamps: true
});

export const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);
