// Script to populate initial data in Firebase Emulator - Clean Version
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

// Sample Buildings Data - Fixed structure
const buildings = [
  {
    buildingId: 'BLD001',
    name: 'Plaza Indonesia',
    brand: 'Premium Office', 
    description: 'Premium office building in central Jakarta',
    location: {
      address: 'Jl. MH Thamrin Kav. 28-30, Jakarta Pusat',
      city: 'Jakarta',
      province: 'DKI Jakarta',
      country: 'Indonesia',
      postalCode: '10350',
      coordinates: { lat: -6.1944, lng: 106.8229 }
    },
    facilities: ['24/7 Security', 'Parking', 'Elevator', 'AC'],
    totalFloors: 46,
    totalSpaces: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    buildingId: 'BLD002', 
    name: 'Gedung Sate Building',
    brand: 'Heritage Office',
    description: 'Historic office building in Bandung',
    location: {
      address: 'Jl. Diponegoro No.22, Bandung',
      city: 'Bandung',
      province: 'Jawa Barat', 
      country: 'Indonesia',
      postalCode: '40115',
      coordinates: { lat: -6.9018, lng: 107.6186 }
    },
    facilities: ['Historic Building', 'Security', 'Parking'],
    totalFloors: 4,
    totalSpaces: 0,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function repopulateBuildings() {
  try {
    console.log('🏢 Re-populating buildings with correct structure...');
    
    // Clear existing buildings
    const existingBuildings = await db.collection('buildings').get();
    const batch = db.batch();
    
    existingBuildings.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    if (!existingBuildings.empty) {
      await batch.commit();
      console.log('🗑️ Cleared existing buildings');
    }
    
    // Add new buildings
    for (const building of buildings) {
      await db.collection('buildings').doc(building.buildingId).set(building);
      console.log(`✅ Added building: ${building.name}`);
    }
    
    // Verify
    const verify = await db.collection('buildings').get();
    console.log(`✅ Buildings in database: ${verify.size}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run
repopulateBuildings().then(() => {
  console.log('✅ Done!');
  process.exit(0);
}); 