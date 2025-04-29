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
    name: String,
    price: Number,
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
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit'],
    default: 'cash',
    required: true
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

// Enable access to previous document values
orderSchema.pre('save', async function (next) {
  if (this.isModified('status') && !this._previousStatus) {
    const existing = await this.constructor.findById(this._id).lean();
    this._previousStatus = existing?.status || 'draft';
  }
  next();
});

// Handle stock updates and status history
orderSchema.pre('save', async function (next) {
  if (!this.isModified('status')) return next();

  const session = this.$session();
  const prev = this._previousStatus;
  const curr = this.status;

  console.log(`Order ${this._id} status change: ${prev} → ${curr}`);

  try {
    this.statusHistory = this.statusHistory || [];
    this.statusHistory.push({
      status: this.status,
      changedBy: this._updatedBy,
      changedAt: new Date(),
      notes: this.status === 'rejected' ? this.rejectionReason : ''
    });

    const Product = mongoose.model('Product');

    if ((curr === 'rejected') && (prev === 'pending' || prev === 'approved')) {
      for (const item of this.products) {
        await Product.updateOne(
          { _id: item.product },
          { $inc: { stock: item.quantity + (item.bonusQuantity || 0) } },
          { session }
        );
        console.log(`Stock reverted for product ${item.product}`);
      }
    } else if (curr === 'pending' && prev === 'draft') {
      for (const item of this.products) {
        await Product.updateOne(
          { _id: item.product },
          { $inc: { stock: -(item.quantity + (item.bonusQuantity || 0)) } },
          { session }
        );
        console.log(`Stock deducted for product ${item.product}`);
      }
    }

    next();
  } catch (err) {
    next(err);
  }
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
