const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['paid', 'pending', 'overdue'],
    default: 'pending',
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  paymentIntentId: {
    type: String,
  },
  paymentDate: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Update status to overdue if due date has passed
feeSchema.pre('save', function(next) {
  if (this.status === 'pending' && this.dueDate < new Date()) {
    this.status = 'overdue';
  }
  next();
});

const Fee = mongoose.model('Fee', feeSchema);

module.exports = Fee; 