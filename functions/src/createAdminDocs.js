/**
 * Manual Admin Document Creator
 */

const fetch = require('node-fetch');

// Configuration
const EMULATOR_HOST = 'localhost';
const FIRESTORE_PORT = 8888;
const PROJECT_ID = 'demo-unionspace-crm';

// Known UIDs from your output
const adminUsers = [
  {
    uid: 'Lg68MWXhzjDtnsMYUuJWNQNuiGYj',
    email: 'admin@unionspace.com',
    role: 'admin',
    name: 'Admin UnionSpace'
  },
  {
    uid: '8VdhTpUsICObc2bXYnhBvESgqehA',
    email: 'superadmin@unionspace.com',
    role: 'admin',
    name: 'Super Admin UnionSpace'
  }
];

// Helper function to create Firestore document
async function createFirestoreDoc(collection, docId, data) {
  const url = `http://${EMULATOR_HOST}:${FIRESTORE_PORT}/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}?documentId=${docId}`;
  
  // Convert data to Firestore format
  const firestoreData = {
    fields: {}
  };

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      firestoreData.fields[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      firestoreData.fields[key] = { integerValue: value.toString() };
    } else if (typeof value === 'boolean') {
      firestoreData.fields[key] = { booleanValue: value };
    } else if (value instanceof Date) {
      firestoreData.fields[key] = { timestampValue: value.toISOString() };
    } else if (value === 'SERVER_TIMESTAMP') {
      firestoreData.fields[key] = { timestampValue: new Date().toISOString() };
    }
  }

  console.log(`🔗 Creating document at: ${url}`);
  console.log(`📄 Document data:`, JSON.stringify(firestoreData, null, 2));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(firestoreData)
  });

  console.log(`📡 Response status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const error = await response.text();
    console.log('❌ Response error:', error);
    throw new Error(`Failed to create Firestore document: ${error}`);
  }

  const result = await response.json();
  console.log(`✅ Document created successfully`);
  return result;
}

// Main function
async function createAdminDocs() {
  console.log('🚀 Creating Admin Documents Manually...');
  console.log('=====================================');
  console.log(`🔧 Firestore: ${EMULATOR_HOST}:${FIRESTORE_PORT}`);
  console.log('');

  for (const user of adminUsers) {
    try {
      console.log(`👤 Creating admin document for: ${user.email}`);
      console.log(`   UID: ${user.uid}`);
      
      const adminDoc = {
        email: user.email,
        role: user.role,
        name: user.name,
        createdAt: 'SERVER_TIMESTAMP',
        updatedAt: 'SERVER_TIMESTAMP'
      };

      await createFirestoreDoc('admins', user.uid, adminDoc);
      console.log(`✅ SUCCESS: Admin document created for ${user.email}`);
      
    } catch (error) {
      console.log(`❌ ERROR: Failed to create admin document for ${user.email}`);
      console.log(`   Error: ${error.message}`);
    }
    console.log('');
  }

  console.log('🎉 Admin document creation completed!');
  console.log('');
  console.log('🔍 Verification:');
  console.log('   • Check: http://localhost:4000/firestore');
  console.log('   • Look for collection: admins');
  console.log('   • Should contain 2 documents with UIDs as document IDs');
  console.log('');
  console.log('🔐 Now try logging in with:');
  console.log('   • Email: admin@unionspace.com');
  console.log('   • Password: admin123456');
}

// Run the script
createAdminDocs();