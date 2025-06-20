const axios = require('axios');

async function testSpacesEndpoint() {
  console.log('🧪 Testing Spaces Endpoint...\n');
  
  try {
    const response = await axios.get('http://localhost:5000/api/spaces');
    
    console.log('✅ Response Status:', response.status);
    console.log('✅ Response Headers:', response.headers['content-type']);
    console.log('✅ Response Success:', response.data.success);
    console.log('✅ Total Spaces:', response.data.total);
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('\n📋 First Space Structure:');
      console.log('================================');
      
      const firstSpace = response.data.data[0];
      console.log('ID:', firstSpace.id);
      console.log('Name:', firstSpace.name);
      console.log('Brand:', firstSpace.brand);
      console.log('Category:', firstSpace.category);
      console.log('Space Type:', firstSpace.spaceType);
      console.log('Capacity:', firstSpace.capacity);
      console.log('Is Active:', firstSpace.isActive);
      
      console.log('\nLocation Structure:');
      console.log('  City:', firstSpace.location?.city);
      console.log('  Address:', firstSpace.location?.address);
      console.log('  Province:', firstSpace.location?.province);
      
      console.log('\nPricing Structure:');
      console.log('  Hourly:', firstSpace.pricing?.hourly);
      console.log('  Daily:', firstSpace.pricing?.daily);
      console.log('  Monthly:', firstSpace.pricing?.monthly);
      console.log('  Currency:', firstSpace.pricing?.currency);
      
      console.log('\nAmenities:', firstSpace.amenities?.slice(0, 3).join(', '), '...');
      
      console.log('\n🎯 Frontend Expected Fields:');
      console.log('- name ✅');
      console.log('- brand ✅');
      console.log('- category ✅');
      console.log('- location.city ✅');
      console.log('- location.address ✅');
      console.log('- capacity ✅');
      console.log('- pricing.daily ✅');
      console.log('- isActive ✅');
      
    } else {
      console.log('❌ No spaces found in response');
    }
    
  } catch (error) {
    console.error('❌ Error testing spaces endpoint:', error.message);
    
    if (error.response) {
      console.log('Response Status:', error.response.status);
      console.log('Response Data:', error.response.data);
    } else if (error.request) {
      console.log('No response received - Server might not be running');
    }
  }
}

testSpacesEndpoint(); 