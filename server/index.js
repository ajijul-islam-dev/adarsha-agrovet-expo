import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Product from './models/Product.js'
import Store from './models/Store.js'

const app = express();
const PORT = process.env.PORT || 3000;
dotenv.config();

// Middleware
app.use(express.json());
app.use(cors());

// JWT Verification Middleware
const verifyToken = async (req, res, next) => {
  const token = req.headers.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Authentication token required' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    console.log(decoded.id)
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or expired token',
      error: error.message
    });
  }
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.get('/', (req, res) => {
  res.send('Adarsha AgroVet server is connected');
});

// User Registration
app.post('/register', async (req, res) => {
  try {
    const { name, email, phone, area, password } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
        errors: {
          email: email === existingUser.email ? 'Email already in use' : null,
          phone: phone === existingUser.phone ? 'Phone already in use' : null
        }
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      phone,
      area,
      password: hashedPassword,
      role: "officer",
      status: "pending" // Default status
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Registration successful',
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
        message: 'Validation error',
        errors
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// User Login
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  try {
    const user = await User.findOne({ email }).select('+password +status');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Status check before password verification
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.status}`,
        status: user.status
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const tokenPayload = {
      id: user._id,
      email: user.email,
      role: user.role,
      status: user.status,
      area: user.area,
      phone: user.phone
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        role: user.role,
        area: user.area,
        phone: user.phone
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get Current User
app.get('/current-user', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify status from database
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.status}`,
        status: user.status
      });
    }

    res.json({
      success: true,
      user: user.toObject()
    });

  } catch (error) {
    console.error('Current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Admin Endpoints
app.patch('/approve-user/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin privileges required'
    });
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status: 'active' },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User approved',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Approval failed'
    });
  }
});

// _____________________Products___________________________
// Product Routes

// Create a Product
app.post('/products', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'officer') {
    return res.status(403).json({
      success: false,
      message: 'Admin or officer privileges required'
    });
  }

  try {
    const { productName, productCode, category, price, stock, packSize, unit, description } = req.body;

    const existingProduct = await Product.findOne({ productCode });
    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'Product with this code already exists'
      });
    }

    const product = new Product({
      productName,
      productCode,
      category,
      price,
      stock,
      packSize,
      unit,
      description,
    });

    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });

  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get all Products
app.get('/products', async (req, res) => {
  try {
    const { search, sort } = req.query;

    let query = {};
    if (search) {
      query.productName = { $regex: search, $options: 'i' }; // Case-insensitive search
    }

    let sortOption = {};
    if (sort === 'price') {
      sortOption.price = -1; // Sort by price descending
    } else if (sort === 'stock') {
      sortOption.stock = -1; // Sort by stock descending
    }

    const products = await Product.find(query).sort(sortOption);

    res.json({
      success: true,
      products
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get Product by ID
app.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }
    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Update Product
app.patch('/products/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'officer') {
    return res.status(403).json({
      success: false,
      message: 'Admin or officer privileges required'
    });
  }

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Delete Product
app.delete('/products/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin privileges required'
    });
  }

  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

//_____________________Oficers______________________


// Get all officers with optional search and area filtering (admin only)
app.get('/officers', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin privileges required'
    });
  }

  try {
    const { search, area } = req.query;
    
    // Base query to only get users with officer role
    let query = { role: 'officer' };
    
    // Add search conditions if search parameter exists
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },  // Case-insensitive name search
        { email: { $regex: search, $options: 'i' } }, // Case-insensitive email search
        { phone: { $regex: search, $options: 'i' } },  // Case-insensitive phone search
        { areaCode: { $regex: search, $options: 'i' } } // Case-insensitive area code search
      ];
    }
    
    // Add area filter if area parameter exists and is not 'all'
    if (area && area !== 'all') {
      query.area = area;
    }

    // Execute query with password field excluded
    const officers = await User.find(query)
      .select('-password -__v')  // Exclude sensitive fields
      .sort({ createdAt: -1 });  // Sort by newest first

    res.json({
      success: true,
      count: officers.length,
      officers
    });
    
  } catch (error) {
    console.error('Get officers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch officers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update officer profile (admin or the officer themselves)
app.patch('/officers/:id', verifyToken, async (req, res) => {
  try {
    // Only allow admin or the officer themselves to update
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access'
      });
    }

    const { name, email, phone, area, password } = req.body;
    const updateData = { name, email, phone, area };

    // If password is being updated
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // Admin can update status and role
    if (req.user.role === 'admin') {
      if (req.body.status) updateData.status = req.body.status;
      if (req.body.role) updateData.role = req.body.role;
    }

    const updatedOfficer = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).select('-password -__v');

    if (!updatedOfficer) {
      return res.status(404).json({
        success: false,
        message: 'Officer not found'
      });
    }

    res.json({
      success: true,
      message: 'Officer updated successfully',
      officer: updatedOfficer
    });
  } catch (error) {
    console.error('Update officer error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update officer',
      error: error.message
    });
  }
});

// Delete officer (admin only)
app.delete('/officers/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin privileges required'
    });
  }

  try {
    const deletedOfficer = await User.findOneAndDelete({
      _id: req.params.id,
      role: 'officer'
    });

    if (!deletedOfficer) {
      return res.status(404).json({
        success: false,
        message: 'Officer not found'
      });
    }

    res.json({
      success: true,
      message: 'Officer deleted successfully'
    });
  } catch (error) {
    console.error('Delete officer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete officer',
      error: error.message
    });
  }
});

// Get officers by area (for admin dashboard)
app.get('/officers-by-area', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin privileges required'
    });
  }

  try {
    const officersByArea = await User.aggregate([
      { $match: { role: 'officer', status: 'active' } },
      { $group: { _id: '$area', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      officersByArea
    });
  } catch (error) {
    console.error('Officers by area error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get officers by area',
      error: error.message
    });
  }
});



// _____________________Stores___________________________
// Store Routes

// Create Store
app.post('/stores', verifyToken, async (req, res) => {
  try {
    const { storeName, proprietorName, address, contactNumber, area, storeCode } = req.body;

    // Check if store code already exists
    const existingStore = await Store.findOne({ storeCode });
    if (existingStore) {
      return res.status(400).json({
        success: false,
        message: 'Store with this code already exists'
      });
    }

    // Create new store with current user as marketing officer
    const store = new Store({
      storeName,
      proprietorName,
      address,
      contactNumber,
      area,
      storeCode,
      officers: {
        marketingOfficer: req.user.id
      },
      createdBy: req.user.id,
      paymentHistory: [],
      dueHistory: []
    });

    await store.save();

    res.status(201).json({
      success: true,
      message: 'Store created successfully',
      store
    });

  } catch (error) {
    console.error('Create store error:', error);
    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach(key => {
        errors[key] = error.errors[key].message;
      });
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get All Stores with Filtering
app.get('/stores', verifyToken, async (req, res) => {
  try {
    const { search, area, status, marketingOfficer, limit = 10, page = 1 } = req.query;

    let query = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { storeName: { $regex: search, $options: 'i' } },
        { proprietorName: { $regex: search, $options: 'i' } },
        { storeCode: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Area filter
    if (area) {
      query.area = area;
    }
    
    // Status filter
    if (status) {
      query.status = status;
    }
    
    // Marketing officer filter
    if (marketingOfficer) {
      query['officers.marketingOfficer'] = marketingOfficer;
    }

    // For non-admin users, only show their assigned stores
    if (req.user.role !== 'admin') {
      query['officers.marketingOfficer'] = req.user.id;
    }

    // Pagination settings
    const skip = (page - 1) * limit;

    const stores = await Store.find(query)
      .populate('officers.marketingOfficer', 'name email phone')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalStores = await Store.countDocuments(query);
    const totalPages = Math.ceil(totalStores / limit);

    res.json({
      success: true,
      count: stores.length,
      stores,
      pagination: {
        totalStores,
        totalPages,
        currentPage: page,
        perPage: limit
      }
    });

  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stores',
      error: error.message
    });
  }
});

// // Get Single Store
// app.get('/stores/:id', verifyToken, async (req, res) => {
//   try {
//     const store = await Store.findById(req.params.id)
//       .populate('officers.marketingOfficer', 'name email phone')
//       .populate('createdBy', 'name')
//       .populate('paymentHistory.recordedBy', 'name')
//       .populate('dueHistory.recordedBy', 'name');

//     if (!store) {
//       return res.status(404).json({
//         success: false,
//         message: 'Store not found'
//       });
//     }

//     // Check if user has access (admin or assigned marketing officer)
//     if (req.user.role !== 'admin' && 
//         store.officers.marketingOfficer._id.toString() !== req.user.id) {
//       return res.status(403).json({
//         success: false,
//         message: 'Unauthorized access to this store'
//       });
//     }

//     res.json({
//       success: true,
//       store
//     });

//   } catch (error) {
//     console.error('Get store error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Server error',
//       error: error.message
//     });
//   }
// });

// Update Store
app.patch('/stores/:id', verifyToken, async (req, res) => {
  try {
    // First get the store to check permissions
    const existingStore = await Store.findById(req.params.id);
    
    if (!existingStore) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check permissions (admin or marketing officer)
    if (req.user.role !== 'admin' && 
        existingStore.officers.marketingOfficer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this store'
      });
    }

    // Prevent updating store code if it already exists
    if (req.body.storeCode && req.body.storeCode !== existingStore.storeCode) {
      const codeExists = await Store.findOne({ storeCode: req.body.storeCode });
      if (codeExists) {
        return res.status(400).json({
          success: false,
          message: 'Store code already exists'
        });
      }
    }

    const updatedStore = await Store.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
    .populate('officers.marketingOfficer', 'name email phone')
    .populate('createdBy', 'name');

    res.json({
      success: true,
      message: 'Store updated successfully',
      store: updatedStore
    });

  } catch (error) {
    console.error('Update store error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Delete Store (Admin only)
app.delete('/stores/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin privileges required'
    });
  }

  try {
    const deletedStore = await Store.findByIdAndDelete(req.params.id);
    
    if (!deletedStore) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    res.json({
      success: true,
      message: 'Store deleted successfully'
    });

  } catch (error) {
    console.error('Delete store error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Add Payment to Store
app.post('/stores/:id/payments', verifyToken, async (req, res) => {
  try {
    const { amount, method, notes } = req.body;
    
    const store = await Store.findById(req.params.id);
    
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check permissions (admin or marketing officer)
    if (req.user.role !== 'admin' && 
        store.officers.marketingOfficer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to add payments for this store'
      });
    }

    const payment = {
      amount,
      method,
      notes,
      recordedBy: req.user.id
    };

    store.paymentHistory.push(payment);
    await store.save();

    res.status(201).json({
      success: true,
      message: 'Payment added successfully',
      payment
    });

  } catch (error) {
    console.error('Add payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Add Due to Store
app.post('/stores/:id/dues', verifyToken, async (req, res) => {
  try {
    const { amount, dueDate, reason } = req.body;
    
    const store = await Store.findById(req.params.id);
    
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check permissions (admin or marketing officer)
    if (req.user.role !== 'admin' && 
        store.officers.marketingOfficer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to add dues for this store'
      });
    }

    const due = {
      amount,
      dueDate,
      reason,
      recordedBy: req.user.id
    };

    store.dueHistory.push(due);
    await store.save();

    res.status(201).json({
      success: true,
      message: 'Due added successfully',
      due
    });

  } catch (error) {
    console.error('Add due error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get My Stores for Marketing Officer
app.get('/stores/my-stores',verifyToken, async (req, res) => {
  try {
    const { search, area } = req.query;
    // Query stores where the logged-in user's ID matches the marketingOfficer field
    let query = { 'officers.marketingOfficer': req.user.id };
    // Search filter
    if (search) {
      query.$or = [
        { storeName: { $regex: search, $options: 'i' } },
        { proprietorName: { $regex: search, $options: 'i' } },
        { storeCode: { $regex: search, $options: 'i' } }
      ];
    }

    // Area filter
    if (area && area !== 'all') {
      query.area = area;
    }

    // Fetch stores with populated marketing officer and created by fields
    const stores = await Store.find(query)
      .populate('officers.marketingOfficer', 'name email phone') // Populate marketingOfficer field
      .populate('createdBy', 'name email') // Populate createdBy field
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: stores.length,
      stores
    });

  } catch (error) {
    console.error('Get my stores error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your stores',
      error: error.message
    });
  }
});



// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});