import mongoose from 'mongoose';

const { Schema } = mongoose;

const orderedProductSchema = new Schema({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number, required: true, min: 0 }
});

const orderSchema = new Schema({
  officer: {
    id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true }
  },
  store: {
    id: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    name: { type: String, required: true }
  },
  orderDate: { type: Date, default: Date.now },
  products: [orderedProductSchema],
  bonusQuantity: { type: Number, default: 0, min: 0 },
  discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
  status: {
    type: String,
    enum: ['draft', 'pending', 'processing', 'completed', 'cancelled'],
    default: 'draft'
  },
  totalAmount: { type: Number, required: true, min: 0 },
  finalAmount: { type: Number, required: true, min: 0 },
  notes: { type: String, trim: true }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calculate amounts before saving
orderSchema.pre('save', function(next) {
  const discountMultiplier = (100 - this.discountPercentage) / 100;
  const productsTotal = this.products.reduce((sum, product) => sum + product.totalPrice, 0);
  
  this.totalAmount = productsTotal;
  this.finalAmount = productsTotal * discountMultiplier;
  
  next();
});

const Order = mongoose.model('Order', orderSchema);
export default Order;