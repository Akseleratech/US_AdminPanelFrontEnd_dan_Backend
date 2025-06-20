require('dotenv').config();

console.log('🔍 Testing Firebase Configuration...\n');

// Check required environment variables
const requiredEnvVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_PRIVATE_KEY_ID', 
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_CLIENT_ID',
  'FIREBASE_AUTH_URI',
  'FIREBASE_TOKEN_URI',
  'FIREBASE_AUTH_PROVIDER_X509_CERT_URL',
  'FIREBASE_CLIENT_X509_CERT_URL'
];

console.log('Environment Variables Status:');
console.log('============================');

const missingVars = [];
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${varName === 'FIREBASE_PRIVATE_KEY' ? '[HIDDEN]' : value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    missingVars.push(varName);
  }
});

console.log('\n============================\n');

if (missingVars.length > 0) {
  console.log('🚨 Missing Environment Variables:');
  missingVars.forEach(varName => {
    console.log(`   - ${varName}`);
  });
  console.log('\n💡 You need to add these to your .env file');
  console.log('   Get them from Firebase Console > Project Settings > Service Accounts');
  process.exit(1);
}

// Try to initialize Firebase
try {
  console.log('🔄 Testing Firebase initialization...');
  const { admin, db } = require('../config/firebase');
  
  console.log('✅ Firebase Admin SDK initialized successfully');
  console.log(`✅ Project ID: ${admin.app().options.projectId}`);
  
  // Test Firestore connection
  console.log('🔄 Testing Firestore connection...');
  
  db.collection('test').limit(1).get()
    .then(() => {
      console.log('✅ Firestore connection successful');
      console.log('\n🎉 All Firebase tests passed!');
      process.exit(0);
    })
    .catch(error => {
      console.log('❌ Firestore connection failed:', error.message);
      process.exit(1);
    });
    
} catch (error) {
  console.log('❌ Firebase initialization failed:', error.message);
  process.exit(1);
} 