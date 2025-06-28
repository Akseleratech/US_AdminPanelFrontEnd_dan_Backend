const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");

// Get Storage bucket
const getBucket = () => {
  if (!admin.apps.length) {
    admin.initializeApp();
  }
  return admin.storage().bucket();
};

// Upload image from buffer
const uploadImageFromBuffer = async (fileBuffer, mimeType, fileName, folder = 'general') => {
  try {
    const bucket = getBucket();
    const fileExtension = mimeType.split('/')[1];
    const uniqueFileName = `${folder}/${Date.now()}_${uuidv4()}.${fileExtension}`;
    
    const file = bucket.file(uniqueFileName);
    
    // Upload file
    await file.save(fileBuffer, {
      metadata: {
        contentType: mimeType,
        metadata: {
          originalName: fileName
        }
      },
      public: true
    });

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${uniqueFileName}`;
    
    return {
      success: true,
      url: publicUrl,
      filename: uniqueFileName,
      originalName: fileName
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

// Upload image from base64
const uploadImageFromBase64 = async (base64Data, fileName, folder = 'general') => {
  try {
    // Parse base64 data
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      throw new Error('Invalid base64 image data');
    }

    const mimeType = matches[1];
    const imageBuffer = Buffer.from(matches[2], 'base64');

    return await uploadImageFromBuffer(imageBuffer, mimeType, fileName, folder);
  } catch (error) {
    console.error('Error uploading base64 image:', error);
    throw new Error(`Failed to upload base64 image: ${error.message}`);
  }
};

// Delete image
const deleteImage = async (fileName) => {
  try {
    if (!fileName) return { success: true, message: 'No image to delete' };

    const bucket = getBucket();
    const file = bucket.file(fileName);
    
    // Check if file exists
    const [exists] = await file.exists();
    if (exists) {
      await file.delete();
      console.log(`✅ Deleted image: ${fileName}`);
    }

    return { success: true, message: 'Image deleted successfully' };
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw error for deletion failures, just log
    return { success: false, message: error.message };
  }
};

// Get image URL from filename
const getImageUrl = (fileName) => {
  if (!fileName) return null;
  const bucket = getBucket();
  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
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
  validateImageFile
}; 