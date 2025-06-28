// Simple test script for API endpoints
const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:5001/demo-unionspace-crm/asia-southeast1';

async function testEndpoint(endpoint, name) {
  try {
    const response = await axios.get(`${BASE_URL}${endpoint}`);
    
    if (response.data && response.data.success) {
      const data = response.data.data;
      
      if (data.cities) {
        console.log(`✅ ${name}: ${data.cities.length} items`);
        data.cities.slice(0, 3).forEach((item, i) => {
          console.log(`   ${i+1}. ${item.cityId} - ${item.name}`);
        });
      } else if (data.buildings) {
        console.log(`✅ ${name}: ${data.buildings.length} items`);
        data.buildings.slice(0, 3).forEach((item, i) => {
          console.log(`   ${i+1}. ${item.buildingId} - ${item.name}`);
        });
      } else if (data.layanan) {
        console.log(`✅ ${name}: ${data.layanan.length} items`);
        data.layanan.slice(0, 3).forEach((item, i) => {
          console.log(`   ${i+1}. ${item.serviceId} - ${item.name}`);
        });
      } else {
        console.log(`✅ ${name}: OK`);
      }
    } else {
      console.log(`❌ ${name}: Failed`);
    }
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('🧪 Testing all endpoints...\n');
  
  await testEndpoint('/cities', 'Cities');
  console.log('');
  
  await testEndpoint('/buildings', 'Buildings');
  console.log('');
  
  await testEndpoint('/services', 'Services');
  console.log('');
  
  console.log('🎉 All tests completed!');
}

runAllTests(); 