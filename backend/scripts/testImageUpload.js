require('dotenv').config();
const imageUploadService = require('../services/imageUploadService');
const fs = require('fs');
const path = require('path');

async function testImageUpload() {
  try {
    console.log('🧪 Testing Firebase Storage Image Upload...\n');

    // Create a simple test file buffer to simulate uploaded image
    const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const base64Data = testImageData.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Create mock file object
    const mockFile = {
      originalname: 'test-image.png',
      mimetype: 'image/png',
      size: buffer.length,
      buffer: buffer
    };

    console.log('📤 Uploading test image...');
    const result = await imageUploadService.uploadImage(mockFile, 'cities', 'TEST001');
    
    console.log('✅ Upload successful!');
    console.log('📄 Result:', result);
    console.log('🔗 Image URL:', result.url);

    // Test image deletion
    console.log('\n🗑️ Testing image deletion...');
    await imageUploadService.deleteImageByUrl(result.url);
    console.log('✅ Image deleted successfully!');

    console.log('\n🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run test
testImageUpload(); 