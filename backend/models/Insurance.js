import mongoose from 'mongoose';

const insuranceSchema = new mongoose.Schema({
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  providerName: { type: String, required: true },
  policyNumber: { type: String, required: true, unique: true },
  coverageType: { type: String, required: true },
  coverageLimit: { type: Number },
  status: { type: String, enum: ['verified', 'pending', 'rejected'], default: 'pending', index: true },
  documentUrl: { type: String }
}, { timestamps: true });

export default mongoose.model('Insurance', insuranceSchema);
