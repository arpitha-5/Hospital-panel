import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true },
  email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address.'] },
  password: { type: String, required: [true, 'Password is required'], minlength: 6, select: false },
  role: { type: String, enum: ['admin', 'staff', 'patient'], default: 'staff', index: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', index: true },
  status: { type: String, enum: ['active', 'inactive', 'suspended'], default: 'active' },
  isVerified: { type: Boolean, default: false },
  lastLogin: { type: Date },
  refreshToken: { type: String, select: false }
}, { timestamps: true });

// Index is already created by unique: true on email

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
