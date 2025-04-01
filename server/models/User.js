// models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'পূর্ণ নাম আবশ্যক'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'ইমেইল আবশ্যক'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} সঠিক ইমেইল নয়`
    }
  },
  phone: {
    type: String,
    required: [true, 'ফোন নম্বর আবশ্যক'],
    unique: true,
    validate: {
      validator: function(v) {
        return /^\+?\d{10,14}$/.test(v);
      },
      message: props => `${props.value} সঠিক ফোন নম্বর নয়`
    }
  },
  area: {
    type: String,
    required: [true, 'এলাকা নির্বাচন করুন'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'পাসওয়ার্ড আবশ্যক'],
    minlength: [6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে']
  },
  role: {
    type: String,
    enum: ['officer', 'admin', 'stock-manager'],
    default: 'officer'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'rejected'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to update the updatedAt field before saving
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create and export the model
const User = mongoose.model('User', UserSchema);
export default User;