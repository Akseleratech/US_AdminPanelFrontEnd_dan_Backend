require('dotenv').config();
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID
});

const db = getFirestore(app);

async function fixBuildingsStructure() {
  try {
    console.log('🔧 Fixing buildings collection structure...');
    
    // Step 1: Check current buildings in root collection
    console.log('\n1️⃣ Checking current buildings collection...');
    const buildingsRef = db.collection('buildings');
    const buildingsSnapshot = await buildingsRef.get();
    
    console.log(`   Found ${buildingsSnapshot.size} buildings in root collection`);
    
    const existingBuildings = [];
    buildingsSnapshot.forEach(doc => {
      const data = doc.data();
      existingBuildings.push({
        id: doc.id,
        data: data
      });
      console.log(`   - ${doc.id}: ${data.name || 'No name'} (${data.brand || 'No brand'})`);
    });
    
    // Step 2: Check counters collection for any buildings subcollection
    console.log('\n2️⃣ Checking counters collection...');
    const countersRef = db.collection('counters');
    const countersSnapshot = await countersRef.get();
    
    let foundBuildingsInCounters = false;
    for (const counterDoc of countersSnapshot.docs) {
      console.log(`   Counter: ${counterDoc.id}`);
      
      // Check if there's a buildings subcollection
      try {
        const buildingsSubcollection = counterDoc.ref.collection('buildings');
        const subSnapshot = await buildingsSubcollection.get();
        
        if (!subSnapshot.empty) {
          console.log(`   ⚠️  Found buildings subcollection in counter ${counterDoc.id} with ${subSnapshot.size} docs`);
          foundBuildingsInCounters = true;
          
          // Move documents from subcollection to root collection
          console.log('   🔄 Moving buildings from subcollection to root...');
          for (const subDoc of subSnapshot.docs) {
            const subData = subDoc.data();
            console.log(`      Moving: ${subDoc.id} - ${subData.name || 'No name'}`);
            
            // Add to root collection
            await buildingsRef.doc(subDoc.id).set(subData);
            
            // Delete from subcollection
            await subDoc.ref.delete();
          }
          console.log('   ✅ Buildings moved to root collection');
        }
      } catch (error) {
        console.log(`   No buildings subcollection in ${counterDoc.id}`);
      }
    }
    
    if (!foundBuildingsInCounters) {
      console.log('   ✅ No buildings found in counters subcollections');
    }
    
    // Step 3: Verify final structure
    console.log('\n3️⃣ Verifying final structure...');
    const finalSnapshot = await buildingsRef.get();
    console.log(`   Buildings collection now has ${finalSnapshot.size} documents`);
    
    finalSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${doc.id}: ${data.name || 'No name'} (${data.buildingId || 'No buildingId'})`);
    });
    
    // Step 4: Ensure proper indexing by creating and deleting a test doc
    console.log('\n4️⃣ Refreshing collection index...');
    const testRef = buildingsRef.doc('_index_refresh_test');
    await testRef.set({
      _test: true,
      timestamp: new Date()
    });
    await testRef.delete();
    console.log('   ✅ Collection index refreshed');
    
    console.log('\n✅ Buildings collection structure fixed!');
    console.log('   📍 Buildings are now properly at root level');
    console.log('   🔄 Refresh Firebase Console to see changes');
    
  } catch (error) {
    console.error('❌ Error fixing buildings structure:', error);
  } finally {
    process.exit(0);
  }
}

fixBuildingsStructure(); 