import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    packSize: String,
    unit: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    bonusQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  }],
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit'],
    default: 'cash'
  },
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'fulfilled', 'confirmed'],
    default: 'draft'
  },
  statusHistory: [{
    status: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String
  }],
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  marketingOfficer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  submittedAt: Date,
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectedAt: Date,
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: String,
  fulfilledAt: Date,
  fulfilledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  confirmedAt: Date,
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// Add pre-save hook to track status changes
orderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory = this.statusHistory || [];
    this.statusHistory.push({
      status: this.status,
      changedBy: this._updatedBy // Set this in your controllers
    });
    
    // Update timestamps based on status changes
    const now = new Date();
    if (this.status === 'approved') {
      this.approvedAt = now;
    } else if (this.status === 'rejected') {
      this.rejectedAt = now;
    } else if (this.status === 'fulfilled') {
      this.fulfilledAt = now;
    } else if (this.status === 'confirmed') {
      this.confirmedAt = now;
    } else if (this.status === 'pending') {
      this.submittedAt = now;
    }
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order;