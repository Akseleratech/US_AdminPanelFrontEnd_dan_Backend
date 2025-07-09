const admin = require('firebase-admin');
const {v4: uuidv4} = require('uuid');

// Check if running in emulator
const isEmulator = () => {
  return process.env.FUNCTIONS_EMULATOR === 'true' ||
         process.env.NODE_ENV === 'development' ||
         process.env.FIREBASE_STORAGE_EMULATOR_HOST;
};

// Get Storage bucket with explicit bucket name
const getBucket = () => {
  if (!admin.apps.length) {
    admin.initializeApp();
  }

  const projectId = process.env.GCLOUD_PROJECT || 'demo-unionspace-crm';
  const bucketName = `${projectId}.appspot.com`;

  console.log(`📦 Using bucket: ${bucketName}`);
  return admin.storage().bucket(bucketName);
};

// Get proper URL based on environment
const getImageUrl = (fileName) => {
  if (!fileName) return null;

  const projectId = process.env.GCLOUD_PROJECT || 'demo-unionspace-crm';
  const bucketName = `${projectId}.appspot.com`;

  if (isEmulator()) {
    // Use emulator URL format
    const emulatorHost = process.env.FIREBASE_STORAGE_EMULATOR_HOST || '127.0.0.1:9999';
    const url = `http://${emulatorHost}/v0/b/${bucketName}/o/${encodeURIComponent(fileName)}?alt=media`;
    console.log(`🔗 Generated emulator URL: ${url}`);
    return url;
  } else {
    // Use production URL format
    return `https://storage.googleapis.com/${bucketName}/${fileName}`;
  }
};

// Upload image from buffer
const uploadImageFromBuffer = async (fileBuffer, mimeType, fileName, folder = 'general') => {
  try {
    console.log(`📤 Uploading image: ${fileName} to folder: ${folder}`);
    console.log(`🚀 Environment: ${isEmulator() ? 'EMULATOR' : 'PRODUCTION'}`);

    const bucket = getBucket();
    const fileExtension = mimeType.split('/')[1];
    const uniqueFileName = `${folder}/${Date.now()}_${uuidv4()}.${fileExtension}`;

    console.log(`📁 Generated filename: ${uniqueFileName}`);

    const file = bucket.file(uniqueFileName);

    // Upload file
    const uploadOptions = {
      metadata: {
        contentType: mimeType,
        metadata: {
          originalName: fileName,
          uploadedAt: new Date().toISOString(),
          folder: folder,
        },
      },
    };

    // Only set public for production (emulator doesn't need this)
    if (!isEmulator()) {
      uploadOptions.public = true;
    }

    await file.save(fileBuffer, uploadOptions);
    console.log('✅ File saved to storage successfully');

    // Make public in production
    if (!isEmulator()) {
      try {
        await file.makePublic();
        console.log('✅ File made public');
      } catch (publicError) {
        console.warn('⚠️ Could not make file public (might already be public):', publicError.message);
      }
    }

    // Get public URL
    const publicUrl = getImageUrl(uniqueFileName);
    console.log(`🔗 Generated URL: ${publicUrl}`);

    return {
      success: true,
      url: publicUrl,
      filename: uniqueFileName,
      originalName: fileName,
    };
  } catch (error) {
    console.error('❌ Error uploading image:', error);
    console.error('🔍 Error details:', {
      message: error.message,
      code: error.code,
      details: error.details,
    });
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

// Upload image from base64
const uploadImageFromBase64 = async (base64Data, fileName, folder = 'general') => {
  try {
    console.log(`🔍 Processing base64 image: ${fileName}`);

    // Parse base64 data
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 image data format');
    }

    const mimeType = matches[1];
    const imageBuffer = Buffer.from(matches[2], 'base64');

    console.log(`📊 Image info: ${mimeType}, ${imageBuffer.length} bytes`);

    // Validate image type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(mimeType)) {
      throw new Error(`Unsupported image type: ${mimeType}. Allowed: ${allowedTypes.join(', ')}`);
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024;
    if (imageBuffer.length > maxSize) {
      throw new Error(`Image too large: ${imageBuffer.length} bytes. Maximum: ${maxSize} bytes`);
    }

    return await uploadImageFromBuffer(imageBuffer, mimeType, fileName, folder);
  } catch (error) {
    console.error('❌ Error uploading base64 image:', error);
    throw new Error(`Failed to upload base64 image: ${error.message}`);
  }
};

// Delete image
const deleteImage = async (imageUrl) => {
  try {
    if (!imageUrl) return {success: true, message: 'No image to delete'};

    console.log(`🗑️ Deleting image: ${imageUrl}`);

    // Extract filename from URL
    let fileName;
    if (imageUrl.includes('127.0.0.1:9999') || imageUrl.includes('localhost:9999') || imageUrl.includes('127.0.0.1:9199') || imageUrl.includes('localhost:9199')) {
      // Emulator URL format: http://127.0.0.1:9199/v0/b/bucket/o/path%2Fto%2Ffile.jpg?alt=media
      const matches = imageUrl.match(/o\/([^?]+)/);
      if (matches) {
        fileName = decodeURIComponent(matches[1]);
      }
    } else if (imageUrl.includes('storage.googleapis.com')) {
      // Production URL format: https://storage.googleapis.com/bucket/path/to/file.jpg
      const urlParts = imageUrl.split('/');
      // Remove the bucket name and join the rest as the filename
      const bucketIndex = urlParts.findIndex((part) => part.includes('.appspot.com'));
      if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
        fileName = urlParts.slice(bucketIndex + 1).join('/');
      } else {
        fileName = urlParts[urlParts.length - 1];
      }
    } else if (imageUrl.includes('firebasestorage.googleapis.com')) {
      // Firebase Storage URL format: https://firebasestorage.googleapis.com/v0/b/bucket/o/path%2Fto%2Ffile.jpg?alt=media
      const matches = imageUrl.match(/o\/([^?]+)/);
      if (matches) {
        fileName = decodeURIComponent(matches[1]);
      }
    } else {
      // Fallback: try to extract from the last part of URL
      const urlParts = imageUrl.split('/');
      fileName = urlParts[urlParts.length - 1];
    }

    if (!fileName) {
      console.warn('⚠️ Could not extract filename from URL:', imageUrl);
      return {success: false, message: 'Could not extract filename from URL'};
    }

    console.log(`📁 Extracted filename: ${fileName}`);

    const bucket = getBucket();
    const file = bucket.file(fileName);

    // Check if file exists
    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
      console.log(`✅ Deleted image: ${fileName}`);
    } else {
      console.log(`ℹ️ Image does not exist: ${fileName}`);
    }

    return {success: true, message: 'Image deleted successfully'};
  } catch (error) {
    console.error('❌ Error deleting image:', error);
    // Don't throw error for deletion failures, just log
    return {success: false, message: error.message};
  }
};

// Validate image file
const validateImageFile = (file) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!file) {
    throw new Error('No file provided');
  }

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed');
  }

  if (file.size > maxSize) {
    throw new Error('File size must be less than 5MB');
  }

  return true;
};

module.exports = {
  uploadImageFromBuffer,
  uploadImageFromBase64,
  deleteImage,
  getImageUrl,
  validateImageFile,
  isEmulator,
};
