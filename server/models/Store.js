import mongoose from 'mongoose';

const StoreSchema = new mongoose.Schema({
  storeName: {
    type: String,
    required: [true, 'Store name is required'],
    trim: true
  },
  proprietorName: {
    type: String,
    required: [true, 'Proprietor name is required'],
    trim: true
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    validate: {
      validator: function(v) {
        return /^[0-9]+$/.test(v);
      },
      message: props => `${props.value} is not a valid contact number`
    },
    minlength: [10, 'Contact number must be at least 10 digits'],
    maxlength: [15, 'Contact number must be less than or equal to 15 digits']
  },
  area: {
    type: String,
    required: [true, 'Area is required'],
    trim: true
  },
  storeCode: {
    type: String,
    required: [true, 'Store code is required'],
    unique: true
  },
  openingDate: {
    type: Date,
    default: Date.now
  },
  officers: {
    marketingOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Marketing Officer is required']
    }
  },
  paymentHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  }],
  dueHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Due'
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to update the updatedAt field before saving
StoreSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Create and export the model
const Store = mongoose.model('Store', StoreSchema);
export default Store;
