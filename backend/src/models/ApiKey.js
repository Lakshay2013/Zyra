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

module.exports = mongoose.model('ApiKey', apiKeySchema);
