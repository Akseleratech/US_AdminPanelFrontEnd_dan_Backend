// Debug script for building creation
const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:5001/demo-unionspace-crm/asia-southeast1/buildings';

async function testBuildingCreation() {
  console.log('🧪 Testing building creation...\n');
  
  // Test data sesuai dengan yang biasanya dikirim frontend
  const testBuilding = {
    name: "Debug Test Building",
    description: "Test building untuk debug",
    location: {
      address: "Jl. Test No. 123",
      city: "Jakarta", 
      province: "DKI Jakarta",
      country: "Indonesia",
      coordinates: {
        lat: -6.200000,
        lng: 106.816666
      }
    }
  };
  
  try {
    console.log('📤 Sending request with data:');
    console.log(JSON.stringify(testBuilding, null, 2));
    
    const response = await axios.post(BASE_URL, testBuilding, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n✅ Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('\n❌ Error occurred:');
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    console.log('Error Response:', JSON.stringify(error.response?.data, null, 2));
    console.log('Error Message:', error.message);
    
    // Additional error details
    if (error.response?.data) {
      console.log('\nError Details:');
      console.log('- Success:', error.response.data.success);
      console.log('- Error Code:', error.response.data.error?.code);
      console.log('- Error Message:', error.response.data.error?.message);
    }
  }
}

// Test with minimal data
async function testMinimalBuilding() {
  console.log('\n🧪 Testing with minimal data...\n');
  
  const minimalBuilding = {
    name: "Minimal Building",
    location: {
      address: "Minimal Address"
    }
  };
  
  try {
    console.log('📤 Sending minimal request:');
    console.log(JSON.stringify(minimalBuilding, null, 2));
    
    const response = await axios.post(BASE_URL, minimalBuilding);
    console.log('\n✅ Minimal Success!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('\n❌ Minimal Error:');
    console.log('Response:', JSON.stringify(error.response?.data, null, 2));
  }
}

async function runTests() {
  await testBuildingCreation();
  await testMinimalBuilding();
}

runTests(); 