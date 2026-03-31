import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  planType: { type: String, enum: ['basic', 'premium', 'vip'], required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  remainingFreeVisits: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });

export default mongoose.model('Membership', membershipSchema);
