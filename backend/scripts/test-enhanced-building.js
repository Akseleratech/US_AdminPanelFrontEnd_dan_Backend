// Test enhanced building creation with brand field
const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:5001/demo-unionspace-crm/asia-southeast1/buildings';

async function testEnhancedBuildingCreation() {
  console.log('🧪 Testing enhanced building creation with brand...\n');
  
  // Test dengan brand field yang wajib
  const testBuilding = {
    name: "NextSpace Sudirman Tower",
    description: "Premium coworking space di jantung Jakarta",
    brand: "NextSpace", // Brand field wajib
    location: {
      address: "Jl. Jend. Sudirman No. 101",
      city: "Jakarta Pusat", 
      province: "DKI Jakarta",
      country: "Indonesia",
      postalCode: "10220",
      latitude: -6.2088,
      longitude: 106.8456
    }
  };
  
  try {
    console.log('📤 Sending request with enhanced data:');
    console.log(JSON.stringify(testBuilding, null, 2));
    
    const response = await axios.post(BASE_URL, testBuilding, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('\n✅ Success!');
    console.log('Building ID:', response.data.data.buildingId);
    console.log('Brand:', response.data.data.brand);
    console.log('City ID:', response.data.data.cityId);
    console.log('Search Keywords:', response.data.data.searchKeywords);
    console.log('Metadata:', response.data.data.metadata);
    
  } catch (error) {
    console.log('\n❌ Error occurred:');
    console.log('Status:', error.response?.status);
    console.log('Error Response:', JSON.stringify(error.response?.data, null, 2));
  }
}

// Test brand validation
async function testBrandValidation() {
  console.log('\n🧪 Testing brand validation...\n');
  
  const invalidBuilding = {
    name: "Test Building",
    brand: "InvalidBrand", // Brand tidak valid
    location: {
      address: "Test Address",
      city: "Jakarta",
      province: "DKI Jakarta"
    }
  };
  
  try {
    const response = await axios.post(BASE_URL, invalidBuilding);
    console.log('⚠️ Unexpected success for invalid brand');
  } catch (error) {
    console.log('✅ Correctly rejected invalid brand:');
    console.log('Message:', error.response?.data?.error?.message);
    console.log('Errors:', error.response?.data?.error?.errors);
  }
}

// Test auto city creation
async function testAutoCityCreation() {
  console.log('\n🧪 Testing auto city creation...\n');
  
  const buildingWithNewCity = {
    name: "CoSpace Bandung Central",
    brand: "CoSpace",
    location: {
      address: "Jl. Braga No. 123",
      city: "Bandung", // City yang mungkin belum ada di database
      province: "Jawa Barat",
      country: "Indonesia"
    }
  };
  
  try {
    const response = await axios.post(BASE_URL, buildingWithNewCity);
    console.log('✅ Building with auto-created city:');
    console.log('Building ID:', response.data.data.buildingId);
    console.log('City ID:', response.data.data.cityId);
    console.log('City will be auto-created if not exists');
    
    // Test cities endpoint to verify city was created
    const citiesResponse = await axios.get('http://127.0.0.1:5001/demo-unionspace-crm/asia-southeast1/cities');
    const cities = citiesResponse.data.data.cities || [];
    const bandungCity = cities.find(city => city.name === 'Bandung');
    
    if (bandungCity) {
      console.log('✅ City auto-created successfully:');
      console.log('City ID:', bandungCity.cityId);
      console.log('Statistics:', bandungCity.statistics);
    }
    
  } catch (error) {
    console.log('❌ Error with auto city creation:');
    console.log('Response:', JSON.stringify(error.response?.data, null, 2));
  }
}

async function runTests() {
  await testEnhancedBuildingCreation();
  await testBrandValidation();
  await testAutoCityCreation();
  
  console.log('\n🎉 All enhanced building tests completed!');
}

runTests(); 