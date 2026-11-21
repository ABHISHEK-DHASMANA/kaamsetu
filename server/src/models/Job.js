import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  employerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  employerProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmployerProfile' },
  companyName: { type: String, required: true },
  
  title: { type: String, required: true },
  category: { type: String, default: 'Electrician' },
  requiredSkills: [{ type: String, required: true }],
  description: { type: String, required: true },
  requiredExperience: {
    type: String,
    enum: ['Any', 'Fresher', 'Less than 1 year', '1–3 years', '3–5 years', '5+ years'],
    default: '1–3 years'
  },
  vacancies: { type: Number, default: 1 },
  filledVacancies: { type: Number, default: 0 },

  // Fair Wage Transparency
  offeredWage: { type: Number, required: true },
  wageType: { type: String, enum: ['daily', 'monthly', 'task'], default: 'daily' },
  workDuration: { type: String, default: '7 Days' },
  paymentFrequency: {
    type: String,
    enum: ['Daily at shift end', 'Weekly every Saturday', 'Monthly on 1st', 'Upon Job Completion'],
    default: 'Daily at shift end'
  },
  paymentTerms: { type: String, default: 'Direct Cash / UPI upon shift completion without delay' },
  deductions: { type: String, default: 'Zero deductions. Full agreed wage handed over.' },
  overtimeTerms: { type: String, default: '₹120/hr overtime compensation after 8 hours' },
  wageTransparencyWarnings: [{ type: String }],

  location: {
    address: { type: String, default: 'Sector 63, H-Block' },
    area: { type: String, default: 'Sector 63' },
    city: { type: String, default: 'Noida' },
    state: { type: String, default: 'Uttar Pradesh' },
    pincode: { type: String, default: '201301' },
    coordinates: {
      lat: { type: Number, default: 28.6271 },
      lng: { type: Number, default: 77.3820 }
    }
  },

  startDate: { type: Date, default: () => new Date(Date.now() + 86400000) },
  endDate: { type: Date },
  workTimings: { type: String, default: '9:00 AM - 6:00 PM (1 hr lunch)' },
  employerContact: {
    phone: { type: String },
    personName: { type: String }
  },

  status: {
    type: String,
    enum: ['active', 'in_progress', 'completed', 'cancelled'],
    default: 'active'
  },
  applicantsCount: { type: Number, default: 0 },
  shortlistedCount: { type: Number, default: 0 },
  acceptedWorkerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  isReported: { type: Boolean, default: false },
  reportCount: { type: Number, default: 0 }
}, {
  timestamps: true
});

export const Job = mongoose.models.Job || mongoose.model('Job', jobSchema);
