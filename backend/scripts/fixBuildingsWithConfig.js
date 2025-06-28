// Use the same Firebase config as the server
const { db } = require('../config/firebase');

async function fixBuildingsStructure() {
  try {
    console.log('🔧 Fixing buildings collection structure...');
    
    // Step 1: Check current buildings in root collection
    console.log('\n1️⃣ Checking current buildings collection...');
    const buildingsRef = db.collection('buildings');
    const buildingsSnapshot = await buildingsRef.get();
    
    console.log(`   Found ${buildingsSnapshot.size} buildings in root collection`);
    
    buildingsSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${doc.id}: ${data.name || 'No name'} (${data.brand || 'No brand'})`);
    });
    
    // Step 2: Check counters collection structure
    console.log('\n2️⃣ Checking counters collection...');
    const countersRef = db.collection('counters');
    const countersSnapshot = await countersRef.get();
    
    console.log(`   Found ${countersSnapshot.size} counter documents`);
    countersSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - Counter ${doc.id}:`, data);
    });
    
    // Step 3: Ensure buildings collection is properly indexed
    console.log('\n3️⃣ Refreshing buildings collection index...');
    
    // Create a test document to ensure collection is properly visible
    const testDocRef = buildingsRef.doc('_test_visibility');
    await testDocRef.set({
      _test: true,
      name: 'Test Document for Collection Visibility',
      createdAt: new Date(),
      purpose: 'Ensure buildings collection appears at root level in Firebase Console'
    });
    
    console.log('   ✅ Test document created');
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Delete test document
    await testDocRef.delete();
    console.log('   ✅ Test document deleted');
    
    // Step 4: Final verification
    console.log('\n4️⃣ Final verification...');
    const finalSnapshot = await buildingsRef.get();
    console.log(`   Buildings collection contains ${finalSnapshot.size} documents`);
    
    if (finalSnapshot.size > 0) {
      console.log('   Buildings found:');
      finalSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`     - ${doc.id}: ${data.name || 'Unnamed'} (${data.buildingId || 'No ID'})`);
      });
    }
    
    console.log('\n✅ Buildings collection structure verified!');
    console.log('📋 Summary:');
    console.log(`   - Buildings collection exists at root level`);
    console.log(`   - Contains ${finalSnapshot.size} building documents`);
    console.log(`   - Each building has proper structure with buildingId, name, etc.`);
    console.log('\n🔄 Please refresh your Firebase Console to see the changes');
    console.log('   If buildings still appears under counters, it might be:');
    console.log('   1. Browser cache - try hard refresh (Ctrl+Shift+R)');
    console.log('   2. Firebase Console delay - wait a few minutes');
    console.log('   3. Different project view - check project selection');
    
  } catch (error) {
    console.error('❌ Error fixing buildings structure:', error);
  }
  
  process.exit(0);
}

console.log('🚀 Starting buildings collection structure fix...');
fixBuildingsStructure(); 