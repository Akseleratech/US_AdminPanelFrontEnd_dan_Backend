/**
 * Simplest Admin Setup - Directly use UIDs from creation response
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
    console.log('Firestore Error Response:', error);
    throw new Error(`Failed to create Firestore document: ${error}`);
  }

  return await response.json();
}

// Helper function to delete Firestore document (for cleanup)
async function deleteFirestoreDoc(collection, docId) {
  const url = `http://${EMULATOR_HOST}:${FIRESTORE_PORT}/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`;
  
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  return response.ok;
}

// Main setup function
async function setupAdminSimplest() {
  console.log('🚀 Setting up admin users (SIMPLEST VERSION)...');
  console.log('===============================================');
  console.log(`🔧 Auth: ${EMULATOR_HOST}:${AUTH_PORT}`);
  console.log(`🔧 Firestore: ${EMULATOR_HOST}:${FIRESTORE_PORT}`);
  console.log('');

  const adminUsersWithUIDs = [];

  try {
    // Step 1: Create/Get Auth users and collect UIDs
    console.log('👤 Processing Auth users...');
    
    for (const user of adminUsers) {
      console.log(`📝 Processing: ${user.email}`);
      
      try {
        // Try to create the user
        const authResult = await createAuthUser(user.email, user.password);
        console.log(`✅ Auth user created: ${user.email}`);
        console.log(`   UID: ${authResult.localId}`);
        
        adminUsersWithUIDs.push({
          uid: authResult.localId,
          email: user.email,
          role: user.role,
          name: user.name
        });
        
      } catch (error) {
        if (error.message.includes('EMAIL_EXISTS')) {
          console.log(`⚠️  User already exists: ${user.email}`);
          console.log(`   Please provide the UID manually or delete the user first`);
          
          // For now, let's use a known UID if it's one of the specific users
          let knownUID = null;
          if (user.email === 'admin@unionspace.com') {
            knownUID = 'Lg68MWXhzjDtnsMYUuJWNQNuiGYj'; // From your output
          } else if (user.email === 'superadmin@unionspace.com') {
            knownUID = '8VdhTpUsICObc2bXYnhBvESgqehA'; // From your output
          }
          
          if (knownUID) {
            console.log(`   Using known UID: ${knownUID}`);
            adminUsersWithUIDs.push({
              uid: knownUID,
              email: user.email,
              role: user.role,
              name: user.name
            });
          }
        } else {
          console.log(`❌ Error with ${user.email}: ${error.message}`);
        }
      }
      console.log('');
    }

    // Step 2: Create admin documents in Firestore
    console.log('📄 Creating admin documents in Firestore...');
    console.log('   Note: Attempting to bypass Firestore rules...');
    console.log('');
    
    for (const user of adminUsersWithUIDs) {
      try {
        console.log(`📄 Creating admin doc: ${user.email} (${user.uid})`);
        
        const adminDoc = {
          email: user.email,
          role: user.role,
          name: user.name,
          createdAt: 'SERVER_TIMESTAMP',
          updatedAt: 'SERVER_TIMESTAMP'
        };

        await createFirestoreDoc('admins', user.uid, adminDoc);
        console.log(`✅ Admin document created successfully`);
        
      } catch (error) {
        console.log(`❌ Firestore error for ${user.email}:`);
        console.log(`   ${error.message}`);
        
        // If Firestore rules are blocking, we'll need to disable rules temporarily
        if (error.message.includes('PERMISSION_DENIED')) {
          console.log(`   💡 SOLUTION: Temporarily disable Firestore rules!`);
          console.log(`   In firebase.json, set: "rules": "firestore-open.rules"`);
          console.log(`   Or restart emulator with --rules= (empty rules)`);
        }
      }
    }

    // Step 3: Summary
    console.log('');
    console.log('📋 SUMMARY:');
    console.log('===========');
    
    if (adminUsersWithUIDs.length > 0) {
      console.log('✅ Users with UIDs collected:');
      adminUsersWithUIDs.forEach(user => {
        console.log(`   • ${user.email}`);
        console.log(`     UID: ${user.uid}`);
        console.log(`     Role: ${user.role}`);
        console.log('');
      });
      
      console.log('🔐 Login credentials:');
      adminUsers.forEach(user => {
        console.log(`   • Email: ${user.email}`);
        console.log(`     Password: ${user.password}`);
      });
      console.log('');
    }
    
    console.log('🛠️  Next steps if login still fails:');
    console.log('   1. Check Firestore rules (might need to disable temporarily)');
    console.log('   2. Verify admin documents exist in Firestore UI');
    console.log('   3. Check browser console for auth errors');
    console.log('');
    console.log('🔍 Verification URLs:');
    console.log('   • Auth: http://localhost:4000/auth');
    console.log('   • Firestore: http://localhost:4000/firestore');

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
setupAdminSimplest();