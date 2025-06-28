// Test services endpoint
const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:5001/demo-unionspace-crm/asia-southeast1';

async function testServices() {
  console.log('🧪 Testing services endpoints...\n');
  
  // Test /services
  try {
    console.log('Testing /services...');
    const response1 = await axios.get(`${BASE_URL}/services`);
    console.log('✅ /services response:', JSON.stringify(response1.data, null, 2));
  } catch (error) {
    console.log('❌ /services error:', error.message);
  }
  
  console.log('\n');
  
  // Test /layanan  
  try {
    console.log('Testing /layanan...');
    const response2 = await axios.get(`${BASE_URL}/layanan`);
    console.log('✅ /layanan response:', JSON.stringify(response2.data, null, 2));
  } catch (error) {
    console.log('❌ /layanan error:', error.message);
  }
}

testServices(); 