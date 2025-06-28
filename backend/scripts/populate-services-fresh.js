// Populate fresh services to replace deleted ones
const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:5001/demo-unionspace-crm/asia-southeast1';

const sampleServices = [
  {
    name: "Virtual Office",
    slug: "virtual-office",
    category: "office",
    type: "virtual",
    description: {
      short: "Professional business address without physical presence",
      long: "Get a prestigious business address, mail handling, and professional services without the overhead of a physical office space."
    },
    metrics: {
      averageLifetimeValue: 500000,
      conversionRate: 0.25
    },
    status: "published"
  },
  {
    name: "Hot Desk",
    slug: "hot-desk",
    category: "workspace",
    type: "flexible",
    description: {
      short: "Flexible workspace for daily use",
      long: "Access to shared workspace on a first-come-first-served basis. Perfect for freelancers and remote workers."
    },
    metrics: {
      averageLifetimeValue: 300000,
      conversionRate: 0.35
    },
    status: "published"
  },
  {
    name: "Meeting Room",
    slug: "meeting-room",
    category: "meeting",
    type: "hourly",
    description: {
      short: "Professional meeting spaces for teams",
      long: "Fully equipped meeting rooms with presentation facilities, video conferencing, and professional ambiance."
    },
    metrics: {
      averageLifetimeValue: 750000,
      conversionRate: 0.40
    },
    status: "published"
  },
  {
    name: "Private Office",
    slug: "private-office",
    category: "office",
    type: "dedicated",
    description: {
      short: "Dedicated private workspace",
      long: "Your own private office space with 24/7 access, furniture, and all amenities included."
    },
    metrics: {
      averageLifetimeValue: 1200000,
      conversionRate: 0.20
    },
    status: "published"
  },
  {
    name: "Event Space",
    slug: "event-space",
    category: "event",
    type: "rental",
    description: {
      short: "Large spaces for events and gatherings",
      long: "Spacious venues perfect for corporate events, workshops, seminars, and networking gatherings."
    },
    metrics: {
      averageLifetimeValue: 2000000,
      conversionRate: 0.15
    },
    status: "published"
  }
];

async function createService(serviceData) {
  try {
    console.log(`📤 Creating service: ${serviceData.name}...`);
    const response = await axios.post(`${BASE_URL}/services`, serviceData);
    
    if (response.data.success) {
      const service = response.data.data;
      console.log(`✅ Created: ${service.serviceId} - ${service.name}`);
      return service;
    } else {
      console.log(`❌ Failed to create ${serviceData.name}:`, response.data.error);
      return null;
    }
  } catch (error) {
    console.log(`❌ Error creating ${serviceData.name}:`, error.response?.data || error.message);
    return null;
  }
}

async function clearAllServices() {
  try {
    console.log('🧹 Clearing existing services...\n');
    const response = await axios.get(`${BASE_URL}/services`);
    const services = response.data.data?.services || [];
    
    for (const service of services) {
      try {
        await axios.delete(`${BASE_URL}/services/${service.id}`);
        console.log(`🗑️ Deleted: ${service.name}`);
      } catch (error) {
        console.log(`❌ Failed to delete ${service.name}: ${error.response?.data?.error?.message || error.message}`);
      }
    }
    
    console.log('✅ Cleanup completed\n');
  } catch (error) {
    console.log('❌ Error during cleanup:', error.response?.data || error.message);
  }
}

async function populateServices() {
  console.log('🌱 Populating fresh services...\n');
  
  // Clear existing services first
  await clearAllServices();
  
  console.log('📤 Creating new services...\n');
  const results = [];
  
  for (const serviceData of sampleServices) {
    const result = await createService(serviceData);
    if (result) {
      results.push(result);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log(`\n🎉 Successfully created ${results.length} out of ${sampleServices.length} services!`);
  
  // List final services
  console.log('\n📋 Final service list:');
  try {
    const response = await axios.get(`${BASE_URL}/services`);
    const services = response.data.data?.services || [];
    
    services.forEach((service, index) => {
      console.log(`${index + 1}. ${service.serviceId} - ${service.name}`);
      console.log(`   Status: ${service.status}`);
      console.log(`   Category: ${service.category}`);
      console.log(`   Description: ${service.description}`);
      console.log('');
    });
  } catch (error) {
    console.log('❌ Error fetching final service list:', error.message);
  }
}

populateServices(); 