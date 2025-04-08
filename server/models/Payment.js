import mongoose from 'mongoose';

const PaymentSchema = new mongoose.Schema({
  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'credit', 'bank'],
    default: 'cash'
  },
  notes: String,
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Payment = mongoose.model('Payment', PaymentSchema);
export default Payment;