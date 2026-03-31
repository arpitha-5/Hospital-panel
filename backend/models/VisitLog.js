import mongoose from 'mongoose';

const visitLogSchema = new mongoose.Schema({
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', index: true },
  visitDate: { type: Date, required: true, index: true },
  checkInTime: { type: String },
  checkOutTime: { type: String },
  notes: { type: String }
}, { timestamps: true });

visitLogSchema.index({ hospitalId: 1, visitDate: -1 });
visitLogSchema.index({ patientId: 1, visitDate: -1 });

export default mongoose.model('VisitLog', visitLogSchema);
