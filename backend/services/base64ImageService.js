class Base64ImageService {
  constructor() {
    this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    this.maxFileSize = 2 * 1024 * 1024; // 2MB limit for base64 (smaller than Firebase Storage)
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

    // Check file size (smaller limit for base64)
    if (file.size > this.maxFileSize) {
      errors.push('File size too large. Maximum 2MB allowed for base64 storage');
    }

    return errors;
  }

  /**
   * Convert file to base64 data URL
   */
  async processImage(file) {
    try {
      // Validate file
      const validationErrors = this.validateImage(file);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      // Convert buffer to base64
      const base64String = file.buffer.toString('base64');
      const dataUrl = `data:${file.mimetype};base64,${base64String}`;

      return {
        success: true,
        dataUrl: dataUrl,
        size: file.size,
        mimetype: file.mimetype,
        originalName: file.originalname
      };

    } catch (error) {
      console.error('Error processing image:', error);
      throw new Error(`Image processing failed: ${error.message}`);
    }
  }

  /**
   * Get image size info
   */
  getImageInfo(dataUrl) {
    if (!dataUrl || !dataUrl.startsWith('data:')) {
      return null;
    }

    // Extract mimetype from data URL
    const mimeMatch = dataUrl.match(/data:([^;]+);base64,/);
    const mimetype = mimeMatch ? mimeMatch[1] : 'unknown';
    
    // Estimate size (base64 is ~33% larger than original)
    const base64Data = dataUrl.split(',')[1];
    const estimatedSize = Math.round((base64Data.length * 3) / 4);

    return {
      mimetype,
      estimatedSize,
      isBase64: true
    };
  }
}

module.exports = new Base64ImageService(); 