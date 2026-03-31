import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', index: true, required: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', index: true, required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true }, // Assumes patient is User
  date: { type: Date, required: true, index: true },
  timeSlot: { type: String, required: true }, // Format HH:mm
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show', 'rescheduled'], 
    default: 'pending',
    index: true
  },
  cancellationReason: { type: String },
  visitNotes: {
    prescriptions: [{ type: String }], // Real Cloudinary links
    diagnosticNotes: { type: String }
  },
  isPremiumService: { type: Boolean, default: false }
}, { timestamps: true });

// Prevent double booking at db level
appointmentSchema.index({ doctorId: 1, date: 1, timeSlot: 1 }, { unique: true });

export default mongoose.model('Appointment', appointmentSchema);
