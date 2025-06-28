// Script to add 3 more services to make total 6
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

// Additional Services Data (3 more)
const additionalServices = [
  {
    serviceId: 'SRV004',
    name: 'Private Office',
    slug: 'private-office',
    category: 'office',
    type: 'dedicated',
    description: {
      short: 'Dedicated private office space',
      long: 'Fully private office space for teams and businesses who need privacy and security',
      shortEn: 'Dedicated private office space',
      longEn: 'Fully private office space for teams and businesses who need privacy and security'
    },
    metrics: {
      totalSubscribers: 120,
      activeSubscribers: 110,
      monthlySignups: 10,
      churnRate: 2.5,
      averageLifetimeValue: 4800000,
      customerSatisfactionScore: 4.8,
      netPromoterScore: 88
    },
    status: 'published',
    createdBy: 'system',
    lastModifiedBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    serviceId: 'SRV005',
    name: 'Event Space',
    slug: 'event-space',
    category: 'event',
    type: 'rental',
    description: {
      short: 'Large event and conference space',
      long: 'Spacious venue for workshops, seminars, product launches and corporate events',
      shortEn: 'Large event and conference space',
      longEn: 'Spacious venue for workshops, seminars, product launches and corporate events'
    },
    metrics: {
      totalSubscribers: 45,
      activeSubscribers: 42,
      monthlySignups: 4,
      churnRate: 1.8,
      averageLifetimeValue: 7200000,
      customerSatisfactionScore: 4.9,
      netPromoterScore: 92
    },
    status: 'published',
    createdBy: 'system',
    lastModifiedBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    serviceId: 'SRV006',
    name: 'Phone Booth',
    slug: 'phone-booth',
    category: 'communication',
    type: 'hourly',
    description: {
      short: 'Private phone booth for calls',
      long: 'Soundproof phone booth for private calls and video conferences',
      shortEn: 'Private phone booth for calls',
      longEn: 'Soundproof phone booth for private calls and video conferences'
    },
    metrics: {
      totalSubscribers: 180,
      activeSubscribers: 165,
      monthlySignups: 20,
      churnRate: 4.1,
      averageLifetimeValue: 960000,
      customerSatisfactionScore: 4.4,
      netPromoterScore: 74
    },
    status: 'published',
    createdBy: 'system',
    lastModifiedBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function addMoreServices() {
  try {
    console.log('⚙️ Adding 3 more services to reach total of 6...');
    
    // Check current count
    const currentServices = await db.collection('layanan').get();
    console.log(`📊 Current services: ${currentServices.size}`);
    
    // Add new services
    for (const service of additionalServices) {
      await db.collection('layanan').doc(service.serviceId).set(service);
      console.log(`✅ Added service: ${service.name}`);
    }
    
    // Verify final count
    const finalServices = await db.collection('layanan').get();
    console.log(`📊 Final services count: ${finalServices.size}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run
addMoreServices().then(() => {
  console.log('✅ Done adding more services!');
  process.exit(0);
}); 