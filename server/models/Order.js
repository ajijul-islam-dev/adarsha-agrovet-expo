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
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'fulfilled'],
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
  approvedAt: Date,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectedAt: Date,
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: String,
  fulfilledAt: Date,
  fulfilledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

// Track previous status for stock management
orderSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this._previousStatus = this._originalStatus || this.status;
    this._originalStatus = this.status;
  }
  next();
});

// Handle stock changes based on order status
orderSchema.pre('save', async function(next) {
  if (this.isModified('status')) {
    const session = this.$session();
    
    try {
      // Add to status history
      this.statusHistory = this.statusHistory || [];
      this.statusHistory.push({
        status: this.status,
        changedBy: this._updatedBy,
        changedAt: new Date(),
        notes: this.status === 'rejected' ? this.rejectionReason : ''
      });

      // Handle stock changes
      if (this.status === 'rejected' && this._previousStatus === 'pending') {
        // Revert stock for rejected orders
        for (const item of this.products) {
          await mongoose.model('Product').updateOne(
            { _id: item.product },
            { $inc: { stock: item.quantity + (item.bonusQuantity || 0) } },
            { session }
          );
        }
      } else if (this.status === 'pending' && this._previousStatus === 'draft') {
        // Reduce stock when order is submitted
        for (const item of this.products) {
          await mongoose.model('Product').updateOne(
            { _id: item.product },
            { $inc: { stock: - (item.quantity + (item.bonusQuantity || 0)) } },
            { session }
          );
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

const Order = mongoose.model('Order', orderSchema);
export default Order;