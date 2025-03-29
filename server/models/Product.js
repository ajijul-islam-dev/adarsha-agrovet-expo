import mongoose from 'mongoose'

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
    trim: true,
  },
  productCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
  },
  packSize: {
    type: Number,
    required: false,
    min: 0,
  },
  unit: {
    type: String,
    enum: ['kg', 'gm', 'piece', 'pack', 'liter'],
    required: true,
  },
  description: {
    type: String,
    trim: true,
  },
}, { timestamps: true });

const Product = mongoose.model('Product', productSchema);
export default Product
