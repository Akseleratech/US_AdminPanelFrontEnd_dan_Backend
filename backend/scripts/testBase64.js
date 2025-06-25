require('dotenv').config();
const base64ImageService = require('../services/base64ImageService');

async function testBase64Upload() {
  try {
    console.log('🧪 Testing Base64 Image Processing...\n');

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

    console.log('📤 Processing test image with base64...');
    const result = await base64ImageService.processImage(mockFile);
    
    console.log('✅ Base64 processing successful!');
    console.log('📄 Result:', {
      success: result.success,
      size: result.size,
      mimetype: result.mimetype,
      originalName: result.originalName,
      dataUrlLength: result.dataUrl.length
    });
    
    console.log('🔗 Data URL preview:', result.dataUrl.substring(0, 100) + '...');

    // Test image info extraction
    console.log('\n🔍 Testing image info extraction...');
    const imageInfo = base64ImageService.getImageInfo(result.dataUrl);
    console.log('📊 Image info:', imageInfo);

    console.log('\n🎉 Base64 processing works! This will be used as fallback when Firebase Storage is not available.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run test
testBase64Upload(); 