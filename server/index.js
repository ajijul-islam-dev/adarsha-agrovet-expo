import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Product from './models/Product.js'
import Store from './models/Store.js'
import Order from './models/Order.js';


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
      { expiresIn: '72h' }
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


app.patch('/products/:id/stock', verifyToken, async (req, res) => {
  try {
    const { quantity } = req.body;
    
    // Validate input
    if (typeof quantity !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be a number'
      });
    }

    if (quantity === 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity cannot be zero'
      });
    }

    // Find the product
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Calculate new stock
    const newStock = product.stock + quantity;

    // Validate stock won't go negative
    if (newStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock. Cannot reduce stock below zero',
        currentStock: product.stock,
        attemptedReduction: Math.abs(quantity)
      });
    }

    // Update the product stock
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { stock: newStock },
      { new: true }
    );

    res.json({
      success: true,
      message: quantity > 0 
        ? `Stock increased by ${quantity}` 
        : `Stock decreased by ${Math.abs(quantity)}`,
      product: {
        id: updatedProduct._id,
        name: updatedProduct.productName,
        previousStock: product.stock,
        newStock: updatedProduct.stock,
        change: quantity
      }
    });

  } catch (error) {
    console.error('Update product stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product stock',
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

// Get Single Store
app.get('/get-stores/:id', verifyToken, async (req, res) => {
  try {
    const store = await Store.findById(req.params.id)
    console.log(store)
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check if user has access (admin or assigned marketing officer)
    if (req.user.role !== 'admin' && 
        store.officers.marketingOfficer._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this store'
      });
    }

    res.json({
      success: true,
      store
    });

  } catch (error) {
    console.error('Get store error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

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

// _____________________Orders___________________________

// Create or update draft order
app.post('/api/orders/draft', verifyToken, async (req, res) => {
  try {
    const { storeId, product, quantity, bonusQuantity, discountPercentage, notes } = req.body;

    // Validate required fields
    if (!storeId || !product || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Store ID, product, and quantity are required'
      });
    }

    // Check if store exists
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check if product exists
    const productExists = await Product.findById(product.id);
    if (!productExists) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if draft order already exists for this store
    let order = await Order.findOne({
      store: storeId,
      status: 'draft',
      createdBy: req.user.id
    });

    if (order) {
      // Update existing draft
      const existingProductIndex = order.products.findIndex(
        p => p.product.toString() === product.id
      );

      if (existingProductIndex >= 0) {
        // Update existing product in order
        order.products[existingProductIndex].quantity = quantity;
        order.products[existingProductIndex].bonusQuantity = bonusQuantity || 0;
        order.products[existingProductIndex].discountPercentage = discountPercentage || 0;
      } else {
        // Add new product to order
        order.products.push({
          product: product.id,
          name: product.name,
          price: product.price,
          packSize: product.packSize,
          unit: product.unit,
          quantity,
          bonusQuantity: bonusQuantity || 0,
          discountPercentage: discountPercentage || 0
        });
      }

      order.notes = notes || order.notes;
      order.updatedAt = new Date();
    } else {
      // Create new draft order
      order = new Order({
        store: storeId,
        products: [{
          product: product.id,
          name: product.name,
          price: product.price,
          packSize: product.packSize,
          unit: product.unit,
          quantity,
          bonusQuantity: bonusQuantity || 0,
          discountPercentage: discountPercentage || 0
        }],
        status: 'draft',
        notes: notes || `Order for ${store.storeName}`,
        createdBy: req.user.id,
        marketingOfficer: req.user.id
      });
    }

    await order.save();

    res.status(order.isNew ? 201 : 200).json({
      success: true,
      message: order.isNew ? 'Draft order created' : 'Draft order updated',
      order
    });

  } catch (error) {
    console.error('Draft order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save draft order',
      error: error.message
    });
  }
});

// Update draft order
app.patch('/api/orders/:id', verifyToken, async (req, res) => {
  try {
    const { product, quantity, bonusQuantity, discountPercentage, notes } = req.body;

    // Find the existing order
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check permissions (admin or marketing officer who created it)
    if (req.user.role !== 'admin' && order.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this order'
      });
    }

    // Verify it's a draft
    if (order.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft orders can be updated'
      });
    }

    // Check if product exists
    const productExists = await Product.findById(product.id);
    if (!productExists) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Find existing product in order or add new one
    const existingProductIndex = order.products.findIndex(
      p => p.product.toString() === product.id
    );

    if (existingProductIndex >= 0) {
      // Update existing product
      order.products[existingProductIndex].quantity = quantity;
      order.products[existingProductIndex].bonusQuantity = bonusQuantity || 0;
      order.products[existingProductIndex].discountPercentage = discountPercentage || 0;
    } else {
      // Add new product
      order.products.push({
        product: product.id,
        name: product.name,
        price: product.price,
        packSize: product.packSize,
        unit: product.unit,
        quantity,
        bonusQuantity: bonusQuantity || 0,
        discountPercentage: discountPercentage || 0
      });
    }

    // Update notes if provided
    if (notes) {
      order.notes = notes;
    }

    order.updatedAt = new Date();
    await order.save();

    res.json({
      success: true,
      message: 'Draft order updated',
      order
    });

  } catch (error) {
    console.error('Update draft order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update draft order',
      error: error.message
    });
  }
});

// Submit draft order
app.post('/api/orders/:id/submit', verifyToken, async (req, res) => {
  try {
    // 1. Find Order (Existing Code)
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // 2. Draft Check (Existing Code)
    if (order.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Only draft orders can be submitted'
      });
    }

    // 3. Stock Validation (Fixed to check both quantities)
    const productStockChecks = await Promise.all(
      order.products.map(async (item) => {
        const product = await Product.findById(item.product);
        if (!product) {
          return { valid: false, productId: item.product, reason: 'Product not found' };
        }
        // Fixed: Now properly checking both quantity and bonusQuantity
        const totalDeduction = item.quantity + (item.bonusQuantity || 0);
        if (product.stock < totalDeduction) {
          return { valid: false, productId: item.product, reason: 'Insufficient stock' };
        }
        return { valid: true, productId: item.product };
      })
    );

    const invalidProducts = productStockChecks.filter(check => !check.valid);
    if (invalidProducts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock validation failed',
        errors: invalidProducts
      });
    }

    // 4. Stock Deduction (Fixed to deduct both quantities)
    for (const item of order.products) {
      await Product.findByIdAndUpdate(
        item.product,
        { 
          $inc: { 
            stock: -(
              item.quantity + 
              (item.bonusQuantity || 0) // Fixed: Using bonusQuantity consistently
            ) 
          } 
        }
      );
    }

    // 5. Order Status Update (Existing Code - Unchanged)
    order.status = 'pending';
    order.submittedAt = new Date();
    await order.save();

    // 6. Response (Existing Code - Unchanged)
    res.json({
      success: true,
      message: 'Order submitted and stock updated (including bonus quantity)',
      order
    });

  } catch (error) {
    console.error('Submit order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit order',
      error: error.message
    });
  }
});
// Get draft orders for a store
app.get('/api/orders/draft', verifyToken, async (req, res) => {
  try {
    const { storeId } = req.query;
    
    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: 'Store ID is required'
      });
    }

    const order = await Order.findOne({
      store: storeId,
      status: 'draft',
      createdBy: req.user.id
    }).populate('products.product', 'productName price packSize unit');
    console.log(order)
    if (!order) {
      return res.json({
        success: true,
        order: null
      });
    }

    // Calculate amounts for each product
    const productsWithAmounts = order.products.map(product => {
      const discountedPrice = product.price * (1 - (product.discountPercentage || 0) / 100);
      const finalAmount = discountedPrice * product.quantity;
      return {
        ...product.toObject(),
        totalAmount: product.price * product.quantity,
        finalAmount
      };
    });

    // Calculate order totals
    const orderTotal = productsWithAmounts.reduce((sum, p) => sum + (p.price * p.quantity), 0);
    const orderFinalTotal = productsWithAmounts.reduce((sum, p) => sum + p.finalAmount, 0);

    const enhancedOrder = {
      ...order.toObject(),
      products: productsWithAmounts,
      orderTotal,
      orderFinalTotal,
      totalDiscount: orderTotal - orderFinalTotal
    };

    res.json({
      success: true,
      order: enhancedOrder
    });

  } catch (error) {
    console.error('Get draft order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch draft order',
      error: error.message
    });
  }
});

// Enhanced Get all orders with filtering, searching and sorting
// Enhanced Get all orders with filtering, searching and sorting
app.get('/api/orders', verifyToken, async (req, res) => {
  try {
    const { 
      storeId, 
      status, 
      fromDate, 
      toDate, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      limit = 10, 
      page = 1 
    } = req.query;
    
    let query = {};
    
    // For non-admin users, only show their orders
    if (req.user.role !== 'admin') {
      query.createdBy = req.user.id;
    }
    
    // Store filter
    if (storeId) {
      query.store = storeId;
    }
    
    // Status filter
    if (status) {
      query.status = status;
    }
    
    // Date range filter
    if (fromDate || toDate) {
      query.createdAt = {};
      if (fromDate) query.createdAt.$gte = new Date(fromDate);
      if (toDate) query.createdAt.$lte = new Date(toDate);
    }

    // Search filter
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { 'store.storeName': searchRegex },
        { 'products.name': searchRegex },
        { notes: searchRegex }
      ];
    }

    // Sort options
    const sortOptions = {};
    if (sortBy === 'amount') {
      // Special case for sorting by calculated amount
      // We'll handle this after fetching the data
    } else {
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    // Pagination settings
    const skip = (page - 1) * limit;

    let orders = await Order.find(query)
      .populate('store', 'storeName proprietorName')
      .populate('products.product', 'productName price packSize unit')
      .populate('createdBy', 'name')
      .sort(sortBy === 'amount' ? { createdAt: -1 } : sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Enhance orders with calculated amounts
    orders = orders.map(order => {
      // Calculate amounts for each product
      const productsWithAmounts = order.products.map(product => {
        const discountedPrice = product.price * (1 - (product.discountPercentage || 0) / 100);
        const finalAmount = discountedPrice * product.quantity;
        return {
          ...product.toObject(),
          totalAmount: product.price * product.quantity,
          finalAmount
        };
      });

      // Calculate order totals
      const orderTotal = productsWithAmounts.reduce((sum, p) => sum + p.totalAmount, 0);
      const orderFinalTotal = productsWithAmounts.reduce((sum, p) => sum + p.finalAmount, 0);
      const totalDiscount = orderTotal - orderFinalTotal;

      return {
        ...order.toObject(),
        products: productsWithAmounts,
        orderTotal,
        orderFinalTotal,
        totalDiscount
      };
    });

    // Sort by amount if needed
    if (sortBy === 'amount') {
      orders.sort((a, b) => {
        return sortOrder === 'asc' 
          ? a.orderFinalTotal - b.orderFinalTotal 
          : b.orderFinalTotal - a.orderFinalTotal;
      });
    }

    const totalOrders = await Order.countDocuments(query);
    const totalPages = Math.ceil(totalOrders / limit);

    res.json({
      success: true,
      count: orders.length,
      orders,
      pagination: {
        totalOrders,
        totalPages,
        currentPage: page,
        perPage: limit
      }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

app.get('/api/orders/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Base query
    let query = { _id: id };

    // For non-admin users, only show their own orders
    if (req.user.role !== 'admin') {
      query.createdBy = req.user.id;
    }

    const order = await Order.findOne(query)
      .populate('store', 'storeName proprietorName')
      .populate('products.product', 'productName price packSize unit description')
      .populate('createdBy', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or unauthorized'
      });
    }

    // Enhance with calculated amounts
    const productsWithAmounts = order.products.map(product => {
      const discountedPrice = product.price * (1 - (product.discountPercentage || 0) / 100);
      const finalAmount = discountedPrice * product.quantity;
      
      return {
        ...product.toObject(),
        totalAmount: product.price * product.quantity,
        finalAmount,
        bonusQuantity: product.bonusQuantity || 0
      };
    });

    // Calculate order totals
    const orderTotal = productsWithAmounts.reduce((sum, p) => sum + p.totalAmount, 0);
    const orderFinalTotal = productsWithAmounts.reduce((sum, p) => sum + p.finalAmount, 0);
    const totalDiscount = orderTotal - orderFinalTotal;

    const enhancedOrder = {
      ...order.toObject(),
      products: productsWithAmounts,
      orderTotal,
      orderFinalTotal,
      totalDiscount
    };

    res.json({
      success: true,
      order: enhancedOrder
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
});

// Get order statistics (for dashboard)
app.get('/api/orders/stats', verifyToken, async (req, res) => {
  try {
    let matchQuery = {};
    
    // For non-admin users, only show their orders
    if (req.user.role !== 'admin') {
      matchQuery.createdBy = req.user.id;
    }

    const stats = await Order.aggregate([
      { $match: matchQuery },
      {
        $project: {
          status: 1,
          products: 1,
          createdAt: 1,
          totalAmount: {
            $sum: {
              $map: {
                input: "$products",
                as: "product",
                in: { $multiply: ["$$product.price", "$$product.quantity"] }
              }
            }
          },
          finalAmount: {
            $sum: {
              $map: {
                input: "$products",
                as: "product",
                in: {
                  $multiply: [
                    { $subtract: [1, { $divide: ["$$product.discountPercentage", 100] }] },
                    { $multiply: ["$$product.price", "$$product.quantity"] }
                  ]
                }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
          totalFinalAmount: { $sum: "$finalAmount" },
          totalDiscount: { $sum: { $subtract: ["$totalAmount", "$finalAmount"] } },
          byStatus: {
            $push: {
              status: "$status",
              amount: "$totalAmount",
              finalAmount: "$finalAmount",
              discount: { $subtract: ["$totalAmount", "$finalAmount"] }
            }
          }
        }
      },
      {
        $project: {
          totalOrders: 1,
          totalAmount: 1,
          totalFinalAmount: 1,
          totalDiscount: 1,
          statusStats: {
            $arrayToObject: {
              $map: {
                input: "$byStatus",
                as: "stat",
                in: {
                  k: "$$stat.status",
                  v: {
                    count: { $sum: 1 },
                    amount: "$$stat.amount",
                    finalAmount: "$$stat.finalAmount",
                    discount: "$$stat.discount"
                  }
                }
              }
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        totalOrders: 0,
        totalAmount: 0,
        totalFinalAmount: 0,
        totalDiscount: 0,
        statusStats: {}
      }
    });

  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order statistics',
      error: error.message
    });
  }
});

// Get orders summary by date (for charts)
app.get('/api/orders/summary', verifyToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    let matchQuery = { 
      createdAt: { $gte: startDate } 
    };
    
    // For non-admin users, only show their orders
    if (req.user.role !== 'admin') {
      matchQuery.createdBy = req.user.id;
    }

    const summary = await Order.aggregate([
      { $match: matchQuery },
      {
        $project: {
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          amount: {
            $sum: {
              $map: {
                input: "$products",
                as: "product",
                in: { $multiply: ["$$product.price", "$$product.quantity"] }
              }
            }
          },
          status: 1
        }
      },
      {
        $group: {
          _id: "$date",
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          statusCounts: {
            $push: {
              status: "$status",
              amount: "$amount"
            }
          }
        }
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          date: "$_id",
          totalOrders: 1,
          totalAmount: 1,
          statusCounts: {
            $arrayToObject: {
              $map: {
                input: "$statusCounts",
                as: "stat",
                in: {
                  k: "$$stat.status",
                  v: {
                    count: { $sum: 1 },
                    amount: "$$stat.amount"
                  }
                }
              }
            }
          }
        }
      }
    ]);

    res.json({
      success: true,
      summary
    });

  } catch (error) {
    console.error('Get order summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order summary',
      error: error.message
    });
  }
});

/**
 * @api {patch} /api/orders/:id/approve Approve Order
 * @apiPermission admin
 */
app.patch('/api/orders/:id/approve', verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check admin privileges
    if (req.user.role !== 'admin') {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'Admin privileges required'
      });
    }

    const order = await Order.findById(req.params.id).session(session);
    
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }

    if (order.status !== 'pending') {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: `Only pending orders can be approved. Current status: ${order.status}`
      });
    }

    // Update order
    order.status = 'approved';
    order.approvedAt = new Date();
    order.approvedBy = req.user.id;
    
    // Add to status history
    order.statusHistory.push({
      status: 'approved',
      changedBy: req.user.id,
      notes: 'Order approved by admin'
    });

    await order.save({ session });
    await session.commitTransaction();

    // Get updated order with populated fields
    const updatedOrder = await Order.findById(order._id)
      .populate('store', 'storeName proprietorName')
      .populate('products.product', 'productName price')
      .populate('approvedBy', 'name');

    res.json({
      success: true,
      message: 'Order approved successfully',
      order: updatedOrder
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Approve order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve order',
      error: error.message
    });
  } finally {
    session.endSession();
  }
});




/**
 * @api {patch} /api/orders/:id/reject Reject Order
 * @apiPermission admin
 */
app.patch('/api/orders/:id/reject', verifyToken, async (req, res) => {
  const { reason } = req.body;

  // Validate rejection reason
  if (!reason || reason.trim().length < 5) {
    return res.status(400).json({
      success: false,
      message: 'Rejection reason must be at least 5 characters'
    });
  }

  try {
    // Check admin privileges
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin privileges required'
      });
    }

    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Only pending orders can be rejected. Current status: ${order.status}`
      });
    }

    // Update order
    order.status = 'rejected';
    order.rejectedAt = new Date();
    order.rejectedBy = req.user.id;
    order.rejectionReason = reason;
    
    // Add to status history
    order.statusHistory.push({
      status: 'rejected',
      changedBy: req.user.id,
      notes: reason
    });

    await order.save();

    // Get updated order with populated fields
    const updatedOrder = await Order.findById(order._id)
      .populate('store', 'storeName proprietorName')
      .populate('rejectedBy', 'name');

    res.json({
      success: true,
      message: 'Order rejected successfully',
      order: updatedOrder
    });

  } catch (error) {
    console.error('Reject order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject order',
      error: error.message
    });
  }
});



/**
 * @api {patch} /api/orders/:id/status Update Order Status
 * @apiPermission admin|marketing_officer
 */
app.patch('/api/orders/:id/status', verifyToken, async (req, res) => {
  const { status, notes } = req.body;
  const validStatuses = ['pending', 'approved', 'processing', 'shipped', 'completed', 'cancelled'];

  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && order.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to update this order'
      });
    }

    // Validate status
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid values: ${validStatuses.join(', ')}`
      });
    }

    // Prevent invalid transitions
    if (order.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cancelled orders cannot be modified'
      });
    }

    if (status === 'approved' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can approve orders'
      });
    }

    // Update order
    const previousStatus = order.status;
    order.status = status;
    
    // Set timestamps
    if (status === 'processing') order.processingAt = new Date();
    if (status === 'shipped') order.shippedAt = new Date();
    if (status === 'completed') order.completedAt = new Date();
    if (status === 'cancelled') order.cancelledAt = new Date();
    
    // Track who made the change
    if (status === 'approved') order.approvedBy = req.user.id;
    if (status === 'rejected') order.rejectedBy = req.user.id;
    
    // Add to status history
    order.statusHistory.push({
      status,
      changedBy: req.user.id,
      notes: notes || `Status changed from ${previousStatus} to ${status}`
    });

    await order.save();

    // Get updated order with populated fields
    const updatedOrder = await Order.findById(order._id)
      .populate('store', 'storeName proprietorName')
      .populate('approvedBy', 'name')
      .populate('rejectedBy', 'name');

    res.json({
      success: true,
      message: `Order status updated to ${status}`,
      order: updatedOrder
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
});


/**
 * @api {get} /api/orders/:id/history Get Order History
 * @apiPermission admin|marketing_officer
 */
app.get('/api/orders/:id/history', verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .select('statusHistory createdBy')
      .populate('statusHistory.changedBy', 'name email role')
      .populate('createdBy', 'name');

    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && order.createdBy._id.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to view this order history'
      });
    }

    // Format history entries
    const history = (order.statusHistory || []).map(entry => ({
      status: entry.status,
      changedAt: entry.changedAt,
      changedBy: entry.changedBy,
      notes: entry.notes || '',
      role: entry.changedBy?.role
    }));

    res.json({
      success: true,
      history,
      orderCreator: order.createdBy.name
    });

  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order history',
      error: error.message
    });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});