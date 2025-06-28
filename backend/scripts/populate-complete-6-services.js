// Script to populate complete 6 services (SVC001-SVC006)
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

// Complete 6 Services Data (SVC001-SVC006)
const services = [
  {
    serviceId: 'SVC001',
    name: 'Virtual Office',
    slug: 'virtual-office',
    category: 'office',
    type: 'virtual',
    description: {
      short: 'Alamat bisnis prestisuis tanpa perlu sewa kantor fisik',
      long: 'Alamat bisnis prestisuis tanpa perlu sewa kantor fisik',
      shortEn: 'Professional business address without physical office rental',
      longEn: 'Professional business address without physical office rental'
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
    createdBy: 'frontend_user',
    lastModifiedBy: 'api',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    serviceId: 'SVC002',
    name: 'Hot Desk',
    slug: 'hot-desk',
    category: 'workspace',
    type: 'flexible',
    description: {
      short: 'Meja kerja fleksibel yang bisa digunakan kapan saja',
      long: 'Meja kerja fleksibel yang bisa digunakan kapan saja',
      shortEn: 'Flexible desk space available anytime',
      longEn: 'Flexible desk space available anytime'
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
    createdBy: 'frontend_user',
    lastModifiedBy: 'api',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    serviceId: 'SVC003',
    name: 'Meeting Room',
    slug: 'meeting-room',
    category: 'meeting',
    type: 'hourly',
    description: {
      short: 'Ruang meeting profesional untuk berbagai kebutuhan',
      long: 'Ruang meeting profesional untuk berbagai kebutuhan',
      shortEn: 'Professional meeting rooms for various needs',
      longEn: 'Professional meeting rooms for various needs'
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
    createdBy: 'frontend_user',
    lastModifiedBy: 'api',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    serviceId: 'SVC004',
    name: 'Private Office',
    slug: 'private-office',
    category: 'office',
    type: 'dedicated',
    description: {
      short: 'Kantor pribadi untuk tim yang membutuhkan privasi',
      long: 'Kantor pribadi untuk tim yang membutuhkan privasi',
      shortEn: 'Private office for teams needing privacy',
      longEn: 'Private office for teams needing privacy'
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
    createdBy: 'frontend_user',
    lastModifiedBy: 'api',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    serviceId: 'SVC005',
    name: 'Event Space',
    slug: 'event-space',
    category: 'event',
    type: 'rental',
    description: {
      short: 'Ruang acara untuk workshop dan seminar',
      long: 'Ruang acara untuk workshop dan seminar',
      shortEn: 'Event space for workshops and seminars',
      longEn: 'Event space for workshops and seminars'
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
    createdBy: 'frontend_user',
    lastModifiedBy: 'api',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    serviceId: 'SVC006',
    name: 'Phone Booth',
    slug: 'phone-booth',
    category: 'communication',
    type: 'hourly',
    description: {
      short: 'Bilik telepon pribadi untuk panggilan penting',
      long: 'Bilik telepon pribadi untuk panggilan penting',
      shortEn: 'Private phone booth for important calls',
      longEn: 'Private phone booth for important calls'
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
    createdBy: 'frontend_user',
    lastModifiedBy: 'api',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function populateComplete6Services() {
  try {
    console.log('🧹 Clearing existing layanan collection...');
    
    // Clear all existing services first
    const existingServices = await db.collection('layanan').get();
    const batch = db.batch();
    
    existingServices.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    if (!existingServices.empty) {
      await batch.commit();
      console.log(`🗑️ Cleared ${existingServices.size} existing services`);
    }
    
    console.log('📦 Adding complete 6 services (SVC001-SVC006)...');
    
    // Add all 6 services
    for (const service of services) {
      await db.collection('layanan').doc(service.serviceId).set(service);
      console.log(`✅ Added: ${service.serviceId} - ${service.name}`);
    }
    
    // Verify final count
    const finalServices = await db.collection('layanan').get();
    console.log(`\n🎉 Complete! Total services: ${finalServices.size}`);
    
    // List all services
    console.log('\n📋 Services in database:');
    finalServices.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. ${doc.id} - ${data.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run
populateComplete6Services().then(() => {
  console.log('\n✅ Done populating complete 6 services!');
  process.exit(0);
}); 