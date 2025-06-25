require('dotenv').config();
const { admin } = require('../config/firebase');

async function listBuckets() {
  try {
    console.log('🔍 Searching for Firebase Storage buckets...\n');
    
    const projectId = process.env.FIREBASE_PROJECT_ID;
    console.log(`📦 Project ID: ${projectId}`);
    
    // Try different possible bucket names
    const possibleBuckets = [
      `${projectId}.appspot.com`,
      `${projectId}.firebaseapp.com`,
      `${projectId}-default-rtdb.appspot.com`,
      projectId
    ];
    
    console.log('🔎 Checking possible bucket names:');
    
    for (const bucketName of possibleBuckets) {
      try {
        const bucket = admin.storage().bucket(bucketName);
        const [exists] = await bucket.exists();
        
        console.log(`   ${bucketName}: ${exists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
        
        if (exists) {
          const [metadata] = await bucket.getMetadata();
          console.log(`   └─ Location: ${metadata.location}`);
          console.log(`   └─ Storage Class: ${metadata.storageClass}`);
          console.log(`   └─ Created: ${metadata.timeCreated}`);
        }
      } catch (error) {
        console.log(`   ${bucketName}: ❌ ERROR - ${error.message}`);
      }
    }
    
    console.log('\n💡 If no buckets exist, you need to:');
    console.log('1. Go to Firebase Console Storage section');
    console.log('2. Click "Get Started" to initialize Storage');
    console.log('3. Choose security rules mode');
    console.log('4. Select a location');
    
    // Also try to list buckets using Google Cloud Storage API
    console.log('\n🌐 Trying Google Cloud Storage API...');
    try {
      const storage = admin.storage();
      const [buckets] = await storage.getBuckets();
      
      if (buckets.length > 0) {
        console.log('📋 Available buckets:');
        for (const bucket of buckets) {
          console.log(`   ✅ ${bucket.name}`);
        }
      } else {
        console.log('📋 No buckets found in this project');
      }
    } catch (apiError) {
      console.log(`❌ Google Cloud Storage API error: ${apiError.message}`);
    }
    
  } catch (error) {
    console.error('❌ Failed to list buckets:', error.message);
  }
}

// Run the check
listBuckets(); 