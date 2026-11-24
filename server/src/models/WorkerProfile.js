import mongoose from 'mongoose';

const skillItemSchema = new mongoose.Schema({
  skillName: { type: String, required: true },
  category: { type: String, default: 'General' },
  experienceYears: { type: Number, default: 1 },
  verificationStatus: {
    type: String,
    enum: ['Self-declared', 'Evidence Submitted', 'Employer Confirmed'],
    default: 'Self-declared'
  },
  endorsementsCount: { type: Number, default: 0 },
  evidenceUrl: { type: String, default: '' }
}, { _id: false });

const workerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  upiId: { type: String, default: '' },
  upiVerified: { type: Boolean, default: false },
  upiVerificationStatus: { type: String, enum: ['verified', 'format_only', 'not_provided'], default: 'not_provided' },
  upiVerifiedAt: { type: Date, default: null },
  avatar: { type: String, default: '' },
  preferredLanguage: { type: String, default: 'Hindi' },
  workerId: { type: String, unique: true }, // e.g. "KS-W-7842"
  
  skills: [skillItemSchema],
  primarySkill: { type: String, default: 'Electrician' },
  experienceLevel: {
    type: String,
    enum: ['Fresher', 'Less than 1 year', '1–3 years', '3–5 years', '5+ years'],
    default: '1–3 years'
  },
  experienceYearsNum: { type: Number, default: 2 },

  location: {
    state: { type: String, default: 'Uttar Pradesh' },
    city: { type: String, default: 'Noida' },
    area: { type: String, default: 'Sector 62' },
    pincode: { type: String, default: '201309' },
    coordinates: {
      lat: { type: Number, default: 28.6280 },
      lng: { type: Number, default: 77.3649 }
    }
  },

  preferences: {
    expectedDailyWage: { type: Number, default: 800 },
    expectedMonthlyWage: { type: Number, default: 22000 },
    jobType: { type: String, enum: ['Full-time', 'Part-time', 'Daily Wage', 'Contract'], default: 'Daily Wage' },
    availableDates: { type: String, default: 'Immediate' },
    maxDistanceKm: { type: Number, default: 10 }
  },

  skillPassport: {
    passportId: { type: String, unique: true },
    qrCodeString: { type: String },
    verifiedSkillsCount: { type: Number, default: 0 },
    completedJobsCount: { type: Number, default: 0 },
    rating: { type: Number, default: null },
    reviewsCount: { type: Number, default: 0 },
    badges: [{ type: String }],
    issueDate: { type: Date, default: Date.now }
  },

  bio: { type: String, default: '' },
  isProfileComplete: { type: Boolean, default: true }
}, {
  timestamps: true
});

export const WorkerProfile = mongoose.models.WorkerProfile || mongoose.model('WorkerProfile', workerProfileSchema);
