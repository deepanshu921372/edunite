const mongoose = require('mongoose');

const studyMaterialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  class: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Class',
    required: false
  },
  grade: {
    type: String,
    required: false
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  // Support for single file (backward compatibility)
  fileUrl: String,
  fileName: String,
  fileType: String,
  fileSize: Number,
  // Support for multiple files
  files: {
    type: [{
      name: { type: String },
      url: { type: String },
      size: { type: Number },
      type: { type: String }
    }],
    default: []
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('StudyMaterial', studyMaterialSchema);