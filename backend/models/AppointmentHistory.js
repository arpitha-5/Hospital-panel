import mongoose from 'mongoose';

const appointmentHistorySchema = new mongoose.Schema({
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true, index: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
  previousStatus: { type: String },
  newStatus: { type: String, required: true },
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed } // reschedule details, etc.
}, { timestamps: true });

appointmentHistorySchema.index({ appointmentId: 1, createdAt: -1 });

export default mongoose.model('AppointmentHistory', appointmentHistorySchema);
