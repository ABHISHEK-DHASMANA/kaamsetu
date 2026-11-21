import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, unique: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
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
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date }
}, {
  timestamps: true
});

export const User = mongoose.models.User || mongoose.model('User', userSchema);
