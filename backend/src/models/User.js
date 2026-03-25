const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  orgId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'developer', 'viewer'],
    default: 'developer'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  otpCode: {
    type: String,
    select: false
  },
  otpExpires: {
    type: Date,
    select: false
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true // allows multiple null values if they signed up with email
  }
}, { timestamps: true })

userSchema.pre('save', async function() {
  if (!this.isModified('passwordHash') || !this.passwordHash) return
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12)
})

userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.passwordHash) return false
  return await bcrypt.compare(candidatePassword, this.passwordHash)
}

userSchema.methods.toJSON = function() {
  const obj = this.toObject()
  delete obj.passwordHash
  return obj
}

module.exports = mongoose.model('User', userSchema)