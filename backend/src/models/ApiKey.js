const mongoose = require('mongoose');
const crypto = require('crypto');

const apiKeySchema = new mongoose.Schema({
  orgId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, "Organization ID is required"]
  },
  name:{
    type: String,
    required: [true,"API Key name is required"],
    maxlength: [100,"API Key name cannot exceed 100 characters"],
    trim: true
  },
  prefix:{
    type: String,
    required: true,
  },
  keyHash:{
    type: String,
    required: true,
  },
  isActive:{
    type: Boolean,
    default: true
  },
  lastUsedAt:{
    type: Date,
    default: null
  },
  createdBy:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, "Creator User ID is required"]
  },
},{timestamps: true});

apiKeySchema.statics.generateKey = function() {
  const raw = `sk-live-${crypto.randomBytes(24).toString('hex')}`
  const hash = crypto.createHash('sha256').update(raw).digest('hex')
  const prefix = raw.substring(0, 16)
  return { raw, hash, prefix }
}

// Static method to verify a key
apiKeySchema.statics.hashKey = function(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

module.exports = mongoose.model('ApiKey', apiKeySchema)
