/**
 * Setup Admin Script for Firebase Emulator
 * 
 * This script creates the first admin user in the Firebase emulator.
 * Run this after starting the Firebase emulator to have an admin account ready.
 * 
 * Usage:
 * node src/setupAdmin.js
 */

const admin = require("firebase-admin");

// Initialize Firebase Admin SDK for emulator
const initializeForEmulator = () => {
  // Set emulator environment variables first
  process.env.FIRESTORE_EMULATOR_HOST = "127.0.0.1:8888";
  process.env.FIREBASE_AUTH_EMULATOR_HOST = "127.0.0.1:9099";
  
  // Set Google Application Credentials to bypass credential requirement for emulator
  process.env.GOOGLE_APPLICATION_CREDENTIALS = "";
  
  if (!admin.apps.length) {
    // Initialize with mock credentials for emulator
    const mockCredential = {
      getAccessToken: () => Promise.resolve({ access_token: 'mock-token', expires_in: 3600 })
    };
    
    admin.initializeApp({
      projectId: "demo-unionspace-crm",
      credential: {
        getAccessToken: () => Promise.resolve({ access_token: 'mock-token', expires_in: 3600 })
      }
    });
  }
  
  console.log("🔧 Connected to Firebase emulators");
  console.log("   - Firestore: 127.0.0.1:8888");
  console.log("   - Auth: 127.0.0.1:9099");
  
  return admin.firestore();
};

// Admin user configuration
const ADMIN_USERS = [
  {
    uid: "admin-001",
    email: "admin@unionspace.com",
    password: "admin123456",
    displayName: "System Administrator",
    role: "admin"
  },
  {
    uid: "superadmin-001", 
    email: "superadmin@unionspace.com",
    password: "superadmin123456",
    displayName: "Super Administrator",
    role: "admin"
  }
];

// Create admin user in Firebase Auth
const createAuthUser = async (userData) => {
  try {
    console.log(`\n👤 Creating auth user: ${userData.email}`);
    
    const userRecord = await admin.auth().createUser({
      uid: userData.uid,
      email: userData.email,
      password: userData.password,
      displayName: userData.displayName,
      emailVerified: true
    });
    
    console.log(`✅ Auth user created: ${userRecord.email} (${userRecord.uid})`);
    return userRecord;
    
  } catch (error) {
    if (error.code === 'auth/uid-already-exists') {
      console.log(`⚠️  Auth user already exists: ${userData.email}`);
      return await admin.auth().getUser(userData.uid);
    } else {
      throw error;
    }
  }
};

// Create admin document in Firestore
const createAdminDocument = async (db, userData) => {
  try {
    console.log(`📄 Creating admin document: ${userData.email}`);
    
    const adminData = {
      uid: userData.uid,
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role,
      permissions: [
        'users:read',
        'users:write', 
        'orders:read',
        'orders:write',
        'spaces:read',
        'spaces:write',
        'buildings:read',
        'buildings:write',
        'cities:read',
        'cities:write',
        'services:read', 
        'services:write',
        'admin:manage'
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      lastLoginAt: null
    };
    
    await db.collection('admins').doc(userData.uid).set(adminData);
    console.log(`✅ Admin document created: ${userData.email}`);
    
  } catch (error) {
    console.error(`❌ Error creating admin document for ${userData.email}:`, error);
    throw error;
  }
};

// Initialize settings collection with default values
const initializeSettings = async (db) => {
  try {
    console.log('\n⚙️  Initializing settings...');
    
    const settingsData = {
      taxRate: 0.11, // 11% PPN Indonesia
      currency: 'IDR',
      timezone: 'Asia/Jakarta',
      companyInfo: {
        name: 'UnionSpace CRM',
        address: 'Jakarta, Indonesia',
        phone: '+62-XXX-XXX-XXXX',
        email: 'info@unionspace.com'
      },
      features: {
        invoiceGeneration: true,
        emailNotifications: true,
        smsNotifications: false,
        autoOrderStatusUpdate: true
      },
      updatedAt: new Date(),
      updatedBy: 'system'
    };
    
    await db.collection('settings').doc('global').set(settingsData);
    console.log('✅ Settings initialized');
    
  } catch (error) {
    console.error('❌ Error initializing settings:', error);
    throw error;
  }
};

// Main setup function
const setupAdminUsers = async () => {
  try {
    console.log('🚀 Setting up admin users for Firebase emulator...');
    console.log('====================================================');
    
    const db = initializeForEmulator();
    
    // Create admin users
    for (const userData of ADMIN_USERS) {
      console.log(`\n📝 Processing: ${userData.email}`);
      
      // Create auth user
      await createAuthUser(userData);
      
      // Create admin document
      await createAdminDocument(db, userData);
    }
    
    // Initialize settings
    await initializeSettings(db);
    
    console.log('\n====================================================');
    console.log('✅ Admin setup completed successfully!');
    console.log('\n📝 Admin accounts created:');
    
    ADMIN_USERS.forEach(user => {
      console.log(`   • Email: ${user.email}`);
      console.log(`     Password: ${user.password}`);
      console.log(`     Role: ${user.role}`);
      console.log('');
    });
    
    console.log('🔒 IMPORTANT: Change these passwords in production!');
    console.log('💡 You can now login to the admin panel with these credentials.');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  }
};

// Check if running directly (not imported)
if (require.main === module) {
  setupAdminUsers()
    .then(() => {
      console.log('\n🎉 Setup complete. You can now start using the admin panel.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupAdminUsers, ADMIN_USERS }; 