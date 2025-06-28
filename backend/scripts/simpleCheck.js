// Simple database structure check
require('dotenv').config();
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase directly
const app = initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID
});

const db = getFirestore(app);

async function quickCheck() {
  try {
    console.log('🔍 Quick database check...');
    
    // Check if buildings collection exists
    const buildingsRef = db.collection('buildings');
    const snapshot = await buildingsRef.limit(1).get();
    
    if (snapshot.empty) {
      console.log('❌ Buildings collection is empty or does not exist at root level');
      
      // Try to create a document to ensure collection exists
      console.log('🔧 Creating buildings collection at root level...');
      const newDoc = await buildingsRef.add({
        name: 'Test Building',
        brand: 'UnionSpace',
        location: {
          address: 'Test Address',
          city: 'Test City',
          province: 'Test Province',
          country: 'Indonesia'
        },
        isActive: true,
        metadata: {
          createdAt: new Date(),
          version: 1
        },
        _isTest: true
      });
      
      console.log('✅ Created test building document:', newDoc.id);
      
      // Delete the test document
      await newDoc.delete();
      console.log('✅ Deleted test document');
      
    } else {
      console.log('✅ Buildings collection exists at root level');
      snapshot.forEach(doc => {
        const data = doc.data();
        console.log(`  - ${doc.id}: ${data.name || 'No name'}`);
      });
    }
    
    console.log('✅ Check complete - buildings should now be at root level');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

quickCheck(); 