const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedAt: {
    type: Date
  },
  blockedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  profile: {
    phoneNumber: String,
    address: String,
    dateOfBirth: Date,

    parentName: String,
    parentPhoneNumber: String,
    grade: String, 
    stream: String, 
    schoolName: String,
    previousTuitionExperience: String,
    
    qualifications: String,
    experience: String, 
    specialization: String, 
    teachingGrades: [String], 
    teachingSubjects: [String], 
    joinedDate: Date,
    emergencyContactName: String,
    emergencyContactPhone: String,
    emergencyContactRelation: String
  },
  admissionNumber: String, 
  subjects: [String],
  emergencyContact: {
    name: String,
    phone: String,
    relation: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);