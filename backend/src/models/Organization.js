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
  }
},{timestamps: true});

module.exports = mongoose.model('Organization', organizationSchema);