const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name:{
    type: String,
    required: [true,"Organization name is required"],
    maxlength: [100,"Organization name cannot exceed 100 characters"],
    trim: true
  },
  bio:{
    type: String,
    maxlength: [500,"Bio cannot exceed 500 characters"],
    default: '',
    trim: true
  },
  plan:{
    type: String,
    enum: ['free', 'pro', 'growth'],
    default: 'free'
  },
  monthlyLogLimit:{
    type: Number,
    default: 1000
  },
  currentMonthlyLogs:{
    type: Number,
    default: 0
  },
  // Demo mode: serve all LLM calls from the built-in simulator (no external
  // provider keys needed). Routing / cost / risk / logging all run for real.
  demoMode: {
    type: Boolean,
    default: false
  },
  // Marks organisations/data created by the demo seed so `demo:reset` can
  // remove them without touching real tenants.
  isDemo: {
    type: Boolean,
    default: false
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
    blockJailbreak: { type: Boolean, default: false },
    maxTokensPerRequest: { type: Number, default: 2000 },
    // Org-specific watch-words for the sensitive-keyword detector (in addition
    // to the built-in list).
    sensitiveKeywords: { type: [String], default: [] }
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
  },
  // Cache settings
  cache: {
    enabled: { type: Boolean, default: true },
    ttlSeconds: { type: Number, default: 300, min: 0, max: 86400 }
  },
  // Subscription / billing
  subscription: {
    razorpayPaymentId: { type: String, default: null },
    billingCycle: { type: String, enum: ['monthly', 'yearly'], default: null },
    currentPeriodEnd: { type: Date, default: null },
    status: { type: String, enum: ['active', 'expired', 'cancelled', null], default: null }
  }
},{timestamps: true});

module.exports = mongoose.model('Organization', organizationSchema);