import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  roomId: { type: String, required: true, index: true }, // e.g., hospitalId_userId
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  attachments: [{ type: String }] // URLs to Cloudinary
}, { timestamps: true });

// Optimizing chat history fetching
chatSchema.index({ roomId: 1, createdAt: -1 });

export default mongoose.model('Chat', chatSchema);
