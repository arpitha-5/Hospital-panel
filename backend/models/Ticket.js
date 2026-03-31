import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema({
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true },
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open' },
  responses: [{
    senderType: { type: String, enum: ['staff', 'support_admin'] },
    senderId: mongoose.Schema.Types.ObjectId,
    message: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.model('Ticket', ticketSchema);
