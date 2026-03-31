import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', index: true, required: true },
  name: { type: String, required: [true, 'Doctor name is required'], trim: true },
  specialization: { type: String, required: true, index: true },
  experienceYears: { type: Number, required: true, min: [0, 'Experience cannot be negative'] },
  consultationFee: { type: Number, required: true },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  image: { type: String },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });

doctorSchema.index({ hospitalId: 1, specialization: 1 });

export default mongoose.model('Doctor', doctorSchema);
