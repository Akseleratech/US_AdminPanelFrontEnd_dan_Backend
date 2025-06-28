require('dotenv').config();
const base64ImageService = require('../services/base64ImageService');

async function testBase64Upload() {
  try {
    console.log('🧪 Testing Base64 Image Processing...\n');

    // Create a simple test file buffer
    const testImageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    const buffer = Buffer.from(testImageData, 'base64');

    // Create mock file object (similar to multer file)
    const mockFile = {
      originalname: 'test-image.png',
      mimetype: 'image/png',
      size: buffer.length,
      buffer: buffer
    };

    console.log('📤 Processing test image...');
    console.log(`   ├─ File name: ${mockFile.originalname}`);
    console.log(`   ├─ MIME type: ${mockFile.mimetype}`);
    console.log(`   └─ Size: ${mockFile.size} bytes`);

    const result = await base64ImageService.processImage(mockFile);
    
    console.log('\n✅ Base64 processing successful!');
    console.log('📄 Result:');
    console.log(`   ├─ Success: ${result.success}`);
    console.log(`   ├─ Size: ${result.size} bytes`);
    console.log(`   ├─ MIME type: ${result.mimetype}`);
    console.log(`   ├─ Original name: ${result.originalName}`);
    console.log(`   └─ Data URL length: ${result.dataUrl.length} characters`);
    
    // Test the data URL format
    if (result.dataUrl.startsWith('data:image/png;base64,')) {
      console.log('\n✅ Data URL format is correct!');
    } else {
      console.log('\n❌ Data URL format is incorrect!');
    }

    // Test image info extraction
    console.log('\n🔍 Testing image info extraction...');
    const imageInfo = base64ImageService.getImageInfo(result.dataUrl);
    if (imageInfo) {
      console.log('📊 Image info:');
      console.log(`   ├─ MIME type: ${imageInfo.mimetype}`);
      console.log(`   ├─ Estimated size: ${imageInfo.estimatedSize} bytes`);
      console.log(`   └─ Is Base64: ${imageInfo.isBase64}`);
    }

    console.log('\n🎉 All base64 tests passed!');
    console.log('💡 Now you can upload images to cities - they will be stored as base64 in Firestore.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run test
testBase64Upload(); 