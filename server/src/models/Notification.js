import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['info', 'success', 'warning', 'alert'],
    default: 'info'
  },
  actionUrl: { type: String },
  isRead: { type: Boolean, default: false }
}, {
  timestamps: true
});

export const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
