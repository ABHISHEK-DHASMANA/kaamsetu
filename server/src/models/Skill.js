import mongoose from 'mongoose';

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  description: { type: String },
  icon: { type: String, default: 'Wrench' },
  benchmarkWageMin: { type: Number, default: 600 },
  benchmarkWageMax: { type: Number, default: 1100 },
  demandLevel: { type: String, enum: ['High', 'Moderate', 'Very High'], default: 'High' }
}, {
  timestamps: true
});

export const Skill = mongoose.models.Skill || mongoose.model('Skill', skillSchema);
