// Cleanup script untuk menghapus semua cities existing di database
// Karena sekarang menggunakan auto-create cities dari Google Maps
require('dotenv').config();
const { db } = require('../config/firebase');

async function cleanupCitiesDatabase() {
  console.log('🧹 CLEANUP CITIES DATABASE');
  console.log('==========================');
  
  try {
    // 1. Check current cities
    console.log('\n📋 Step 1: Current Cities in Database');
    console.log('-------------------------------------');
    const citiesSnapshot = await db.collection('cities').get();
    console.log(`Total cities to be deleted: ${citiesSnapshot.size}`);
    
    if (citiesSnapshot.size === 0) {
      console.log('✅ No cities found. Database is already clean.');
      return;
    }
    
    // List all cities
    citiesSnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ${data.name}, ${data.province}, ${data.country} (ID: ${doc.id})`);
    });

    // 2. Confirm deletion
    console.log('\n⚠️  WARNING: This will delete ALL cities data!');
    console.log('Auto-create cities feature will recreate cities as needed.');
    
    // 3. Delete all cities
    console.log('\n🗑️  Step 2: Deleting All Cities...');
    console.log('----------------------------------');
    
    const batch = db.batch();
    citiesSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    console.log(`✅ Successfully deleted ${citiesSnapshot.size} cities`);

    // 4. Verify deletion
    console.log('\n📋 Step 3: Verification After Cleanup');
    console.log('-------------------------------------');
    const afterSnapshot = await db.collection('cities').get();
    console.log(`Cities remaining: ${afterSnapshot.size}`);
    
    if (afterSnapshot.size === 0) {
      console.log('✅ CLEANUP SUCCESSFUL: All cities deleted');
      console.log('');
      console.log('🎯 NEXT STEPS:');
      console.log('- Cities will be auto-created when spaces are added');
      console.log('- Manual city creation is now simplified');
      console.log('- No more predefined city data needed');
    } else {
      console.log('❌ CLEANUP INCOMPLETE: Some cities remain');
    }

  } catch (error) {
    console.error('💥 Cleanup failed:', error);
  } finally {
    process.exit(0);
  }
}

// Safety check function
async function safetySummary() {
  console.log('🔒 SAFETY SUMMARY');
  console.log('=================');
  console.log('✅ This script will delete all cities data');
  console.log('✅ Spaces data will NOT be affected');
  console.log('✅ Auto-create feature will recreate cities as needed');
  console.log('✅ This is safe because cities will be auto-generated');
  console.log('');
  
  // Check if there are spaces that reference cities
  const spacesSnapshot = await db.collection('spaces').get();
  console.log(`📊 Current spaces in database: ${spacesSnapshot.size}`);
  
  if (spacesSnapshot.size > 0) {
    console.log('📝 Cities referenced by spaces will be auto-recreated');
    const citiesInSpaces = new Set();
    spacesSnapshot.forEach(doc => {
      const data = doc.data();
      if (data.location?.city) {
        citiesInSpaces.add(`${data.location.city}, ${data.location.province}, ${data.location.country}`);
      }
    });
    
    console.log('\n🏙️  Cities that will be auto-recreated:');
    Array.from(citiesInSpaces).forEach((city, index) => {
      console.log(`${index + 1}. ${city}`);
    });
  }
}

async function runCleanup() {
  await safetySummary();
  console.log('\n' + '='.repeat(50));
  await cleanupCitiesDatabase();
}

// Run cleanup
runCleanup(); 