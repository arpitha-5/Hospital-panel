import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true,
    index: true
  },
  uploaderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  url: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: 'Facility Image'
  },
  fileName: {
    type: String
  },
  size: {
    type: Number
  },
  mimeType: {
    type: String
  }
}, { timestamps: true });

export default mongoose.model('Media', mediaSchema);
