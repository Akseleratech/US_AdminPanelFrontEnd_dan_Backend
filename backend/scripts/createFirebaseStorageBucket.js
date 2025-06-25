require('dotenv').config();
const { admin } = require('../config/firebase');

async function createStorageBucket() {
  try {
    console.log('🔧 Checking Firebase Storage bucket...');
    
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const bucketName = `${projectId}.appspot.com`;
    
    console.log(`📦 Project ID: ${projectId}`);
    console.log(`🪣 Bucket name: ${bucketName}`);
    
    // Try to get bucket metadata to check if it exists
    const bucket = admin.storage().bucket(bucketName);
    
    try {
      const [exists] = await bucket.exists();
      
      if (exists) {
        console.log('✅ Firebase Storage bucket already exists!');
        console.log('🔗 Bucket URL:', `https://storage.googleapis.com/${bucketName}`);
        
        // Test bucket access
        const [metadata] = await bucket.getMetadata();
        console.log('📄 Bucket metadata:', {
          name: metadata.name,
          location: metadata.location,
          storageClass: metadata.storageClass,
          created: metadata.timeCreated
        });
        
      } else {
        console.log('❌ Firebase Storage bucket does not exist!');
        console.log('');
        console.log('🚨 MANUAL STEPS REQUIRED:');
        console.log('1. Go to: https://console.firebase.google.com/project/unionspace-w9v242/storage');
        console.log('2. Click "Get Started"');
        console.log('3. Choose "Start in production mode" or "Start in test mode"');
        console.log('4. Select location: asia-southeast1 (Singapore) - closest to Indonesia');
        console.log('5. Click "Done"');
        console.log('');
        console.log('💡 After creating the bucket, run this script again to verify.');
      }
      
    } catch (error) {
      if (error.code === 404) {
        console.log('❌ Firebase Storage bucket does not exist!');
        console.log('📋 Error:', error.message);
      } else {
        console.log('⚠️ Error checking bucket:', error.message);
      }
      
      console.log('');
      console.log('🚨 MANUAL STEPS REQUIRED:');
      console.log('1. Go to: https://console.firebase.google.com/project/unionspace-w9v242/storage');
      console.log('2. Click "Get Started"');
      console.log('3. Choose "Start in production mode" or "Start in test mode"');
      console.log('4. Select location: asia-southeast1 (Singapore) - closest to Indonesia');
      console.log('5. Click "Done"');
    }
    
  } catch (error) {
    console.error('❌ Failed to check Firebase Storage:', error.message);
  }
}

// Run the check
createStorageBucket(); 