// Load environment variables
require('dotenv').config();

const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const initializeFirebase = () => {
  if (!admin.apps.length) {
    // Check if we have project ID
    const projectId = process.env.FIREBASE_PROJECT_ID;
    
    if (!projectId) {
      throw new Error('FIREBASE_PROJECT_ID is not set in environment variables');
    }

    console.log(`🔧 Initializing Firebase for project: ${projectId}`);

    // For development, use mock service account if real credentials are not available
    const serviceAccount = {
      type: "service_account",
      project_id: projectId,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "mock_key_id",
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n') || generateMockPrivateKey(),
      client_email: process.env.FIREBASE_CLIENT_EMAIL || `firebase-adminsdk-mock@${projectId}.iam.gserviceaccount.com`,
      client_id: process.env.FIREBASE_CLIENT_ID || "mock_client_id",
      auth_uri: process.env.FIREBASE_AUTH_URI || "https://accounts.google.com/o/oauth2/auth",
      token_uri: process.env.FIREBASE_TOKEN_URI || "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL || "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL || `https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-mock%40${projectId}.iam.gserviceaccount.com`,
    };

    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: `https://${projectId}-default-rtdb.firebaseio.com`
      });
      
      console.log('✅ Firebase Admin SDK initialized successfully');
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error.message);
      throw error;
    }
  }
  
  return admin;
};

// Generate mock private key for development
function generateMockPrivateKey() {
  return "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC4f4D9VnwJ5fzX\n...\n-----END PRIVATE KEY-----";
}

// Initialize and export Firebase services
const firebaseAdmin = initializeFirebase();
const db = firebaseAdmin.firestore();
const auth = firebaseAdmin.auth();

module.exports = {
  admin: firebaseAdmin,
  db,
  auth
}; 