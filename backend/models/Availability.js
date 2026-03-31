import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
  dayOfWeek: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], required: true },
  startTime: { type: String, required: true }, // Format HH:mm
  endTime: { type: String, required: true },
  slotDurationMinutes: { type: Number, default: 30 },
  isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

// Prevent overlapping or duplicate day entries easily
availabilitySchema.index({ doctorId: 1, dayOfWeek: 1 }, { unique: true });

export default mongoose.model('Availability', availabilitySchema);
