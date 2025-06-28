require('dotenv').config();

async function findBucketName() {
  console.log('🔍 Finding Firebase Storage bucket name...\n');
  
  const projectId = process.env.FIREBASE_PROJECT_ID;
  console.log(`📦 Project ID: ${projectId}`);
  
  console.log('\n📋 Please check your Firebase Console:');
  console.log(`🔗 Go to: https://console.firebase.google.com/project/${projectId}/storage`);
  console.log('\n🔍 Look for the bucket name in the Storage tab:');
  console.log('   - It might show as "gs://[BUCKET_NAME]" or');
  console.log('   - Look at the file upload URL pattern');
  console.log('\n💡 Common bucket name patterns:');
  console.log(`   ✓ ${projectId}.appspot.com`);
  console.log(`   ✓ ${projectId}.firebaseapp.com`);
  console.log(`   ✓ ${projectId}_default`);
  console.log(`   ✓ gs://${projectId}.appspot.com`);
  
  console.log('\n🚨 If you see a different bucket name, please:');
  console.log('1. Copy the exact bucket name from Firebase Console');
  console.log('2. Update backend/config/firebase.js');
  console.log('3. Change this line:');
  console.log(`   storageBucket: '${projectId}.appspot.com'`);
  console.log('   to:');
  console.log('   storageBucket: \'[YOUR_ACTUAL_BUCKET_NAME]\'');
  
  console.log('\n🔧 Alternative: Try without specifying bucket name');
  console.log('   Just use: storageBucket: undefined');
  console.log('   This will use the default bucket for the project');
}

findBucketName(); 