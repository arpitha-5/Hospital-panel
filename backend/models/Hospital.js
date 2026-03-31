import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Hospital name is required'], index: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true, index: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true }
  },
  facilities: [{ type: String }],
  images: [{ type: String }], // Real Cloudinary URLs to be injected here
  emergencyContact: {
    name: { type: String },
    phone: { type: String }
  },
  status: { type: String, enum: ['pending', 'active', 'paused'], default: 'pending', index: true },
  waitingTimeMinutes: { type: Number, default: 0 },
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true, required: true }
}, { timestamps: true });

// Ensure fast lookup for active hospitals by city
hospitalSchema.index({ city: 1, status: 1 });

export default mongoose.model('Hospital', hospitalSchema);
