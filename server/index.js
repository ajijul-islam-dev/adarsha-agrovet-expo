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
import Payment from './models/Payment.js';
import Due from './models/Due.js';

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
    const { name, email, phone, area, password, role } = req.body;

    // Check if user already exists
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

    // Check if this is the first user (make admin)
    const userCount = await User.countDocuments();
    const isFirstUser = userCount === 0;

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      phone,
      area,
      password: hashedPassword,
      role: isFirstUser ? 'admin' : role,
      status: isFirstUser ? 'active' : 'pending' // First user is auto-activated
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
// User Login - Updated to handle phone login
app.post('/login', async (req, res) => {
  const { email, phone, password } = req.body;

  if (!password || (!email && !phone)) {
    return res.status(400).json({
      success: false,
      message: 'Email/phone and password are required'
    });
  }

  try {
    // Find user by email or phone
    const user = await User.findOne({
      $or: [{ email }, { phone }]
    }).select('+password +status');
    
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
      phone: user.phone,
      role: user.role,
      status: user.status,
      area: user.area,
      name: user.name
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
        phone: user.phone,
        status: user.status,
        role: user.role,
        area: user.area
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



// Get all users (admin only)
app.get('/users', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin privileges required'
    });
  }

  try {
    const { search, role, status, area } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;
    if (status) query.status = status;
    if (area) query.area = area;

    const users = await User.find(query)
      .select('-password -__v')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// Update user status (admin only)
app.patch('/users/:id/status', verifyToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin privileges required'
    });
  }

  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'active', 'suspended', 'rejected'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Valid values are: ${validStatuses.join(', ')}`
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password -__v');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User status updated to ${status}`,
      user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
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
    
    // Base query
    let matchQuery = { role: 'officer' };
    
    // Search conditions
    if (search) {
      matchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { areaCode: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Area filter
    if (area && area !== 'all') {
      matchQuery.area = area;
    }

    const aggregationPipeline = [
      // Stage 1: Match officers based on filters
      { $match: matchQuery },

      // Stage 2: Lookup stores managed by this officer
      {
        $lookup: {
          from: 'stores',
          localField: '_id',
          foreignField: 'officers.marketingOfficer',
          as: 'managedStores'
        }
      },

      // Stage 3: Unwind stores for proper joining
      { $unwind: { path: '$managedStores', preserveNullAndEmptyArrays: true } },

      // Stage 4: Lookup orders for each store (only fulfilled orders)
      {
        $lookup: {
          from: 'orders',
          localField: 'managedStores._id',
          foreignField: 'store',
          as: 'storeOrders',
          pipeline: [
            { $match: { status: 'fulfilled' } },
            {
              $lookup: {
                from: 'products',
                localField: 'products.product',
                foreignField: '_id',
                as: 'productDetails'
              }
            },
            {
              $addFields: {
                products: {
                  $map: {
                    input: '$products',
                    as: 'product',
                    in: {
                      $mergeObjects: [
                        '$$product',
                        {
                          product: {
                            $arrayElemAt: [
                              '$productDetails',
                              { $indexOfArray: ['$productDetails._id', '$$product.product'] }
                            ]
                          }
                        }
                      ]
                    }
                  }
                },
                orderTotal: {
                  $reduce: {
                    input: '$products',
                    initialValue: 0,
                    in: {
                      $add: [
                        '$$value',
                        {
                          $multiply: [
                            '$$this.price',
                            {
                              $subtract: [
                                '$$this.quantity',
                                {
                                  $multiply: [
                                    '$$this.quantity',
                                    { $divide: [{ $ifNull: ['$$this.discountPercentage', 0] }, 100] }
                                  ]
                                }
                              ]
                            }
                          ]
                        }
                      ]
                    }
                  }
                }
              }
            },
            { $project: { productDetails: 0 } }
          ]
        }
      },

      // Stage 5: Lookup payments for each store
      {
        $lookup: {
          from: 'payments',
          localField: 'managedStores._id',
          foreignField: 'store',
          as: 'storePayments'
        }
      },

      // Stage 6: Lookup dues for each store (excluding by_order dues)
      {
        $lookup: {
          from: 'dues',
          localField: 'managedStores._id',
          foreignField: 'store',
          as: 'storeDues',
          pipeline: [
            { $match: { type: { $ne: 'by_order' } } }
          ]
        }
      },

      // Stage 7: Group back by officer with financial calculations
      {
        $group: {
          _id: '$_id',
          officerData: { $first: '$$ROOT' },
          totalFulfilledOrdersValue: { $sum: { $sum: '$storeOrders.orderTotal' } },
          totalPayments: { $sum: { $sum: '$storePayments.amount' } },
          totalManualDues: { $sum: { $sum: '$storeDues.amount' } },
          storeCount: { $sum: { $cond: [{ $ifNull: ['$managedStores._id', false] }, 1, 0] } },
          fulfilledOrderCount: { $sum: { $size: '$storeOrders' } },
          paymentCount: { $sum: { $size: '$storePayments' } },
          manualDueCount: { $sum: { $size: '$storeDues' } }
        }
      },

      // Stage 8: Calculate net dues
      {
        $addFields: {
          totalDues: {
            $add: [
              { $ifNull: ['$totalFulfilledOrdersValue', 0] },
              { $ifNull: ['$totalManualDues', 0] }
            ]
          },
          netDues: {
            $subtract: [
              { $add: [
                { $ifNull: ['$totalFulfilledOrdersValue', 0] },
                { $ifNull: ['$totalManualDues', 0] }
              ]},
              { $ifNull: ['$totalPayments', 0] }
            ]
          }
        }
      },

      // Stage 9: Merge officer data with calculated fields
      {
        $replaceRoot: {
          newRoot: {
            $mergeObjects: [
              '$officerData',
              {
                financials: {
                  totalFulfilledOrdersValue: '$totalFulfilledOrdersValue',
                  totalManualDues: '$totalManualDues',
                  totalPayments: '$totalPayments',
                  totalDues: '$totalDues',
                  netDues: '$netDues',
                  storeCount: '$storeCount',
                  fulfilledOrderCount: '$fulfilledOrderCount',
                  paymentCount: '$paymentCount',
                  manualDueCount: '$manualDueCount'
                }
              }
            ]
          }
        }
      },

      // Stage 10: Final projection
      {
        $project: {
          password: 0,
          __v: 0,
          managedStores: 0,
          storeOrders: 0,
          storePayments: 0,
          storeDues: 0
        }
      },

      // Stage 11: Sort by newest first
      { $sort: { createdAt: -1 } }
    ];

    const officers = await User.aggregate(aggregationPipeline);

    const formattedOfficers = officers.map(officer => ({
      ...officer,
      financials: {
        totalFulfilledOrdersValue: officer.financials?.totalFulfilledOrdersValue || 0,
        totalManualDues: officer.financials?.totalManualDues || 0,
        totalPayments: officer.financials?.totalPayments || 0,
        totalDues: officer.financials?.totalDues || 0,
        netDues: officer.financials?.netDues || 0,
        storeCount: officer.financials?.storeCount || 0,
        fulfilledOrderCount: officer.financials?.fulfilledOrderCount || 0,
        paymentCount: officer.financials?.paymentCount || 0,
        manualDueCount: officer.financials?.manualDueCount || 0
      }
    }));

    res.json({
      success: true,
      count: formattedOfficers.length,
      officers: formattedOfficers
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

app.get('/officers/:id', verifyToken, async (req, res) => {
  try {
    const officerId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(officerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid officer ID format'
      });
    }

    const officerObjectId = new mongoose.Types.ObjectId(officerId);
    const officer = await User.findOne({ _id: officerObjectId, role: 'officer' }).lean();

    if (!officer) {
      return res.status(404).json({ success: false, message: 'Officer not found' });
    }

    const stores = await Store.find({ 'officers.marketingOfficer': officerObjectId }).lean();
    const storeIds = stores.map(s => s._id);
    const storeIdToNameMap = {};
    stores.forEach(s => {
      storeIdToNameMap[s._id.toString()] = s.storeName || 'Unknown Store';
    });

    const allOrders = await Order.aggregate([
      { $match: { store: { $in: storeIds } } },
      {
        $addFields: {
          orderTotal: {
            $reduce: {
              input: '$products',
              initialValue: 0,
              in: {
                $add: [
                  '$$value',
                  {
                    $multiply: [
                      {
                        $subtract: [
                          '$$this.quantity',
                          {
                            $multiply: [
                              '$$this.quantity',
                              { $divide: [{ $ifNull: ['$$this.discountPercentage', 0] }, 100] }
                            ]
                          }
                        ]
                      },
                      '$$this.price'
                    ]
                  }
                ]
              }
            }
          }
        }
      },
      {
        $project: {
          store: 1,
          products: 1,
          createdAt: 1,
          status: 1,
          orderTotal: 1
        }
      }
    ]);

    const ordersWithStoreName = allOrders.map(order => ({
      ...order,
      storeName: storeIdToNameMap[order.store.toString()] || 'Unknown Store'
    }));

    const fulfilledOrders = allOrders.filter(order => order.status === 'fulfilled');

    const payments = await Payment.find({ store: { $in: storeIds } }).lean();
    const paymentsWithStoreName = payments.map(payment => ({
      ...payment,
      storeName: storeIdToNameMap[payment.store.toString()] || 'Unknown Store'
    }));

    const manualDues = await Due.find({ store: { $in: storeIds } }).lean();
    const manualDuesWithStoreName = manualDues.map(due => ({
      ...due,
      storeName: storeIdToNameMap[due.store.toString()] || 'Unknown Store'
    }));

    const syntheticDues = fulfilledOrders.map(order => ({
      amount: order.orderTotal,
      type: 'by_order',
      orderId: order._id,
      store: order.store,
      storeName: storeIdToNameMap[order.store.toString()] || 'Unknown Store',
      createdAt: order.createdAt,
      status: order.status
    }));

    const duesWithStoreName = [...manualDuesWithStoreName, ...syntheticDues];

    const storeFinancialsMap = {};
    storeIds.forEach(id => {
      storeFinancialsMap[id.toString()] = {
        totalOrdersValue: 0,
        totalPayments: 0,
        totalManualDues: 0
      };
    });

    fulfilledOrders.forEach(order => {
      const id = order.store.toString();
      storeFinancialsMap[id].totalOrdersValue += order.orderTotal || 0;
    });

    payments.forEach(payment => {
      const id = payment.store.toString();
      storeFinancialsMap[id].totalPayments += payment.amount || 0;
    });

    manualDues.forEach(due => {
      const id = due.store.toString();
      storeFinancialsMap[id].totalManualDues += due.amount || 0;
    });

    const storesWithCurrentDues = stores.map(store => {
      const id = store._id.toString();
      const financials = storeFinancialsMap[id] || {
        totalOrdersValue: 0,
        totalPayments: 0,
        totalManualDues: 0
      };
      const currentDues = financials.totalOrdersValue + financials.totalManualDues - financials.totalPayments;
      return {
        ...store,
        currentDues
      };
    });

    const totalOrdersValue = fulfilledOrders.reduce((sum, order) => sum + (order.orderTotal || 0), 0);
    const totalPayments = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const totalManualDues = manualDues.reduce((sum, due) => sum + (due.amount || 0), 0);
    const netDues = totalOrdersValue + totalManualDues - totalPayments;

    const formattedOfficer = {
      ...officer,
      financials: {
        totalOrdersValue,
        totalPayments,
        totalManualDues,
        netDues,
        storeCount: stores.length,
        orderCount: allOrders.length,
        paymentCount: payments.length,
        dueCount: duesWithStoreName.length
      },
      histories: {
        orders: ordersWithStoreName,
        payments: paymentsWithStoreName,
        dues: duesWithStoreName
      },
      stores: storesWithCurrentDues
    };

    res.json({ success: true, officer: formattedOfficer });

  } catch (error) {
    console.error('Get officer details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch officer details',
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
    const skip = (page - 1) * limit;

    // Base match query
    const matchQuery = {
      ...(search && {
        $or: [
          { storeName: { $regex: search, $options: 'i' } },
          { proprietorName: { $regex: search, $options: 'i' } },
          { storeCode: { $regex: search, $options: 'i' } }
        ]
      }),
      ...(area && { area }),
      ...(status && { status }),
      ...(marketingOfficer && { 'officers.marketingOfficer': new mongoose.Types.ObjectId(marketingOfficer) })
    };

    // Add marketing officer filter for non-admin users
    if (req.user.role !== 'admin') {
      matchQuery['officers.marketingOfficer'] = req.user._id;
    }

    const aggregationPipeline = [
      // Stage 1: Match stores based on filters
      { $match: matchQuery },

      // Stage 2: Lookup orders with calculated totals (BONUS QUANTITY EXCLUDED)
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'store',
          as: 'orderHistory',
          pipeline: [
            {
              $lookup: {
                from: 'products',
                localField: 'products.product',
                foreignField: '_id',
                as: 'productDetails'
              }
            },
            {
              $addFields: {
                products: {
                  $map: {
                    input: '$products',
                    as: 'product',
                    in: {
                      $mergeObjects: [
                        '$$product',
                        {
                          product: {
                            $arrayElemAt: [
                              '$productDetails',
                              { $indexOfArray: ['$productDetails._id', '$$product.product'] }
                            ]
                          }
                        }
                      ]
                    }
                  }
                },
                orderTotal: {
                  $reduce: {
                    input: '$products',
                    initialValue: 0,
                    in: {
                      $add: [
                        '$$value',
                        {
                          $multiply: [
                            '$$this.price',
                            {
                              $subtract: [
                                '$$this.quantity',
                                {
                                  $ifNull: [
                                    {
                                      $multiply: [
                                        '$$this.quantity',
                                        { $divide: [{ $ifNull: ['$$this.discountPercentage', 0] }, 100] }
                                      ]
                                    },
                                    0
                                  ]
                                }
                              ]
                            }
                          ]
                        }
                        // REMOVED: Bonus quantity multiplication
                      ]
                    }
                  }
                }
              }
            },
            { $project: { productDetails: 0 } }
          ]
        }
      },

      // Stage 3: Lookup payments
      {
        $lookup: {
          from: 'payments',
          localField: '_id',
          foreignField: 'store',
          as: 'paymentHistory'
        }
      },

      // Stage 4: Lookup dues
      {
        $lookup: {
          from: 'dues',
          localField: '_id',
          foreignField: 'store',
          as: 'dueHistory'
        }
      },

      // Stage 5: Calculate financial components
      {
        $addFields: {
          // Sum of all fulfilled orders (EXCLUDES BONUS QUANTITIES)
          sumOfFulfilledOrders: {
            $reduce: {
              input: {
                $filter: {
                  input: '$orderHistory',
                  as: 'order',
                  cond: { $eq: ['$$order.status', 'fulfilled'] }
                }
              },
              initialValue: 0,
              in: { $add: ['$$value', { $ifNull: ['$$this.orderTotal', 0] }] }
            }
          },

          // Sum of manual dues (where type is not 'by_order')
          sumOfManualDues: {
            $reduce: {
              input: {
                $filter: {
                  input: '$dueHistory',
                  as: 'due',
                  cond: { $ne: ['$$due.type', 'by_order'] }
                }
              },
              initialValue: 0,
              in: { $add: ['$$value', { $ifNull: ['$$this.amount', 0] }] }
            }
          },

          // Total paid amount (unchanged)
          totalPaidAmount: {
            $reduce: {
              input: '$paymentHistory',
              initialValue: 0,
              in: { $add: ['$$value', { $ifNull: ['$$this.amount', 0] }] }
            }
          }
        }
      },

      // Stage 6: Calculate final net dues (NOW CORRECTLY EXCLUDES BONUSES)
      {
        $addFields: {
          // Total dues (manual dues + fulfilled orders WITHOUT BONUSES)
          totalDues: {
            $add: [
              { $ifNull: ['$sumOfManualDues', 0] },
              { $ifNull: ['$sumOfFulfilledOrders', 0] }
            ]
          },

          // Net dues after payments
          netDues: {
            $subtract: [
              { $add: [
                { $ifNull: ['$sumOfManualDues', 0] },
                { $ifNull: ['$sumOfFulfilledOrders', 0] }
              ]},
              { $ifNull: ['$totalPaidAmount', 0] }
            ]
          },

          // Enhanced due history combining both types
          dueHistory: {
            $concatArrays: [
              '$dueHistory',
              {
                $map: {
                  input: {
                    $filter: {
                      input: '$orderHistory',
                      as: 'order',
                      cond: { $eq: ['$$order.status', 'fulfilled'] }
                    }
                  },
                  as: 'order',
                  in: {
                    amount: '$$order.orderTotal',
                    type: 'by_order',
                    orderId: '$$order._id',
                    createdAt: '$$order.createdAt',
                    status: '$$order.status'
                  }
                }
              }
            ]
          }
        }
      },

      // Stage 7: Pagination
      { $skip: skip },
      { $limit: parseInt(limit) },

      // Stage 8: Populate user details
      {
        $lookup: {
          from: 'users',
          localField: 'officers.marketingOfficer',
          foreignField: '_id',
          as: 'marketingOfficerDetails'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdByDetails'
        }
      },
      {
        $addFields: {
          'officers.marketingOfficer': {
            $ifNull: [
              { $arrayElemAt: ['$marketingOfficerDetails', 0] },
              null
            ]
          },
          createdBy: {
            $ifNull: [
              { $arrayElemAt: ['$createdByDetails', 0] },
              null
            ]
          }
        }
      },
      { $project: { marketingOfficerDetails: 0, createdByDetails: 0 } }
    ];

    // Execute aggregation with pagination data
    const [stores, totalStores] = await Promise.all([
      Store.aggregate(aggregationPipeline),
      Store.countDocuments(matchQuery)
    ]);

    const totalPages = Math.ceil(totalStores / limit);

    res.json({
      success: true,
      count: stores.length,
      stores: stores.map(store => ({
        ...store,
        orderHistory: store.orderHistory || [],
        dueHistory: store.dueHistory || [],
        paymentHistory: store.paymentHistory || [],
        sumOfFulfilledOrders: store.sumOfFulfilledOrders || 0,
        sumOfManualDues: store.sumOfManualDues || 0,
        totalDues: store.totalDues || 0,
        totalPaidAmount: store.totalPaidAmount || 0,
        netDues: store.netDues || 0
      })),
      pagination: {
        totalStores,
        totalPages,
        currentPage: parseInt(page),
        perPage: parseInt(limit)
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

// Get Single Store with Full Details
app.get('/get-stores/:id', verifyToken, async (req, res) => {
  try {
    const storeId = req.params.id;
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const isAdmin = req.user.role === 'admin';

    const matchQuery = {
      _id: new mongoose.Types.ObjectId(storeId)
    };

    if (!isAdmin) {
      matchQuery.$or = [
        { 'officers.marketingOfficer': userId },
        { 'createdBy': userId }
      ];
    }

    const aggregationPipeline = [
      { $match: matchQuery },

      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'store',
          as: 'orderHistory',
          pipeline: [
            {
              $lookup: {
                from: 'products',
                localField: 'products.product',
                foreignField: '_id',
                as: 'productDetails'
              }
            },
            {
              $addFields: {
                products: {
                  $map: {
                    input: '$products',
                    as: 'product',
                    in: {
                      $mergeObjects: [
                        '$$product',
                        {
                          product: {
                            $arrayElemAt: [
                              '$productDetails',
                              { $indexOfArray: ['$productDetails._id', '$$product.product'] }
                            ]
                          }
                        }
                      ]
                    }
                  }
                }
              }
            },
            { $project: { productDetails: 0 } },
            {
              $addFields: {
                orderTotal: {
                  $reduce: {
                    input: '$products',
                    initialValue: 0,
                    in: {
                      $add: [
                        '$$value',
                        {
                          $multiply: [
                            '$$this.price',
                            {
                              $subtract: [
                                '$$this.quantity',
                                {
                                  $multiply: [
                                    '$$this.quantity',
                                    { $divide: ['$$this.discountPercentage', 100] }
                                  ]
                                }
                              ]
                            }
                          ]
                        }
                        // Removed: { $multiply: ['$$this.bonusQuantity', '$$this.price'] }
                      ]
                    }
                  }
                }
              }
            }
          ]
        }
      },

      {
        $lookup: {
          from: 'payments',
          localField: '_id',
          foreignField: 'store',
          as: 'paymentHistory'
        }
      },

      {
        $lookup: {
          from: 'dues',
          localField: '_id',
          foreignField: 'store',
          as: 'dueHistory'
        }
      },

      {
        $addFields: {
          totalFromOrders: {
            $reduce: {
              input: '$orderHistory',
              initialValue: 0,
              in: { $add: ['$$value', '$$this.orderTotal'] }
            }
          },
          totalPaidAmount: {
            $reduce: {
              input: '$paymentHistory',
              initialValue: 0,
              in: { $add: ['$$value', '$$this.amount'] }
            }
          },
          totalFromDues: {
            $reduce: {
              input: {
                $concatArrays: [
                  '$dueHistory',
                  {
                    $filter: {
                      input: {
                        $map: {
                          input: '$orderHistory',
                          as: 'order',
                          in: {
                            $cond: [
                              { $eq: ['$$order.status', 'fulfilled'] },
                              { amount: '$$order.orderTotal' },
                              null
                            ]
                          }
                        }
                      },
                      as: 'item',
                      cond: { $ne: ['$$item', null] }
                    }
                  }
                ]
              },
              initialValue: 0,
              in: { $add: ['$$value', '$$this.amount'] }
            }
          }
        }
      },

      {
        $addFields: {
          totalFinalDues: {
            $subtract: [
              { $add: ['$totalFromOrders', '$totalFromDues'] },
              '$totalPaidAmount'
            ]
          },
          dueHistory: {
            $concatArrays: [
              '$dueHistory',
              {
                $filter: {
                  input: {
                    $map: {
                      input: '$orderHistory',
                      as: 'order',
                      in: {
                        $cond: [
                          { $eq: ['$$order.status', 'fulfilled'] },
                          {
                            amount: '$$order.orderTotal',
                            type: 'by_order',
                            orderId: '$$order._id',
                            createdAt: '$$order.createdAt',
                            status: '$$order.status'
                          },
                          null
                        ]
                      }
                    }
                  },
                  as: 'item',
                  cond: { $ne: ['$$item', null] }
                }
              }
            ]
          }
        }
      },

      {
        $lookup: {
          from: 'users',
          localField: 'officers.marketingOfficer',
          foreignField: '_id',
          as: 'marketingOfficerDetails'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdByDetails'
        }
      },
      {
        $addFields: {
          'officers.marketingOfficer': { $arrayElemAt: ['$marketingOfficerDetails', 0] },
          createdBy: { $arrayElemAt: ['$createdByDetails', 0] }
        }
      },
      { $project: { marketingOfficerDetails: 0, createdByDetails: 0 } }
    ];

    const result = await Store.aggregate(aggregationPipeline);

    if (result.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Store not found or unauthorized access'
      });
    }

    const store = result[0];

    res.json({
      success: true,
      store: {
        ...store,
        orderHistory: store.orderHistory || [],
        dueHistory: store.dueHistory || [],
        paymentHistory: store.paymentHistory || [],
        totalFromOrders: store.totalFromOrders || 0,
        totalPaidAmount: store.totalPaidAmount || 0,
        totalFromDues: store.totalFromDues || 0,
        totalFinalDues: store.totalFinalDues || 0
      }
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
    const { amount, paymentMethod, notes, date } = req.body;
    
    // Validate
    if (!amount || isNaN(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && 
        store.officers.marketingOfficer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to add payments for this store'
      });
    }

    // Create and save payment
    const payment = new Payment({
      store: store._id,
      amount: parseFloat(amount),
      paymentMethod: paymentMethod || 'cash',
      notes,
      recordedBy: req.user.id,
      date: date || new Date()
    });
    await payment.save();

    // Add reference to store
    store.paymentHistory.push(payment._id);
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
    const { amount, description, dueDate } = req.body;
    
    // Validate
    if (!amount || isNaN(amount)) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }

    const store = await Store.findById(req.params.id);
    if (!store) {
      return res.status(404).json({
        success: false,
        message: 'Store not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && 
        store.officers.marketingOfficer.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to add dues for this store'
      });
    }

    // Create and save due
    const due = new Due({
      store: store._id,
      amount: parseFloat(amount),
      description,
      dueDate: dueDate || new Date(),
      recordedBy: req.user.id
    });
    await due.save();

    // Add reference to store
    store.dueHistory.push(due._id);
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
app.get('/stores/my-stores', verifyToken, async (req, res) => {
  try {
    const { search, area, limit = 10, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    // Convert user ID to ObjectId for proper matching
    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Base query for marketing officer's stores
    const matchQuery = {
      'officers.marketingOfficer': userId,
      ...(search && {
        $or: [
          { storeName: { $regex: search, $options: 'i' } },
          { proprietorName: { $regex: search, $options: 'i' } },
          { storeCode: { $regex: search, $options: 'i' } }
        ]
      }),
      ...(area && area !== 'all' && { area })
    };

    // First verify stores exist for this user
    const storesCount = await Store.countDocuments(matchQuery);
    
    if (storesCount === 0) {
      return res.json({
        success: true,
        count: 0,
        stores: [],
        message: 'No stores found for this marketing officer',
        pagination: {
          totalStores: 0,
          totalPages: 0,
          currentPage: parseInt(page),
          perPage: parseInt(limit)
        }
      });
    }

    const aggregationPipeline = [
      // Stage 1: Match stores for this marketing officer
      { $match: matchQuery },

      // Stage 2: Lookup related orders (only fulfilled)
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'store',
          as: 'orderHistory',
          pipeline: [
            { $match: { status: 'fulfilled' } }, // Only fulfilled orders
            {
              $lookup: {
                from: 'products',
                localField: 'products.product',
                foreignField: '_id',
                as: 'productDetails'
              }
            },
            {
              $addFields: {
                products: {
                  $map: {
                    input: '$products',
                    as: 'product',
                    in: {
                      $mergeObjects: [
                        '$$product',
                        {
                          product: {
                            $arrayElemAt: [
                              '$productDetails',
                              { $indexOfArray: ['$productDetails._id', '$$product.product'] }
                            ]
                          }
                        }
                      ]
                    }
                  }
                },
                orderTotal: {
                  $reduce: {
                    input: '$products',
                    initialValue: 0,
                    in: {
                      $add: [
                        '$$value',
                        {
                          $multiply: [
                            '$$this.price',
                            {
                              $subtract: [
                                '$$this.quantity',
                                {
                                  $ifNull: [
                                    {
                                      $multiply: [
                                        '$$this.quantity',
                                        { $divide: [{ $ifNull: ['$$this.discountPercentage', 0] }, 100] }
                                      ]
                                    },
                                    0
                                  ]
                                }
                              ]
                            }
                          ]
                        }
                        // Removed: Bonus quantity multiplication
                      ]
                    }
                  }
                }
              }
            },
            { $project: { productDetails: 0 } }
          ]
        }
      },

      // Stage 3: Lookup payment history
      {
        $lookup: {
          from: 'payments',
          localField: '_id',
          foreignField: 'store',
          as: 'paymentHistory'
        }
      },

      // Stage 4: Lookup due history (excluding by_order dues)
      {
        $lookup: {
          from: 'dues',
          localField: '_id',
          foreignField: 'store',
          as: 'dueHistory',
          pipeline: [
            { $match: { type: { $ne: 'by_order' } } } // Only manual dues
          ]
        }
      },

      // Stage 5: Calculate financials from fulfilled orders only
      {
        $addFields: {
          // Sum of fulfilled orders (EXCLUDING BONUS QUANTITIES)
          sumOfFulfilledOrders: {
            $reduce: {
              input: '$orderHistory',
              initialValue: 0,
              in: { $add: ['$$value', { $ifNull: ['$$this.orderTotal', 0] }] }
            }
          },
          
          // Sum of manual dues (explicit dues)
          sumOfManualDues: {
            $reduce: {
              input: '$dueHistory',
              initialValue: 0,
              in: { $add: ['$$value', { $ifNull: ['$$this.amount', 0] }] }
            }
          },
          
          // Total paid amount
          totalPaidAmount: {
            $reduce: {
              input: '$paymentHistory',
              initialValue: 0,
              in: { $add: ['$$value', { $ifNull: ['$$this.amount', 0] }] }
            }
          }
        }
      },

      // Stage 6: Calculate final aggregates (NOW CORRECTLY EXCLUDES BONUSES)
      {
        $addFields: {
          // Total outstanding (fulfilled orders + manual dues WITHOUT BONUSES)
          totalOutstanding: {
            $add: [
              { $ifNull: ['$sumOfFulfilledOrders', 0] },
              { $ifNull: ['$sumOfManualDues', 0] }
            ]
          },
          
          // Net dues (outstanding - payments)
          netDues: {
            $subtract: [
              { $add: [
                { $ifNull: ['$sumOfFulfilledOrders', 0] },
                { $ifNull: ['$sumOfManualDues', 0] }
              ]},
              { $ifNull: ['$totalPaidAmount', 0] }
            ]
          },
          
          // Enhanced due history combining both types
          dueHistory: {
            $concatArrays: [
              '$dueHistory',
              {
                $map: {
                  input: '$orderHistory',
                  as: 'order',
                  in: {
                    amount: '$$order.orderTotal',
                    type: 'by_order',
                    orderId: '$$order._id',
                    createdAt: '$$order.createdAt',
                    updatedAt: '$$order.updatedAt',
                    status: '$$order.status',
                    products: '$$order.products'
                  }
                }
              }
            ]
          },
          
          // Count metrics
          fulfilledOrderCount: { $size: '$orderHistory' },
          paymentCount: { $size: '$paymentHistory' },
          manualDueCount: { $size: '$dueHistory' }
        }
      },

      // Stage 7: Pagination
      { $skip: skip },
      { $limit: parseInt(limit) },

      // Stage 8: Populate user details
      {
        $lookup: {
          from: 'users',
          localField: 'officers.marketingOfficer',
          foreignField: '_id',
          as: 'marketingOfficerDetails'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdByDetails'
        }
      },
      {
        $addFields: {
          'officers.marketingOfficer': {
            $ifNull: [
              { $arrayElemAt: ['$marketingOfficerDetails', 0] },
              null
            ]
          },
          createdBy: {
            $ifNull: [
              { $arrayElemAt: ['$createdByDetails', 0] },
              null
            ]
          }
        }
      },
      { $project: { marketingOfficerDetails: 0, createdByDetails: 0 } }
    ];

    // Execute aggregation
    const [stores, totalStores] = await Promise.all([
      Store.aggregate(aggregationPipeline),
      Store.countDocuments(matchQuery)
    ]);

    const totalPages = Math.ceil(totalStores / limit);

    res.json({
      success: true,
      count: stores.length,
      stores: stores.map(store => ({
        ...store,
        orderHistory: store.orderHistory || [],
        paymentHistory: store.paymentHistory || [],
        dueHistory: store.dueHistory || [],
        
        // Financials with proper defaults (NOW BONUS-FREE)
        sumOfFulfilledOrders: store.sumOfFulfilledOrders || 0,
        sumOfManualDues: store.sumOfManualDues || 0,
        totalPaidAmount: store.totalPaidAmount || 0,
        totalOutstanding: store.totalOutstanding || 0,
        netDues: store.netDues || 0,
        
        // Counts with defaults
        fulfilledOrderCount: store.fulfilledOrderCount || 0,
        paymentCount: store.paymentCount || 0,
        manualDueCount: store.manualDueCount || 0
      })),
      pagination: {
        totalStores,
        totalPages,
        currentPage: parseInt(page),
        perPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get my stores error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your stores',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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

    // Stock validation - only addition
    const totalNeeded = quantity + (bonusQuantity || 0);
    if (productExists.stock < totalNeeded) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for ${productExists.productName}. Available: ${productExists.stock}, Needed: ${totalNeeded}`,
        productId: product.id,
        availableStock: productExists.stock,
        requiredStock: totalNeeded
      });
    }

    // Rest of original implementation remains unchanged
    let order = await Order.findOne({
      store: storeId,
      status: 'draft',
      createdBy: req.user.id
    });

    if (order) {
      const existingProductIndex = order.products.findIndex(
        p => p.product.toString() === product.id
      );

      if (existingProductIndex >= 0) {
        order.products[existingProductIndex].quantity = quantity;
        order.products[existingProductIndex].bonusQuantity = bonusQuantity || 0;
        order.products[existingProductIndex].discountPercentage = discountPercentage || 0;
      } else {
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

    // Check permissions
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

    // Stock validation - only addition
    const totalNeeded = quantity + (bonusQuantity || 0);
    if (productExists.stock < totalNeeded) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for ${productExists.productName}. Available: ${productExists.stock}, Needed: ${totalNeeded}`,
        productId: product.id,
        availableStock: productExists.stock,
        requiredStock: totalNeeded
      });
    }

    // Rest of original implementation remains unchanged
    const existingProductIndex = order.products.findIndex(
      p => p.product.toString() === product.id
    );

    if (existingProductIndex >= 0) {
      order.products[existingProductIndex].quantity = quantity;
      order.products[existingProductIndex].bonusQuantity = bonusQuantity || 0;
      order.products[existingProductIndex].discountPercentage = discountPercentage || 0;
    } else {
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
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Only draft orders can be submitted' });
    }

    // 1. Validate stock before submission
    const stockCheckResults = await Promise.all(order.products.map(async (item) => {
      const product = await Product.findById(item.product);
      const total = item.quantity + (item.bonusQuantity || 0);
      if (!product) return { valid: false, reason: 'Product not found', id: item.product };
      if (product.stock < total) return { valid: false, reason: 'Insufficient stock', id: item.product, available: product.stock };
      return { valid: true };
    }));

    const failed = stockCheckResults.find(r => !r.valid);
    if (failed) {
      return res.status(400).json({ 
        success: false, 
        message: `Stock error: ${failed.reason}`,
        productId: failed.id,
        availableStock: failed.available 
      });
    }

    // 2. Set status to pending and save (let pre('save') handle stock update)
    order.status = 'pending';
    order.submittedAt = new Date();
    order._updatedBy = req.user.id;

    await order.save();

    res.json({
      success: true,
      message: 'Order submitted successfully',
      order
    });

  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to submit order', 
      error: err.message 
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
    
    // Role-based access control
    if (req.user.role === 'admin') {
      // Admins can see all orders
    } else if (req.user.role === 'stock-manager') {
      // Stock managers can see all approved orders
      query.status = 'approved';
    } else {
      // Officers and others can only see their own orders
      query.createdBy = req.user.id;
    }
    
    // Store filter
    if (storeId) {
      query.store = storeId;
    }
    
    // Additional status filter (if provided)
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
    if (req.user.role !== 'admin' && req.user.role !== 'stock-manager') {
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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!reason || reason.trim().length < 5) {
      throw new Error('Rejection reason must be at least 5 characters');
    }

    if (!['admin', 'stock-manager'].includes(req.user.role)) {
      throw new Error('Only admin or stock-manager can reject orders');
    }

    const order = await Order.findById(req.params.id).session(session);
    if (!order) {
      throw new Error('Order not found');
    }

    if (!['pending', 'approved'].includes(order.status)) {
      throw new Error(`Only pending or approved orders can be rejected. Current status: ${order.status}`);
    }

    // Revert stock
    for (const item of order.products) {
      const stockIncrease = item.quantity + (item.bonusQuantity || 0);
      const result = await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: stockIncrease } },
        { session }
      );
      console.log(`Stock reverted for product ${item.product}: +${stockIncrease}`);
    }

    // Update order fields
    order.status = 'rejected';
    order.rejectedAt = new Date();
    order.rejectedBy = req.user.id;
    order.rejectionReason = reason;
    order.statusHistory.push({
      status: 'rejected',
      changedBy: req.user.id,
      notes: reason,
      changedAt: new Date()
    });

    await order.save({ session });
    await session.commitTransaction();

    const updatedOrder = await Order.findById(order._id)
      .populate('store', 'storeName proprietorName')
      .populate('rejectedBy', 'name');

    res.json({
      success: true,
      message: 'Order rejected and stock reverted',
      order: updatedOrder
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Reject order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject order',
      error: error.message
    });
  } finally {
    session.endSession();
  }
});





/**
 * @api {patch} /api/orders/:id/status Update Order Status
 * @apiPermission admin|marketing_officer
 */
app.patch('/api/orders/:id/status', verifyToken, async (req, res) => {
  const { status, notes } = req.body;
  const validStatuses = ['rejected', 'approved', 'fulfilled'];

  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && req.user.role !== 'stock-manager') {
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

    // Role-specific validations
    if (status === 'approved' && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can approve orders'
      });
    }

    if (status === 'fulfilled' && req.user.role !== 'stock-manager') {
      return res.status(403).json({
        success: false,
        message: 'Only stock managers can fulfill orders'
      });
    }

    // Status transition validations
    if (status === 'approved' && order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending orders can be approved'
      });
    }

    if (status === 'fulfilled' && order.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved orders can be fulfilled'
      });
    }

    // Update order
    const previousStatus = order.status;
    order.status = status;
    
    // Set timestamps
    if (status === 'approved') order.approvedAt = new Date();
    if (status === 'fulfilled') order.fulfilledAt = new Date();
    if (status === 'rejected') order.rejectedAt = new Date();
    
    // Track who made the change
    if (status === 'approved') order.approvedBy = req.user.id;
    if (status === 'fulfilled') order.fulfilledBy = req.user.id;
    if (status === 'rejected') order.rejectedBy = req.user.id;
    
    // Add to status history
    order.statusHistory.push({
      status,
      changedBy: req.user.id,
      notes: notes || `Status changed from ${previousStatus} to ${status}`,
      changedAt: new Date()
    });

    await order.save();

    // Get updated order with populated fields
    const updatedOrder = await Order.findById(order._id)
      .populate('store', 'storeName proprietorName')
      .populate('approvedBy', 'name')
      .populate('fulfilledBy', 'name')
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


/**
 * @api {delete} /api/orders/:id Delete Order (with Stock Reversion)
 * @apiDescription Deletes an order and reverts product stock (like rejection)
 * @apiPermission admin (for non-draft orders) | creator (for draft orders)
 */
app.delete('/api/orders/:id', verifyToken, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Get the order with products populated
    const order = await Order.findById(req.params.id)
      .populate('products.product')
      .session(session);

    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ 
        success: false,
        message: 'Order not found' 
      });
    }

    // 2. Authorization check
    const isAdmin = req.user.role === 'admin';
    const isCreator = order.createdBy.toString() === req.user.id;
    
    // Only allow:
    // - Admins to delete any order
    // - Creators to delete their own draft orders
    if (!isAdmin && (!isCreator || order.status !== 'draft')) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to delete this order'
      });
    }

    // 3. Revert stock for non-draft orders
    if (order.status !== 'draft') {
      const bulkOps = order.products.map(item => ({
        updateOne: {
          filter: { _id: item.product._id },
          update: { 
            $inc: { stock: item.quantity + (item.bonusQuantity || 0) }
          }
        }
      }));

      await Product.bulkWrite(bulkOps, { session });
    }

    // 4. Delete the order
    await Order.findByIdAndDelete(order._id).session(session);

    // 5. Commit transaction
    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Order deleted successfully' + 
        (order.status !== 'draft' ? ' and stock reverted' : '')
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
});

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'BDT',
    minimumFractionDigits: 2
  }).format(value || 0).replace('BDT', '৳');
};

app.get('/api/home-stats', verifyToken, async (req, res) => {
  try {
    const { role, id: userId } = req.user;

    const [totalProducts, totalStores] = await Promise.all([
      Product.countDocuments(),
      Store.countDocuments(),
    ]);

    let roleSpecificData = {};
    
    if (role === 'admin') {
      const [
        pendingOrders,
        fulfilledOrdersAggregate,
        manualDuesAggregate,
        paymentsAggregate
      ] = await Promise.all([
        Order.countDocuments({ status: 'pending' }),
        Order.aggregate([
          { $match: { status: 'fulfilled' } },
          { $unwind: '$products' },
          { 
            $group: {
              _id: null,
              total: { 
                $sum: {
                  $subtract: [
                    { $multiply: ['$products.price', '$products.quantity'] },
                    {
                      $multiply: [
                        { $multiply: ['$products.price', '$products.quantity'] },
                        { $divide: [{ $ifNull: ['$products.discountPercentage', 0] }, 100] }
                      ]
                    }
                  ]
                }
              }
            }
          }
        ]),
        Due.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }]),
        Payment.aggregate([{ $group: { _id: null, total: { $sum: '$amount' } } }])
      ]);

      const fulfilledOrdersTotal = fulfilledOrdersAggregate[0]?.total || 0;
      const manualDuesTotal = manualDuesAggregate[0]?.total || 0;
      const paymentsTotal = paymentsAggregate[0]?.total || 0;
      const totalBusiness = fulfilledOrdersTotal + manualDuesTotal;

      roleSpecificData = {
        metrics: {
          totalProducts,
          activeStores: totalStores,
          pendingOrders
        },
        financial: {
          totalBusiness: formatCurrency(totalBusiness),
          totalPaid: formatCurrency(paymentsTotal),
          currentDues: formatCurrency(totalBusiness - paymentsTotal)
        }
      };
    } 
    else if (role === 'officer') {
      const [
        pendingOrders,
        fulfilledOrdersAggregate,
        manualDuesAggregate,
        paymentsAggregate
      ] = await Promise.all([
        Order.countDocuments({ status: 'pending', createdBy: userId }),
        Order.aggregate([
          { $match: { status: 'fulfilled', createdBy: new mongoose.Types.ObjectId(userId) } },
          { $unwind: '$products' },
          { 
            $group: {
              _id: null,
              total: { 
                $sum: {
                  $subtract: [
                    { $multiply: ['$products.price', '$products.quantity'] },
                    {
                      $multiply: [
                        { $multiply: ['$products.price', '$products.quantity'] },
                        { $divide: [{ $ifNull: ['$products.discountPercentage', 0] }, 100] }
                      ]
                    }
                  ]
                }
              }
            }
          }
        ]),
        Due.aggregate([
          { $lookup: { from: 'stores', localField: 'store', foreignField: '_id', as: 'store' } },
          { $unwind: '$store' },
          { $match: { 'store.officers.marketingOfficer': new mongoose.Types.ObjectId(userId) } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        Payment.aggregate([
          { $lookup: { from: 'stores', localField: 'store', foreignField: '_id', as: 'store' } },
          { $unwind: '$store' },
          { $match: { 'store.officers.marketingOfficer': new mongoose.Types.ObjectId(userId) } },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ])
      ]);

      const fulfilledOrdersTotal = fulfilledOrdersAggregate[0]?.total || 0;
      const manualDuesTotal = manualDuesAggregate[0]?.total || 0;
      const paymentsTotal = paymentsAggregate[0]?.total || 0;
      const totalBusiness = fulfilledOrdersTotal + manualDuesTotal;
      const storeCount = await Store.countDocuments({ 'officers.marketingOfficer': userId });

      roleSpecificData = {
        metrics: {
          totalProducts,
          activeStores: storeCount,
          pendingOrders
        },
        financial: {
          totalBusiness: formatCurrency(totalBusiness),
          totalPaid: formatCurrency(paymentsTotal),
          currentDues: formatCurrency(totalBusiness - paymentsTotal)
        }
      };
    } 
    else if (role === 'stock-manager') {
      const approvedOrders = await Order.countDocuments({ status: 'approved' });

      roleSpecificData = {
        metrics: {
          totalProducts,
          activeStores: totalStores,
          pendingOrders: approvedOrders
        },
        financial: {
          totalBusiness: formatCurrency(0),
          totalPaid: formatCurrency(0),
          currentDues: formatCurrency(0)
        }
      };
    }

    res.json({
      success: true,
      ...roleSpecificData
    });

  } catch (error) {
    console.error('Home stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch home statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});



// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});