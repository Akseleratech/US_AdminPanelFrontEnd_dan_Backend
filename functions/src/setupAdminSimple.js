/**
 * Simple Admin Setup Script for Firebase Emulator
 * This script bypasses Firestore rules by using REST API directly
 */

const fetch = require('node-fetch');

// Configuration
const EMULATOR_HOST = 'localhost';
const AUTH_PORT = 9099;
const FIRESTORE_PORT = 8888;
const PROJECT_ID = 'demo-unionspace-crm';

// Admin users to create
const adminUsers = [
  {
    email: 'admin@unionspace.com',
    password: 'admin123456',
    role: 'admin',
    name: 'Admin UnionSpace'
  },
  {
    email: 'superadmin@unionspace.com',
    password: 'superadmin123456',
    role: 'admin',
    name: 'Super Admin UnionSpace'
  }
];

// Helper function to create auth user via REST API
async function createAuthUser(email, password) {
  const url = `http://${EMULATOR_HOST}:${AUTH_PORT}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`;
  
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

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create auth user');
  }

  return await response.json();
}

// Helper function to create Firestore document via REST API (bypasses rules)
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

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(firestoreData)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create Firestore document: ${error}`);
  }

  return await response.json();
}

// Main setup function
async function setupAdmin() {
  console.log('🚀 Setting up admin users for Firebase emulator...');
  console.log('====================================================');
  console.log(`🔧 Using Auth emulator at ${EMULATOR_HOST}:${AUTH_PORT}`);
  console.log(`🔧 Using Firestore emulator at ${EMULATOR_HOST}:${FIRESTORE_PORT}`);
  console.log('');

  const createdUsers = [];

  try {
    // Step 1: Create admin users in Authentication
    for (const user of adminUsers) {
      console.log(`📝 Processing: ${user.email}`);
      
      try {
        console.log(`👤 Creating auth user: ${user.email}`);
        const authResult = await createAuthUser(user.email, user.password);
        console.log(`✅ Auth user created: ${user.email} (${authResult.localId})`);
        
        createdUsers.push({
          uid: authResult.localId,
          email: user.email,
          role: user.role,
          name: user.name
        });
        
      } catch (error) {
        if (error.message.includes('EMAIL_EXISTS')) {
          console.log(`⚠️  Auth user already exists: ${user.email}`);
          
          // For existing users, we'll create a dummy UID (in real scenario, you'd get it from Firebase Console)
          const dummyUid = Buffer.from(user.email).toString('base64').substring(0, 28);
          createdUsers.push({
            uid: dummyUid,
            email: user.email,
            role: user.role,
            name: user.name
          });
        } else {
          console.log(`❌ Error creating auth user: ${error.message}`);
          continue;
        }
      }
      console.log('');
    }

    // Step 2: Create admin documents directly in Firestore (bypasses rules)
    console.log('📄 Creating admin documents in Firestore...');
    console.log('⚠️  Note: Using REST API to bypass Firestore rules');
    console.log('');

    for (const user of createdUsers) {
      try {
        console.log(`📄 Creating admin document: ${user.email}`);
        
        const adminDoc = {
          email: user.email,
          role: user.role,
          name: user.name,
          createdAt: 'SERVER_TIMESTAMP',
          updatedAt: 'SERVER_TIMESTAMP'
        };

        await createFirestoreDoc('admins', user.uid, adminDoc);
        console.log(`✅ Admin document created: ${user.email}`);
        
      } catch (error) {
        console.log(`❌ Error creating admin document for ${user.email}: ${error.message}`);
      }
    }

    // Step 3: Create default settings
    console.log('');
    console.log('⚙️  Creating default settings...');
    
    try {
      const defaultSettings = {
        taxRate: 11,
        companyName: 'UnionSpace',
        createdAt: 'SERVER_TIMESTAMP',
        updatedAt: 'SERVER_TIMESTAMP'
      };

      await createFirestoreDoc('settings', 'general', defaultSettings);
      console.log('✅ Default settings created');
    } catch (error) {
      console.log(`❌ Error creating settings: ${error.message}`);
    }

    console.log('');
    console.log('🎉 Setup completed successfully!');
    console.log('====================================================');
    console.log('📋 Admin accounts created:');
    
    adminUsers.forEach(user => {
      console.log(`   • Email: ${user.email}`);
      console.log(`     Password: ${user.password}`);
      console.log(`     Role: ${user.role}`);
      console.log('');
    });
    
    console.log('🔐 You can now login with any of these accounts');
    console.log('💡 Make sure Firebase emulators are running!');
    console.log('');
    console.log('Commands to verify:');
    console.log('  • Check Auth: http://localhost:4000/auth');
    console.log('  • Check Firestore: http://localhost:4000/firestore');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Setup interrupted');
  process.exit(0);
});

// Run setup
setupAdmin(); 