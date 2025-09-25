const mongoose = require('mongoose');

const userRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  requestedRole: {
    type: String,
    enum: ['student', 'teacher'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'blocked'],
    default: 'pending'
  },
  requestedAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  adminNotes: {
    type: String
  },
  userProfile: {
    phoneNumber: String,
    address: String,
    parentPhoneNumber: String,
    class: String,
    schoolName: String,
    profileImage: String
  }
});

userRequestSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status !== 'pending') {
    this.processedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model('UserRequest', userRequestSchema);