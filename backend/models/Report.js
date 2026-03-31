import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reportType: { type: String, enum: ['daily_summary', 'monthly_analytics', 'doctor_performance'], required: true },
  periodStart: { type: Date, required: true },
  periodEnd: { type: Date, required: true },
  dataSnapshot: { type: mongoose.Schema.Types.Mixed }, // Stores aggregated data so historical reports remain static
  exportUrl: { type: String }, // Link to PDF/CSV in Cloudinary/S3
}, { timestamps: true });

export default mongoose.model('Report', reportSchema);
