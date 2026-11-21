import mongoose from 'mongoose';

const paymentIntentSchema = new mongoose.Schema({
  merchantOrderId: { type: String, required: true, unique: true, index: true },
  phonepeOrderId: { type: String, default: '' },
  applicationId: { type: String, required: true, index: true },
  jobId: { type: String, required: true },
  employerId: { type: String, required: true, index: true },
  workerId: { type: String, required: true, index: true },
  amount: { type: Number, required: true, min: 1 },
  amountPaisa: { type: Number, required: true, min: 100 },
  currency: { type: String, default: 'INR' },
  provider: { type: String, default: 'phonepe' },
  status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending', index: true },
  checkoutUrl: { type: String, default: '' },
  providerState: { type: String, default: 'PENDING' },
  verifiedAt: { type: Date, default: null },
  providerResponse: { type: mongoose.Schema.Types.Mixed, default: null }
}, { timestamps: true });

paymentIntentSchema.index({ applicationId: 1, status: 1 });

export default mongoose.models.PaymentIntent || mongoose.model('PaymentIntent', paymentIntentSchema);
