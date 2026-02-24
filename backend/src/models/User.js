const mongoose=require('mongoose');
const bcrypt=require('bcryptjs');

const userSchema=new mongoose.Schema({
  orgId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: [true, "Organization ID is required"]
  },
  name:{
    type: String,
    required: [true, "Name is required"],
    maxlength: [50, "Name cannot exceed 50 characters"],
    trim: true
  },
  email:{
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase:true
  },
  passwordHash:{
    type: String,
    enum:['admin','developer','viewer'],
    default:'developer'
  },
  isactive:{
    type: Boolean,
    default: true
  }
},{timestamps: true});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash)
}

// Never return passwordHash in responses
userSchema.methods.toJSON = function() {
  const obj = this.toObject()
  delete obj.passwordHash
  return obj
}

module.exports=mongoose.model('User',userSchema);