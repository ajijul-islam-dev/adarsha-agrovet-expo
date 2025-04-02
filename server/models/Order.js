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
    enum: ['draft', 'submitted', 'approved', 'rejected', 'fulfilled'],
    default: 'draft'
  },
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
  rejectedAt: Date,
  fulfilledAt: Date
}, {
  timestamps: true
});

const Order = mongoose.model('Order', orderSchema);

export default Order;