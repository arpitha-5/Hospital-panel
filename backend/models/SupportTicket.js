import mongoose from 'mongoose';

const supportTicketSchema = new mongoose.Schema({
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['open', 'in-progress', 'resolved', 'closed'], default: 'open', index: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'low' },
  responses: [{
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['admin', 'staff', 'support'] },
    message: { type: String, required: true },
    attachments: [{ type: String }],
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

export default mongoose.model('SupportTicket', supportTicketSchema);
