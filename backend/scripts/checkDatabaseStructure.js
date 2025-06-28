const { db } = require('../config/firebase');

async function checkDatabaseStructure() {
  try {
    console.log('🔍 Checking database structure...');
    
    // List all root collections
    console.log('\n📋 All root collections:');
    const collections = await db.listCollections();
    collections.forEach(collection => {
      console.log('  -', collection.id);
    });
    
    // Check buildings collection specifically
    console.log('\n📁 Buildings collection:');
    const buildingsRef = db.collection('buildings');
    const buildingsSnapshot = await buildingsRef.get();
    console.log('  - Document count:', buildingsSnapshot.size);
    
    if (!buildingsSnapshot.empty) {
      buildingsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`  - ${doc.id}: ${data.name || 'No name'} (${data.brand || 'No brand'})`);
      });
    }
    
    // Check counters collection
    console.log('\n📁 Counters collection:');
    const countersRef = db.collection('counters');
    const countersSnapshot = await countersRef.get();
    console.log('  - Document count:', countersSnapshot.size);
    
    if (!countersSnapshot.empty) {
      countersSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`  - ${doc.id}:`, data);
      });
    }
    
    // Check if there's any buildings subcollection under counters
    console.log('\n🔍 Checking for buildings subcollection under counters...');
    const counterDocs = await countersRef.get();
    for (const counterDoc of counterDocs.docs) {
      try {
        const subcollections = await counterDoc.ref.listCollections();
        if (subcollections.length > 0) {
          console.log(`  - Counter ${counterDoc.id} has subcollections:`, subcollections.map(sc => sc.id));
        }
      } catch (error) {
        console.log(`  - Cannot list subcollections for ${counterDoc.id}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking database structure:', error);
  }
}

async function fixBuildingsCollection() {
  try {
    console.log('\n🔧 Ensuring buildings collection exists at root level...');
    
    // Create a test document to ensure the collection exists
    const testBuildingRef = db.collection('buildings').doc('_test_structure');
    await testBuildingRef.set({
      _test: true,
      createdAt: new Date(),
      purpose: 'Ensure buildings collection exists at root level'
    });
    
    console.log('✅ Test document created in buildings collection');
    
    // Delete the test document
    await testBuildingRef.delete();
    console.log('✅ Test document deleted');
    
    console.log('✅ Buildings collection structure verified');
    
  } catch (error) {
    console.error('❌ Error fixing buildings collection:', error);
  }
}

// Run the checks
async function main() {
  await checkDatabaseStructure();
  await fixBuildingsCollection();
  console.log('\n✅ Database structure check complete');
  process.exit(0);
}

main().catch(console.error); 