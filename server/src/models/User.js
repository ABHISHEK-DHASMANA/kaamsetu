import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, trim: true, default: '' },
  email: { type: String, trim: true, lowercase: true, default: '' },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['worker', 'employer', 'admin'],
    default: 'worker',
    required: true
  },
  verificationStatus: {
    type: String,
    enum: ['Registered', 'Contact Verified', 'Identity Verified'],
    default: 'Registered'
  },
  avatar: { type: String, default: '' },
  phoneVerified: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  accountDeleted: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date }
}, {
  timestamps: true
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
