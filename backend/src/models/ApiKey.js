const mongoose = require('mongoose')
const crypto = require('crypto')

const apiKeySchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Key name is required'],
    trim: true
  },
  prefix: {
    type: String,
    required: true
  },
  keyHash: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsedAt: {
    type: Date,
    default: null
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true })

module.exports = mongoose.model('ApiKey', apiKeySchema)
