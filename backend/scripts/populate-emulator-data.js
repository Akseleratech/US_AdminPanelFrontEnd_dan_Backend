// Script to populate initial data in Firebase Emulator
const admin = require('firebase-admin');

// Initialize Firebase Admin for emulator
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'demo-unionspace-crm',
    // No credentials needed for emulator
  });
}

// Connect to emulator
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8088';
const db = admin.firestore();

// Sample Cities Data
const cities = [
  {
    cityId: 'CTY001',
    name: 'Jakarta',
    province: 'DKI Jakarta',
    country: 'Indonesia',
    postalCodes: ['10110', '12160', '12950'],
    timezone: 'Asia/Jakarta',
    utcOffset: '+07:00',
    statistics: { totalSpaces: 0, activeSpaces: 0 },
    search: {
      keywords: ['jakarta', 'dki jakarta'],
      aliases: ['jkt'],
      slug: 'jakarta',
      metaTitle: 'Co-working Spaces in Jakarta',
      metaDescription: 'Find and book workspaces in Jakarta'
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system'
  },
  {
    cityId: 'CTY002',
    name: 'Bandung',
    province: 'Jawa Barat',
    country: 'Indonesia',
    postalCodes: ['40111', '40161'],
    timezone: 'Asia/Jakarta',
    utcOffset: '+07:00',
    statistics: { totalSpaces: 0, activeSpaces: 0 },
    search: {
      keywords: ['bandung', 'jawa barat'],
      aliases: ['bdg'],
      slug: 'bandung',
      metaTitle: 'Co-working Spaces in Bandung',
      metaDescription: 'Find and book workspaces in Bandung'
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system'
  },
  {
    cityId: 'CTY003',
    name: 'Surabaya',
    province: 'Jawa Timur',
    country: 'Indonesia',
    postalCodes: ['60271'],
    timezone: 'Asia/Jakarta',
    utcOffset: '+07:00',
    statistics: { totalSpaces: 0, activeSpaces: 0 },
    search: {
      keywords: ['surabaya', 'jawa timur'],
      aliases: ['sby'],
      slug: 'surabaya',
      metaTitle: 'Co-working Spaces in Surabaya',
      metaDescription: 'Find and book workspaces in Surabaya'
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'system'
  }
];

// Sample Buildings Data  
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

// Sample Services Data
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
    status: 'active',
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
    status: 'active',
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
    status: 'active',
    createdBy: 'system',
    lastModifiedBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function populateData() {
  try {
    console.log('🚀 Starting to populate emulator data...');

    // Populate Cities
    console.log('\n📍 Adding cities...');
    for (const city of cities) {
      try {
        await db.collection('cities').doc(city.cityId).set(city);
        console.log(`✅ Added city: ${city.name}`);
      } catch (error) {
        console.error(`❌ Error adding city ${city.name}:`, error);
      }
    }

    // Populate Buildings
    console.log('\n🏢 Adding buildings...');
    for (const building of buildings) {
      try {
        await db.collection('buildings').doc(building.buildingId).set(building);
        console.log(`✅ Added building: ${building.name}`);
      } catch (error) {
        console.error(`❌ Error adding building ${building.name}:`, error);
      }
    }

    // Populate Services
    console.log('\n⚙️ Adding services...');
    for (const service of services) {
      try {
        await db.collection('services').doc(service.serviceId).set(service);
        console.log(`