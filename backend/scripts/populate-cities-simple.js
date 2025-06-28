// Simple script to populate cities
const admin = require('firebase-admin');

// Initialize Firebase Admin for emulator
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'demo-unionspace-crm',
  });
}

// Connect to emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8088';
const db = admin.firestore();

const cities = [
  {
    cityId: 'CIT001',
    name: 'Jakarta',
    code: 'JKT',
    province: 'DKI Jakarta',
    coordinates: {
      lat: -6.200000,
      lng: 106.816666
    },
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    cityId: 'CIT002', 
    name: 'Bandung',
    code: 'BDG',
    province: 'Jawa Barat',
    coordinates: {
      lat: -6.917464,
      lng: 107.619123
    },
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    cityId: 'CIT003',
    name: 'Surabaya', 
    code: 'SBY',
    province: 'Jawa Timur',
    coordinates: {
      lat: -7.250445,
      lng: 112.768845
    },
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function populateCities() {
  try {
    console.log('🧹 Clearing existing cities...');
    
    // Clear existing cities
    const existingCities = await db.collection('cities').get();
    const batch = db.batch();
    
    existingCities.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    if (!existingCities.empty) {
      await batch.commit();
      console.log(`🗑️ Cleared ${existingCities.size} existing cities`);
    }
    
    console.log('📦 Adding 3 cities...');
    
    // Add cities
    for (const city of cities) {
      await db.collection('cities').doc(city.cityId).set(city);
      console.log(`✅ Added: ${city.cityId} - ${city.name}`);
    }
    
    // Verify
    const finalCities = await db.collection('cities').get();
    console.log(`\n🎉 Complete! Total cities: ${finalCities.size}`);
    
    finalCities.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ${doc.id} - ${data.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

populateCities().then(() => {
  console.log('\n✅ Done!');
  process.exit(0);
}); 