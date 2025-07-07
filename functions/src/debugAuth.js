/**
 * Debug Script - Test Auth and Firestore Connection
 */

const fetch = require('node-fetch');

// Configuration
const EMULATOR_HOST = 'localhost';
const AUTH_PORT = 9099;
const FIRESTORE_PORT = 8888;
const PROJECT_ID = 'demo-unionspace-crm';

// Test auth sign-in
async function testAuthSignIn(email, password) {
  const url = `http://${EMULATOR_HOST}:${AUTH_PORT}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=fake-api-key`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      password: password,
      returnSecureToken: true
    })
  });

  return response;
}

// Test Firestore document read
async function testFirestoreRead(collection, docId) {
  const url = `http://${EMULATOR_HOST}:${FIRESTORE_PORT}/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  return response;
}

// Main debug function
async function debugAuth() {
  console.log('🔍 DEBUG: Testing Auth and Firestore...');
  console.log('========================================');
  
  // Test 1: Auth Sign-in
  console.log('📝 Test 1: Auth Sign-in');
  try {
    const authResponse = await testAuthSignIn('admin@unionspace.com', 'admin123456');
    console.log(`   Status: ${authResponse.status} ${authResponse.statusText}`);
    
    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log(`   ✅ Auth Success - UID: ${authData.localId}`);
      console.log(`   Token: ${authData.idToken.substring(0, 50)}...`);
      
      // Test 2: Firestore Read Admin Document
      console.log('');
      console.log('📄 Test 2: Firestore Read Admin Document');
      try {
        const firestoreResponse = await testFirestoreRead('admins', authData.localId);
        console.log(`   Status: ${firestoreResponse.status} ${firestoreResponse.statusText}`);
        
        if (firestoreResponse.ok) {
          const docData = await firestoreResponse.json();
          console.log(`   ✅ Firestore Read Success`);
          console.log(`   Document:`, JSON.stringify(docData, null, 2));
        } else {
          const error = await firestoreResponse.text();
          console.log(`   ❌ Firestore Read Failed: ${error}`);
        }
      } catch (error) {
        console.log(`   ❌ Firestore Read Error: ${error.message}`);
      }
      
    } else {
      const error = await authResponse.json();
      console.log(`   ❌ Auth Failed: ${JSON.stringify(error, null, 2)}`);
    }
  } catch (error) {
    console.log(`   ❌ Auth Error: ${error.message}`);
  }
  
  console.log('');
  console.log('🎯 CONCLUSION:');
  console.log('   If both tests pass ✅, the backend is working correctly.');
  console.log('   If login still fails in browser, the issue is in frontend.');
  console.log('');
  console.log('🔧 Next steps if frontend fails:');
  console.log('   1. Check browser console for errors');
  console.log('   2. Refresh browser page');
  console.log('   3. Restart development server (npm run dev)');
  console.log('   4. Clear browser cache/localStorage');
}

// Run debug
debugAuth();