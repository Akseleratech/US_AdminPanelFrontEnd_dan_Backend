// Quick test script to verify all API endpoints
const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:5001/demo-unionspace-crm/asia-southeast1/api';

async function testAPI(endpoint, name) {
  try {
    console.log(`\n🧪 Testing ${name}...`);
    const response = await axios.get(`${BASE_URL}${endpoint}`);
    
    if (response.data && response.data.success) {
      const data = response.data.data;
      if (data.cities) {
        console.log(`✅ Cities: ${data.cities.length} items`);
        data.cities.forEach((item, i) => console.log(`   ${i+1}. ${item.cityId} - ${item.name}`));
      } else if (data.buildings) {
        console.log(`✅ Buildings: ${data.buildings.length} items`);
        data.buildings.forEach((item, i) => console.log(`   ${i+1}. ${item.buildingId} - ${item.name}`));
      } else if (data.layanan) {
        console.log(`✅ Services: ${data.layanan.length} items`);
        data.layanan.forEach((item, i) => console.log(`   ${i+1}. ${item.serviceId} - ${item.name}`));
      } else {
        console.log(`✅ Response: ${JSON.stringify(data).substring(0, 100)}...`);
      }
    } else {
      console.log(`❌ Failed: ${response.data}`);
    }
  } catch (error) {
    console.log(`❌ Error testing ${name}:`, error.message);
  }
}

async function runTests() {
  console.log('🚀 Testing all API endpoints...\n');
  
  await testAPI('/cities', 'Cities API');
  await testAPI('/buildings', 'Buildings API');  
  await testAPI('/layanan', 'Services API');
  
  console.log('\n🎉 All tests completed!');
}

runTests(); 