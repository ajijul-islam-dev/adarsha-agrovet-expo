import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import User from './models/User.js'; // Import the User model

const app = express();
const PORT = process.env.PORT || 3000;
dotenv.config();

// Middleware
app.use(express.json());
app.use(cors({
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Test endpoint
app.get('/', (req, res) => {
  res.send('Adarsha AgroVet server is connected');
});

// User registration endpoint
app.post('/register', async (req, res) => {
  try {
    const { name, email, phone, area, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'ইউজার ইতিমধ্যে বিদ্যমান',
        errors: {
          email: email === existingUser.email ? 'এই ইমেইল ইতিমধ্যে ব্যবহৃত হয়েছে' : null,
          phone: phone === existingUser.phone ? 'এই ফোন নম্বর ইতিমধ্যে ব্যবহৃত হয়েছে' : null
        }
      });
    }

    // Create new user (role and status will be set automatically)
    const user = new User({
      name,
      email,
      phone,
      area,
      password // Note: In production, you should hash the password before saving
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'নিবন্ধন সফল হয়েছে',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        area: user.area,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'ValidationError') {
      // Handle Mongoose validation errors
      const errors = {};
      Object.keys(error.errors).forEach(key => {
        errors[key] = error.errors[key].message;
      });
      return res.status(400).json({
        success: false,
        message: 'ভ্যালিডেশন ত্রুটি',
        errors
      });
    }
    res.status(500).json({
      success: false,
      message: 'সার্ভার ত্রুটি',
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('Server is running on PORT', PORT);
});