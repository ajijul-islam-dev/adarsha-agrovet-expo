import mongoose from 'mongoose';

const DueSchema = new mongoose.Schema({
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
  description: String,
  dueDate: Date,
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

const Due = mongoose.model('Due', DueSchema);
export default Due;