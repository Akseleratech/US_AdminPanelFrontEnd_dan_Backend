// Initialize basic amenities in the database
require('dotenv').config();
const { db } = require('../config/firebase');

const basicAmenities = [
  // Technology
  { name: 'WiFi', description: 'High-speed wireless internet access', category: 'technology', type: 'common', icon: 'wifi' },
  { name: 'Projector', description: 'HD projector for presentations', category: 'technology', type: 'common', icon: 'projector' },
  { name: 'TV Screen', description: 'Large display screen', category: 'technology', type: 'common', icon: 'tv' },
  { name: 'Sound System', description: 'Audio system with microphones', category: 'technology', type: 'premium', icon: 'speaker' },
  { name: 'Video Conferencing', description: 'Professional video conference setup', category: 'technology', type: 'premium', icon: 'video' },
  { name: 'Printer', description: 'Multifunction printer and scanner', category: 'technology', type: 'common', icon: 'printer' },

  // Furniture
  { name: 'Whiteboard', description: 'Large whiteboard with markers', category: 'furniture', type: 'common', icon: 'board' },
  { name: 'Flipchart', description: 'Portable flipchart stand', category: 'furniture', type: 'common', icon: 'chart' },
  { name: 'Ergonomic Chairs', description: 'Comfortable ergonomic seating', category: 'furniture', type: 'premium', icon: 'chair' },
  { name: 'Standing Desk', description: 'Adjustable height desk', category: 'furniture', type: 'premium', icon: 'desk' },

  // Facilities
  { name: 'AC', description: 'Air conditioning system', category: 'facilities', type: 'common', icon: 'ac' },
  { name: 'Kitchen', description: 'Fully equipped kitchen', category: 'facilities', type: 'premium', icon: 'kitchen' },
  { name: 'Coffee Machine', description: 'Professional coffee machine', category: 'facilities', type: 'common', icon: 'coffee' },
  { name: 'Refrigerator', description: 'Mini refrigerator', category: 'facilities', type: 'common', icon: 'fridge' },
  { name: 'Microwave', description: 'Microwave oven', category: 'facilities', type: 'common', icon: 'microwave' },
  { name: 'Water Dispenser', description: 'Hot and cold water dispenser', category: 'facilities', type: 'common', icon: 'water' },

  // Services
  { name: 'Receptionist', description: '24/7 reception service', category: 'services', type: 'premium', icon: 'reception' },
  { name: 'Cleaning Service', description: 'Daily cleaning service', category: 'services', type: 'common', icon: 'clean' },
  { name: 'IT Support', description: 'Technical support available', category: 'services', type: 'premium', icon: 'support' },
  { name: 'Mail Handling', description: 'Mail and package handling', category: 'services', type: 'premium', icon: 'mail' },

  // Safety & Security
  { name: 'Security', description: '24/7 security monitoring', category: 'safety', type: 'common', icon: 'security' },
  { name: 'CCTV', description: 'Security camera monitoring', category: 'safety', type: 'common', icon: 'camera' },
  { name: 'Access Control', description: 'Keycard access system', category: 'safety', type: 'premium', icon: 'access' },
  { name: 'Fire Safety', description: 'Fire extinguisher and alarm system', category: 'safety', type: 'common', icon: 'fire' },

  // General
  { name: 'Parking', description: 'Dedicated parking space', category: 'general', type: 'common', icon: 'parking' },
  { name: 'Lounge Area', description: 'Comfortable lounge space', category: 'general', type: 'premium', icon: 'lounge' },
  { name: 'Garden', description: 'Outdoor garden or terrace', category: 'general', type: 'premium', icon: 'garden' },
  { name: 'Phone Booth', description: 'Private phone booth for calls', category: 'general', type: 'premium', icon: 'phone' },
  { name: 'Storage', description: 'Storage lockers available', category: 'general', type: 'common', icon: 'storage' },
  { name: 'Natural Light', description: 'Abundant natural lighting', category: 'general', type: 'common', icon: 'light' }
];

async function initializeAmenities() {
  try {
    console.log('Starting amenities initialization...');

    // Check if amenities collection exists and has data
    const existingSnapshot = await db.collection('amenities').get();
    
    if (!existingSnapshot.empty) {
      console.log(`Found ${existingSnapshot.size} existing amenities. Skipping initialization.`);
      console.log('If you want to reset amenities, delete the collection first.');
      return;
    }

    console.log('Amenities collection is empty. Initializing with basic amenities...');

    // Add amenities in batches
    const batch = db.batch();
    let batchCount = 0;
    const maxBatchSize = 500; // Firestore batch limit

    for (const amenity of basicAmenities) {
      if (batchCount >= maxBatchSize) {
        await batch.commit();
        console.log(`Committed batch of ${batchCount} amenities`);
        batchCount = 0;
      }

      const amenityData = {
        ...amenity,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system'
      };

      const docRef = db.collection('amenities').doc();
      batch.set(docRef, amenityData);
      batchCount++;
    }

    // Commit remaining items
    if (batchCount > 0) {
      await batch.commit();
      console.log(`Committed final batch of ${batchCount} amenities`);
    }

    console.log(`✅ Successfully initialized ${basicAmenities.length} amenities`);
    
    // Verify the data
    const verifySnapshot = await db.collection('amenities').get();
    console.log(`✅ Verification: ${verifySnapshot.size} amenities now in database`);

    // Show breakdown by category
    const categories = {};
    verifySnapshot.forEach(doc => {
      const data = doc.data();
      categories[data.category] = (categories[data.category] || 0) + 1;
    });

    console.log('\nAmenities by category:');
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`  ${category}: ${count} amenities`);
    });

  } catch (error) {
    console.error('Error initializing amenities:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  initializeAmenities()
    .then(() => {
      console.log('\n🎉 Amenities initialization completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Amenities initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeAmenities }; 