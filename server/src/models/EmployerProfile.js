import mongoose from 'mongoose';

const employerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  companyName: { type: String, required: true },
  contactPerson: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  industry: { type: String, default: 'Electrical & Contracting' },
  businessType: {
    type: String,
    enum: ['Individual Contractor', 'Small Business / Shop', 'Construction Company', 'Facility Management', 'Home Owner'],
    default: 'Small Business / Shop'
  },
  verificationStatus: {
    type: String,
    enum: ['Registered', 'Contact Verified', 'Identity Verified'],
    default: 'Contact Verified'
  },
  gstOrGovtId: { type: String, default: '' },
  
  address: {
    state: { type: String, default: 'Uttar Pradesh' },
    city: { type: String, default: 'Noida' },
    area: { type: String, default: 'Sector 63' },
    pincode: { type: String, default: '201301' },
    coordinates: {
      lat: { type: Number, default: 28.6271 },
      lng: { type: Number, default: 77.3820 }
    }
  },

  rating: { type: Number, default: 4.9 },
  jobsPostedCount: { type: Number, default: 0 },
  activeJobsCount: { type: Number, default: 0 },
  hiredWorkersCount: { type: Number, default: 0 },
  aboutCompany: { type: String, default: '' }
}, {
  timestamps: true
});

export const EmployerProfile = mongoose.models.EmployerProfile || mongoose.model('EmployerProfile', employerProfileSchema);
