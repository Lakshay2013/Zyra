const mongoose = require('mongoose')

const paymentSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  paymentId: {
    type: String,
    default: null,
    index: true
  },
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    enum: ['pro', 'growth'],
    required: true
  },
  amount: {
    type: Number,
    required: true  // in paise (e.g., 99900 = ₹999)
  },
  currency: {
    type: String,
    default: 'INR'
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true
  },
  status: {
    type: String,
    enum: ['created', 'paid', 'failed'],
    default: 'created'
  },
  razorpaySignature: {
    type: String,
    default: null
  },
  notes: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true })

module.exports = mongoose.model('Payment', paymentSchema)
