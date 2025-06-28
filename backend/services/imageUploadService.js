const { bucket } = require('../config/firebase');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class ImageUploadService {
  constructor() {
    this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
  }

  /**
   * Validate image file
   */
  validateImage(file) {
    const errors = [];

    if (!file) {
      errors.push('No file provided');
      return errors;
    }

    // Check file type
    if (!this.allowedTypes.includes(file.mimetype)) {
      errors.push('File type not supported. Use JPG, PNG, WebP, or GIF');
    }

    // Check file size
    if (file.size > this.maxFileSize) {
      errors.push('File size too large. Maximum 5MB allowed');
    }

    return errors;
  }

  /**
   * Generate unique filename
   */
  generateFilename(originalName, entityType, entityId) {
    const timestamp = Date.now();
    const uuid = uuidv4().substring(0, 8);
    const ext = path.extname(originalName).toLowerCase();
    return `${entityType}/${entityId}/${timestamp}_${uuid}${ext}`;
  }

  /**
   * Upload image to Firebase Storage
   */
  async uploadImage(file, entityType, entityId, existingImageUrl = null) {
    try {
      // Validate file
      const validationErrors = this.validateImage(file);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      // Delete existing image if provided
      if (existingImageUrl) {
        await this.deleteImageByUrl(existingImageUrl);
      }

      // Generate filename
      const filename = this.generateFilename(file.originalname, entityType, entityId);

      // Create file reference
      const fileRef = bucket.file(filename);

      // Upload file
      await fileRef.save(file.buffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            entityType,
            entityId,
            originalName: file.originalname,
            uploadedAt: new Date().toISOString()
          }
        }
      });

      // Make file publicly accessible
      await fileRef.makePublic();

      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

      return {
        success: true,
        url: publicUrl,
        filename: filename,
        size: file.size,
        mimetype: file.mimetype
      };

    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }
  }

  /**
   * Delete image by URL
   */
  async deleteImageByUrl(imageUrl) {
    try {
      if (!imageUrl) return;

      // Extract filename from URL
      const urlParts = imageUrl.split('/');
      const filename = urlParts[urlParts.length - 1];

      // Delete from storage
      await this.deleteImage(filename);
    } catch (error) {
      console.error('Error deleting image by URL:', error);
      // Don't throw error for deletion failures to avoid blocking main operations
    }
  }

  /**
   * Delete image by filename
   */
  async deleteImage(filename) {
    try {
      if (!filename) return;

      const fileRef = bucket.file(filename);
      await fileRef.delete();
      
      console.log(`✅ Deleted image: ${filename}`);
    } catch (error) {
      console.error(`Error deleting image ${filename}:`, error);
      // Don't throw error for deletion failures
    }
  }

  /**
   * Get image metadata
   */
  async getImageInfo(filename) {
    try {
      const fileRef = bucket.file(filename);
      const [metadata] = await fileRef.getMetadata();
      
      return {
        name: metadata.name,
        size: metadata.size,
        contentType: metadata.contentType,
        created: metadata.timeCreated,
        updated: metadata.updated
      };
    } catch (error) {
      console.error('Error getting image info:', error);
      throw new Error(`Failed to get image info: ${error.message}`);
    }
  }
}

module.exports = new ImageUploadService(); 