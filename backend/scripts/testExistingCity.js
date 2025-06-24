// Test for Existing City in Auto-Create Cities Feature
require('dotenv').config({ path: '../.env' });

const { db } = require('../config/firebase');
const axios = require('axios');

// Test data using existing city (Sleman)
const testSpaceData = {
  name: "Sleman Business Hub",
  description: "Premium business hub in Sleman",
  brand: "UnionSpace",
  category: "Private Office",
  spaceType: "private-room",
  capacity: 15,
  location: {
    address: "Jl. Kaliurang KM 5, Sleman",
    city: "Sleman",
    province: "DI Yogyakarta",
    country: "Indonesia",
    latitude: -7.7326,
    longitude: 110.3467,
    postalCode: "55281"
  },
  pricing: {
    hourly: 50000,
    daily: 300000,
    monthly: 6000000,
    currency: "IDR"
  },
  amenities: ["wifi", "meeting-room", "parking"],
  isActive: true
};

async function countCities() {
  try {
    const snapshot = await db.collection('cities').get();
    console.log(`📊 Total cities in database: ${snapshot.size}`);
    
    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`   - ${data.name}, ${data.province} (ID: ${doc.id})`);
    });
    
    return snapshot.size;
  } catch (error) {
    console.error('Error counting cities:', error);
    return -1;
  }
}

async function testExistingCityScenario() {
  console.log('🔄 Testing Auto-Create Cities with EXISTING City');
  console.log('='.repeat(50));
  
  try {
    // Step 1: Count initial cities
    console.log('\n📊 STEP 1: Initial city count');
    const initialCount = await countCities();
    
    // Step 2: Create space in existing city (Sleman)
    console.log('\n🚀 STEP 2: Create space in existing city (Sleman)');
    const response = await axios.post('http://localhost:3001/api/spaces', testSpaceData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Space created successfully!');
    console.log('📄 Response message:', response.data.message);
    
    // Step 3: Wait for async operations
    console.log('\n⏱️  STEP 3: Waiting for async operations...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 4: Count cities after space creation
    console.log('\n📊 STEP 4: Final city count');
    const finalCount = await countCities();
    
    // Step 5: Analysis
    console.log('\n📋 STEP 5: Analysis');
    console.log('='.repeat(30));
    console.log(`Initial cities: ${initialCount}`);
    console.log(`Final cities: ${finalCount}`);
    console.log(`Space creation message: "${response.data.message}"`);
    
    const actualIncrease = finalCount - initialCount;
    console.log(`City increase: ${actualIncrease} (expected: 0 for existing city)`);
    
    // Check if message indicates existing city was found
    if (response.data.message.includes('already exists')) {
      console.log('✅ Message correctly indicates city already exists!');
    } else if (response.data.message.includes('New city') || response.data.message.includes('created automatically')) {
      console.log('❌ Message incorrectly indicates new city was created!');
    } else {
      console.log('⚠️  Message does not mention city creation status');
    }
    
    if (actualIncrease === 0) {
      console.log('✅ EXISTING CITY DETECTION WORKING CORRECTLY!');
    } else {
      console.log('❌ ISSUE: Expected no new cities but count increased!');
    }
    
    // Step 6: Cleanup test space
    console.log('\n🧹 STEP 6: Cleanup test space');
    const spacesSnapshot = await db.collection('spaces')
      .where('name', '==', 'Sleman Business Hub')
      .get();
    
    const spaceDeletions = [];
    spacesSnapshot.forEach(doc => {
      spaceDeletions.push(doc.ref.delete());
    });
    
    if (spaceDeletions.length > 0) {
      await Promise.all(spaceDeletions);
      console.log(`✅ Deleted ${spaceDeletions.length} test spaces`);
    }
    
    console.log('✅ Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testExistingCityScenario(); 