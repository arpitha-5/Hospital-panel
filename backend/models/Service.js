import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String, enum: ['Consultation', 'Diagnostic', 'Surgery', 'Emergency', 'Therapy', 'Other'], default: 'Other' },
  price: { type: Number, required: true },
  duration: { type: Number, default: 30 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Service', serviceSchema);
