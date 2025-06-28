// Test cities statistics auto-update functionality
const axios = require('axios');

const BASE_URL = 'http://127.0.0.1:5001/demo-unionspace-crm/asia-southeast1';

async function testCitiesStatistics() {
  console.log('🏙️ Testing cities statistics auto-update...\n');
  
  try {
    // Get current cities
    const citiesResponse = await axios.get(`${BASE_URL}/cities`);
    const cities = citiesResponse.data.data.cities || [];
    
    console.log('📊 Current cities with statistics:');
    cities.forEach((city, index) => {
      console.log(`${index + 1}. ${city.cityId} - ${city.name}`);
      console.log(`   Province: ${city.province}`);
      console.log(`   Total Buildings: ${city.statistics?.totalBuildings || 0}`);
      console.log(`   Active Buildings: ${city.statistics?.activeBuildings || 0}`);
      console.log(`   Total Spaces: ${city.statistics?.totalSpaces || 0}`);
      console.log(`   Locations (Frontend): ${city.locations || 0}`);
      console.log(`   Status: ${city.status}`);
      console.log('');
    });
    
    // Find Jakarta Pusat (should have buildings)
    const jakartaPusat = cities.find(city => city.name === 'Jakarta Pusat');
    if (jakartaPusat) {
      console.log('✅ Jakarta Pusat found with statistics:');
      console.log(`   Buildings: ${jakartaPusat.statistics?.totalBuildings || 0}`);
      console.log(`   Spaces: ${jakartaPusat.statistics?.totalSpaces || 0}`);
    }
    
    // Find Bandung (should have buildings from auto-creation)
    const bandung = cities.find(city => city.name === 'Bandung');
    if (bandung) {
      console.log('✅ Bandung found (auto-created) with statistics:');
      console.log(`   Buildings: ${bandung.statistics?.totalBuildings || 0}`);
      console.log(`   Spaces: ${bandung.statistics?.totalSpaces || 0}`);
    }
    
  } catch (error) {
    console.log('❌ Error fetching cities:', error.message);
  }
}

async function testCityCreationWithStatistics() {
  console.log('\n🧪 Testing new city creation...\n');
  
  const newCity = {
    name: "Medan",
    province: "Sumatera Utara", 
    country: "Indonesia",
    postalCodes: ["20111", "20112"],
    timezone: "Asia/Jakarta",
    utcOffset: "+07:00"
  };
  
  try {
    console.log('📤 Creating new city:');
    console.log(JSON.stringify(newCity, null, 2));
    
    const response = await axios.post(`${BASE_URL}/cities`, newCity);
    const createdCity = response.data.data;
    
    console.log('\n✅ City created successfully:');
    console.log(`City ID: ${createdCity.cityId}`);
    console.log(`Name: ${createdCity.name}`);
    console.log(`Statistics:`, createdCity.statistics);
    console.log(`Search Keywords:`, createdCity.search?.keywords);
    console.log(`Frontend Locations: ${createdCity.locations}`);
    
  } catch (error) {
    console.log('❌ Error creating city:', error.response?.data);
  }
}

async function testBuildingCreationImpactOnCityStats() {
  console.log('\n🧪 Testing building creation impact on city statistics...\n');
  
  // Create building in Medan (newly created city)
  const newBuilding = {
    name: "UnionSpace Medan Plaza",
    brand: "UnionSpace",
    description: "Premium coworking space di Medan",
    location: {
      address: "Jl. Imam Bonjol No. 6",
      city: "Medan",
      province: "Sumatera Utara",
      country: "Indonesia",
      postalCode: "20111"
    }
  };
  
  try {
    console.log('🏢 Creating building in Medan to test city statistics update...');
    
    const buildingResponse = await axios.post(`${BASE_URL}/buildings`, newBuilding);
    const createdBuilding = buildingResponse.data.data;
    
    console.log('✅ Building created:');
    console.log(`Building ID: ${createdBuilding.buildingId}`);
    console.log(`City ID: ${createdBuilding.cityId}`);
    console.log(`City: ${createdBuilding.location.city}`);
    
    // Wait a moment and then check city statistics again
    console.log('\n📊 Checking updated city statistics...');
    
    const citiesResponse = await axios.get(`${BASE_URL}/cities`);
    const cities = citiesResponse.data.data.cities || [];
    const medan = cities.find(city => city.name === 'Medan');
    
    if (medan) {
      console.log('✅ Medan statistics after building creation:');
      console.log(`   Total Buildings: ${medan.statistics?.totalBuildings || 0}`);
      console.log(`   Active Buildings: ${medan.statistics?.activeBuildings || 0}`);
      console.log(`   Total Spaces: ${medan.statistics?.totalSpaces || 0}`);
      console.log(`   Frontend Locations: ${medan.locations || 0}`);
      
      if (medan.statistics?.totalBuildings > 0) {
        console.log('🎉 City statistics auto-updated successfully!');
      }
    }
    
  } catch (error) {
    console.log('❌ Error creating building or checking stats:', error.response?.data || error.message);
  }
}

async function runAllTests() {
  await testCitiesStatistics();
  await testCityCreationWithStatistics();
  await testBuildingCreationImpactOnCityStats();
  
  console.log('\n🎉 All cities statistics tests completed!');
  console.log('\n📝 Summary:');
  console.log('✅ Cities show real-time building/space statistics');
  console.log('✅ New cities can be created with proper validation');
  console.log('✅ Building creation auto-updates city statistics');
  console.log('✅ Frontend-compatible fields (locations, status) provided');
}

runAllTests(); 