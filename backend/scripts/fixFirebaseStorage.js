require('dotenv').config();
const { admin } = require('../config/firebase');

async function findWorkingBucket() {
  try {
    console.log('🔍 Trying different Firebase Storage configurations...\n');
    
    const projectId = process.env.FIREBASE_PROJECT_ID;
    console.log(`📦 Project ID: ${projectId}`);
    
    // Try different bucket configurations
    const bucketConfigurations = [
      // Default bucket (no name specified)
      { name: 'default', bucket: admin.storage().bucket() },
      // Explicit appspot.com bucket
      { name: `${projectId}.appspot.com`, bucket: admin.storage().bucket(`${projectId}.appspot.com`) },
      // Other possible names
      { name: `${projectId}.firebaseapp.com`, bucket: admin.storage().bucket(`${projectId}.firebaseapp.com`) },
      { name: projectId, bucket: admin.storage().bucket(projectId) }
    ];
    
    for (const config of bucketConfigurations) {
      try {
        console.log(`🧪 Testing bucket: ${config.name}`);
        
        // Create a simple test file
        const testFileName = 'test/connection-test.txt';
        const testContent = 'Firebase Storage connection test';
        
        // Try to upload a test file
        const file = config.bucket.file(testFileName);
        await file.save(testContent, {
          metadata: {
            contentType: 'text/plain'
          }
        });
        
        console.log(`✅ SUCCESS! Bucket works: ${config.name}`);
        console.log(`   ├─ Real bucket name: ${config.bucket.name}`);
        
        // Make it public to test URL
        await file.makePublic();
        const publicUrl = `https://storage.googleapis.com/${config.bucket.name}/${testFileName}`;
        console.log(`   ├─ Test file URL: ${publicUrl}`);
        
        // Clean up test file
        await file.delete();
        console.log(`   └─ Test file cleaned up`);
        
        console.log(`\n🎉 FOUND WORKING BUCKET: ${config.bucket.name}`);
        console.log(`💡 Update your firebase config to use: ${config.bucket.name}`);
        return config.bucket.name;
        
      } catch (error) {
        console.log(`   ❌ Failed: ${error.message}`);
      }
    }
    
    console.log('\n❌ No working bucket found!');
    console.log('💡 Please check:');
    console.log('   1. Firebase Storage is enabled in console');
    console.log('   2. Service account has Storage Admin permissions');
    console.log('   3. Project ID is correct');
    
  } catch (error) {
    console.error('❌ Error testing buckets:', error.message);
  }
}

// Run the test
findWorkingBucket(); 