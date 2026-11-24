import mongoose from 'mongoose';

const paymentIntentSchema = new mongoose.Schema({
  merchantOrderId: { type: String, required: true, unique: true, index: true },
  phonepeOrderId: { type: String, default: '' },
  applicationId: { type: String, required: true, index: true },
  // Set for every pending or paid order. Sparse unique index prevents concurrent duplicate checkouts per application.
  activeApplicationId: { type: String, default: undefined },
  jobId: { type: String, required: true },
  employerId: { type: String, required: true, index: true },
  workerId: { type: String, required: true, index: true },
  amount: { type: Number, required: true, min: 1 },
  amountPaisa: { type: Number, required: true, min: 100 },
  currency: { type: String, default: 'INR' },
  provider: { type: String, default: 'phonepe' },
  status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending', index: true },
  payoutStatus: { type: String, enum: ['not_configured', 'pending_provider_settlement', 'processing', 'paid', 'failed'], default: 'not_configured', index: true },
  checkoutUrl: { type: String, default: '' },
  providerState: { type: String, default: 'PENDING' },
  verifiedAt: { type: Date, default: null },
  providerResponse: { type: mongoose.Schema.Types.Mixed, default: null }
}, { timestamps: true });

paymentIntentSchema.index({ applicationId: 1, status: 1 });
paymentIntentSchema.index({ activeApplicationId: 1 }, { unique: true, sparse: true, name: 'uniq_active_payment_application' });

export default mongoose.models.PaymentIntent || mongoose.model('PaymentIntent', paymentIntentSchema);
