import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from './models/User.js';

const app = express();
const PORT = process.env.PORT || 3000;
dotenv.config();

// Middleware
app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// JWT Secret Key
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

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

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      name,
      email,
      phone,
      area,
      password: hashedPassword,
      role: "officer",
      status: "pending"
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

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'ইমেইল বা পাসওয়ার্ড ভুল'
      });
    }

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'ইমেইল বা পাসওয়ার্ড ভুল'
      });
    }

    // 3. Check if the user account is active
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'আপনার অ্যাকাউন্ট এখনও সক্রিয় হয়নি'
      });
    }

    // 4. Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '1d' } // Token expires in 1 day
    );

    // 5. Send success response with token
    res.status(200).json({
      success: true,
      message: 'লগইন সফল হয়েছে',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status
      }
    });

  } catch (error) {
    console.error('Login error:', error);
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
