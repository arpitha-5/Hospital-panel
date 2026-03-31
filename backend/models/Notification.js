import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['booking', 'cancellation', 'chat', 'system'], required: true },
  isRead: { type: Boolean, default: false, index: true },
  link: { type: String } // Deep link to specific page
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);
