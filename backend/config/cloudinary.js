const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadToCloudinary = (fileBuffer, folder = 'edunite', options = {}) => {
  return new Promise((resolve, reject) => {
    // Determine resource type based on file or default
    const resourceType = options.resourceType || 'auto';

    const uploadOptions = {
      folder: folder,
      resource_type: resourceType,
      access_mode: 'public',
      type: 'upload',
      use_filename: true,
      unique_filename: true,
      ...options
    };

    cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('Cloudinary upload success:', result.secure_url);
          resolve(result);
        }
      }
    ).end(fileBuffer);
  });
};

module.exports = {
  cloudinary,
  uploadToCloudinary
};