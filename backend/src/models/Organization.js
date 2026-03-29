const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name:{
    type: String,
    required: [true,"Organization name is required"],
    maxlength: [100,"Organization name cannot exceed 100 characters"],
    trim: true
  },
  plan:{
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free'
  },
  monthlyLogLimit:{
    type: Number,
    default: 5000
  },
  currentMonthlyLogs:{
    type: Number,
    default: 0
  },
  providerKeys: {
    openai: { type: String, default: null },
    anthropic: { type: String, default: null },
    gemini: { type: String, default: null },
    groq: { type: String, default: null }
  },
  policies: {
    blockPII: { type: Boolean, default: false },
    blockInjection: { type: Boolean, default: true },
    maxTokensPerRequest: { type: Number, default: 2000 }
  },
  // Cost optimizer settings
  optimizer: {
    autoOptimize: { type: Boolean, default: false },
    qualityTier: { type: String, enum: ['economy', 'standard', 'premium'], default: 'standard' },
    costAlertThreshold: { type: Number, default: 100 }
  },
  // Reliability settings
  reliability: {
    enableRetry: { type: Boolean, default: true },
    maxRetries: { type: Number, default: 2, min: 0, max: 5 },
    fallbackOrder: [{ type: String, enum: ['openai', 'anthropic', 'gemini', 'groq'] }]
  }
},{timestamps: true});

module.exports = mongoose.model('Organization', organizationSchema);