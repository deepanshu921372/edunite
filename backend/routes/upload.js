const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole, requireApproval } = require('../middleware/auth');
const { uploadToCloudinary } = require('../config/cloudinary');
const multer = require('multer');
const path = require('path');

// Configure multer for different types of uploads
const storage = multer.memoryStorage();

// General file filter function
const createFileFilter = (allowedTypes, maxSize = 50 * 1024 * 1024) => {
  return (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  };
};

// Different upload configurations
const uploads = {

  // Study materials - larger size limit, documents and images
  studyMaterial: multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: createFileFilter([
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif'
    ])
  }),

  // General uploads - medium size limit, various file types
  general: multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
    fileFilter: createFileFilter([
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ])
  })
};

// Helper function to determine file category
const getFileCategory = (mimetype) => {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype === 'application/pdf') return 'document';
  if (mimetype.includes('word') || mimetype.includes('document')) return 'document';
  if (mimetype.includes('powerpoint') || mimetype.includes('presentation')) return 'presentation';
  if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) return 'spreadsheet';
  return 'file';
};

// Helper function to get appropriate Cloudinary folder
const getCloudinaryFolder = (category, userRole) => {
  const baseFolder = 'edunite';

  switch (category) {
    case 'study-material':
      return `${baseFolder}/study-materials`;
    case 'document':
      return `${baseFolder}/documents`;
    case 'image':
      return `${baseFolder}/images`;
    default:
      return `${baseFolder}/uploads`;
  }
};


// Upload study material (teachers only)
router.post('/study-material', authenticateToken, requireRole(['teacher']), requireApproval, uploads.studyMaterial.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const folder = getCloudinaryFolder('study-material', req.user.role);

    // Set resource type for different file types
    const isPDF = req.file.mimetype === 'application/pdf';
    const isDocument = req.file.mimetype.includes('document') ||
                      req.file.mimetype.includes('word') ||
                      req.file.mimetype.includes('powerpoint') ||
                      req.file.mimetype.includes('spreadsheet');

    const uploadOptions = {};
    if (isPDF || isDocument) {
      uploadOptions.resourceType = 'raw';
    }

    const result = await uploadToCloudinary(req.file.buffer, folder, uploadOptions);

    res.json({
      success: true,
      file: {
        url: result.secure_url,
        publicId: result.public_id,
        originalName: req.file.originalname,
        size: req.file.size,
        format: result.format,
        type: req.file.mimetype,
        category: getFileCategory(req.file.mimetype)
      },
      message: 'Study material uploaded successfully'
    });
  } catch (error) {
    console.error('Study material upload error:', error);
    res.status(500).json({
      error: 'Failed to upload study material',
      details: error.message
    });
  }
});

// General file upload (authenticated users)
router.post('/file', authenticateToken, requireApproval, uploads.general.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const category = getFileCategory(req.file.mimetype);
    const folder = getCloudinaryFolder(category, req.user.role);
    const result = await uploadToCloudinary(req.file.buffer, folder);

    res.json({
      success: true,
      file: {
        url: result.secure_url,
        publicId: result.public_id,
        originalName: req.file.originalname,
        size: req.file.size,
        format: result.format,
        type: req.file.mimetype,
        category
      },
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      error: 'Failed to upload file',
      details: error.message
    });
  }
});

// Multiple files upload (teachers and admins only)
router.post('/multiple', authenticateToken, requireRole(['teacher', 'admin']), requireApproval, uploads.general.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    const uploadPromises = req.files.map(async (file) => {
      const category = getFileCategory(file.mimetype);
      const folder = getCloudinaryFolder(category, req.user.role);

      try {
        const result = await uploadToCloudinary(file.buffer, folder);
        return {
          success: true,
          file: {
            url: result.secure_url,
            publicId: result.public_id,
            originalName: file.originalname,
            size: file.size,
            format: result.format,
            type: file.mimetype,
            category
          }
        };
      } catch (error) {
        return {
          success: false,
          originalName: file.originalname,
          error: error.message
        };
      }
    });

    const results = await Promise.all(uploadPromises);
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    res.json({
      success: failed.length === 0,
      uploadedFiles: successful.map(r => r.file),
      failedFiles: failed,
      message: `${successful.length} files uploaded successfully${failed.length > 0 ? `, ${failed.length} failed` : ''}`
    });
  } catch (error) {
    console.error('Multiple files upload error:', error);
    res.status(500).json({
      error: 'Failed to upload files',
      details: error.message
    });
  }
});

// Get upload history (optional - for tracking uploads)
router.get('/history', authenticateToken, requireApproval, async (req, res) => {
  try {
    // This would typically query a database table that tracks uploads
    // For now, we'll return a placeholder response
    // In a full implementation, you might want to store upload metadata in MongoDB

    res.json({
      message: 'Upload history feature not yet implemented',
      note: 'This endpoint can be enhanced to track user upload history from a database'
    });
  } catch (error) {
    console.error('Get upload history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete file from Cloudinary (by public_id)
router.delete('/file/:publicId', authenticateToken, requireRole(['teacher', 'admin']), requireApproval, async (req, res) => {
  try {
    const { publicId } = req.params;

    // Note: To properly implement file deletion, you would need to:
    // 1. Verify the user has permission to delete this file
    // 2. Remove the file from Cloudinary using cloudinary.uploader.destroy()
    // 3. Remove any database references to this file

    const cloudinary = require('cloudinary').v2;

    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      res.json({
        success: true,
        message: 'File deleted successfully',
        publicId
      });
    } else {
      res.status(404).json({
        error: 'File not found or already deleted',
        publicId
      });
    }
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      error: 'Failed to delete file',
      details: error.message
    });
  }
});

// Get file info (for verification purposes)
router.get('/file-info/:publicId', authenticateToken, requireApproval, async (req, res) => {
  try {
    const { publicId } = req.params;

    const cloudinary = require('cloudinary').v2;
    const result = await cloudinary.api.resource(publicId);

    res.json({
      success: true,
      fileInfo: {
        publicId: result.public_id,
        url: result.secure_url,
        format: result.format,
        size: result.bytes,
        width: result.width,
        height: result.height,
        createdAt: result.created_at,
        folder: result.folder
      }
    });
  } catch (error) {
    console.error('Get file info error:', error);
    if (error.http_code === 404) {
      res.status(404).json({ error: 'File not found' });
    } else {
      res.status(500).json({
        error: 'Failed to get file info',
        details: error.message
      });
    }
  }
});

// Handle upload errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        details: 'File size exceeds the allowed limit'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Too many files',
        details: 'Number of files exceeds the allowed limit'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Unexpected file field',
        details: 'File field name does not match expected field'
      });
    }
  }

  if (error.message.includes('File type') && error.message.includes('not allowed')) {
    return res.status(400).json({
      error: 'Invalid file type',
      details: error.message
    });
  }

  next(error);
});

module.exports = router;