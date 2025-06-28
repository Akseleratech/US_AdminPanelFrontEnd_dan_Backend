// Script to populate services to 'layanan' collection
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

// Sample Services Data for 'layanan' collection
const services = [
  {
    serviceId: 'SRV001',
    name: 'Virtual Office',
    slug: 'virtual-office',
    category: 'office',
    type: 'virtual',
    description: {
      short: 'Professional business address',
      long: 'Get a prestigious business address without the overhead costs',
      shortEn: 'Professional business address',
      longEn: 'Get a prestigious business address without the overhead costs'
    },
    metrics: {
      totalSubscribers: 150,
      activeSubscribers: 120,
      monthlySignups: 15,
      churnRate: 5.2,
      averageLifetimeValue: 2400000,
      customerSatisfactionScore: 4.3,
      netPromoterScore: 72
    },
    status: 'published',
    createdBy: 'system',
    lastModifiedBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    serviceId: 'SRV002',
    name: 'Hot Desk',
    slug: 'hot-desk',
    category: 'workspace',
    type: 'flexible',
    description: {
      short: 'Flexible desk space',
      long: 'Access to shared desk space on demand',
      shortEn: 'Flexible desk space',
      longEn: 'Access to shared desk space on demand'
    },
    metrics: {
      totalSubscribers: 300,
      activeSubscribers: 280,
      monthlySignups: 25,
      churnRate: 3.8,
      averageLifetimeValue: 1800000,
      customerSatisfactionScore: 4.5,
      netPromoterScore: 78
    },
    status: 'published',
    createdBy: 'system',
    lastModifiedBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    serviceId: 'SRV003',
    name: 'Meeting Room',
    slug: 'meeting-room',
    category: 'meeting',
    type: 'hourly',
    description: {
      short: 'Professional meeting spaces',
      long: 'Fully equipped meeting rooms for your business needs',
      shortEn: 'Professional meeting spaces',
      longEn: 'Fully equipped meeting rooms for your business needs'
    },
    metrics: {
      totalSubscribers: 80,
      activeSubscribers: 75,
      monthlySignups: 8,
      churnRate: 2.1,
      averageLifetimeValue: 3200000,
      customerSatisfactionScore: 4.7,
      netPromoterScore: 85
    },
    status: 'published',
    createdBy: 'system',
    lastModifiedBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function repopulateServices() {
  try {
    console.log('⚙️ Re-populating services to "layanan" collection...');
    
    // Clear existing services in layanan collection
    const existingServices = await db.collection('layanan').get();
    const batch = db.batch();
    
    existingServices.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    if (!existingServices.empty) {
      await batch.commit();
      console.log('🗑️ Cleared existing services from layanan collection');
    }
    
    // Add new services
    for (const service of services) {
      await db.collection('layanan').doc(service.serviceId).set(service);
      console.log(`✅ Added service: ${service.name}`);
    }
    
    // Verify
    const verify = await db.collection('layanan').get();
    console.log(`✅ Services in layanan collection: ${verify.size}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run
repopulateServices().then(() => {
  console.log('✅ Done!');
  process.exit(0);
}); 