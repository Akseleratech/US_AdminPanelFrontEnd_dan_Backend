// Final Comprehensive Test for Auto-Create Cities Feature
require('dotenv').config({ path: '../.env' });

const { db } = require('../config/firebase');
const axios = require('axios');

// Test data for space creation
const testSpaceData = {
  name: "Bali Workspace Premium",
  description: "Modern co-working space in the heart of Ubud",
  brand: "CoSpace",
  category: "Private Office",
  spaceType: "open-space",
  capacity: 25,
  location: {
    address: "Jl. Raya Ubud No. 88, Ubud",
    city: "Ubud",
    province: "Bali",
    country: "Indonesia",
    latitude: -8.5069,
    longitude: 115.2625,
    postalCode: "80571"
  },
  pricing: {
    hourly: 35000,
    daily: 200000,
    monthly: 3500000,
    currency: "IDR"
  },
  amenities: ["wifi", "coffee", "parking"],
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

async function checkCityExists(cityName, province) {
  try {
    const snapshot = await db.collection('cities')
      .where('name', '==', cityName)
      .where('province', '==', province)
      .get();
    
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking city existence:', error);
    return false;
  }
}

async function testSpaceCreationWithDebugLogs() {
  console.log('\n🚀 Testing Space Creation with detailed logs...');
  
  try {
    const response = await axios.post('http://localhost:3001/api/spaces', testSpaceData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Space created successfully!');
    console.log('📄 Response status:', response.status);
    console.log('📄 Response message:', response.data.message);
    
    // Log the important parts of the response
    if (response.data.data) {
      const space = response.data.data;
      console.log('🏢 Created space details:');
      console.log(`   - Name: ${space.name}`);
      console.log(`   - ID: ${space.spaceId}`);
      console.log(`   - City: ${space.location.city}`);
      console.log(`   - Province: ${space.location.province}`);
    }
    
    return response.data;
    
  } catch (error) {
    console.error('❌ Error creating space via API:');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
    
    return null;
  }
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete test spaces
    const spacesSnapshot = await db.collection('spaces')
      .where('name', '==', 'Bali Workspace Premium')
      .get();
    
    const spaceDeletions = [];
    spacesSnapshot.forEach(doc => {
      spaceDeletions.push(doc.ref.delete());
    });
    
    if (spaceDeletions.length > 0) {
      await Promise.all(spaceDeletions);
      console.log(`✅ Deleted ${spaceDeletions.length} test spaces`);
    }
    
    // Delete test cities (Ubud, Bali)
    const citiesSnapshot = await db.collection('cities')
      .where('name', '==', 'Ubud')
      .where('province', '==', 'Bali')
      .get();
    
    const cityDeletions = [];
    citiesSnapshot.forEach(doc => {
      cityDeletions.push(doc.ref.delete());
    });
    
    if (cityDeletions.length > 0) {
      await Promise.all(cityDeletions);
      console.log(`✅ Deleted ${cityDeletions.length} test cities`);
    }
    
    console.log('✅ Cleanup completed');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

async function runFinalTest() {
  console.log('🎯 Final Comprehensive Test for Auto-Create Cities Feature');
  console.log('='.repeat(60));
  
  try {
    // Step 1: Count initial cities
    console.log('\n📊 STEP 1: Initial city count');
    const initialCount = await countCities();
    
    // Step 2: Check if test city already exists
    console.log('\n🔍 STEP 2: Check if test city exists');
    const cityExists = await checkCityExists('Ubud', 'Bali');
    console.log(`City "Ubud, Bali" exists: ${cityExists ? 'YES' : 'NO'}`);
    
    // Step 3: Create space through API (should trigger auto-create city)
    console.log('\n🚀 STEP 3: Create space via API');
    const spaceResult = await testSpaceCreationWithDebugLogs();
    
    // Step 4: Wait a moment for async operations
    console.log('\n⏱️  STEP 4: Waiting for async operations...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 5: Count cities after space creation
    console.log('\n📊 STEP 5: Final city count');
    const finalCount = await countCities();
    
    // Step 6: Check if test city was created
    console.log('\n🔍 STEP 6: Check if test city was created');
    const cityCreated = await checkCityExists('Ubud', 'Bali');
    console.log(`City "Ubud, Bali" exists after space creation: ${cityCreated ? 'YES' : 'NO'}`);
    
    // Step 7: Analysis
    console.log('\n📋 STEP 7: Final Analysis');
    console.log('='.repeat(40));
    console.log(`Initial cities: ${initialCount}`);
    console.log(`Final cities: ${finalCount}`);
    console.log(`City existed before: ${cityExists ? 'YES' : 'NO'}`);
    console.log(`City exists after: ${cityCreated ? 'YES' : 'NO'}`);
    console.log(`Space creation successful: ${spaceResult ? 'YES' : 'NO'}`);
    
    if (spaceResult && spaceResult.message) {
      console.log(`Space creation message: "${spaceResult.message}"`);
      
      // Check if message contains city creation info
      if (spaceResult.message.includes('New city') || spaceResult.message.includes('created automatically')) {
        console.log('✅ Message indicates new city was created!');
      } else if (spaceResult.message.includes('already exists')) {
        console.log('ℹ️  Message indicates city already existed');
      } else {
        console.log('⚠️  Message does not mention city creation');
      }
    }
    
    // Expected vs Actual
    const expectedIncrease = cityExists ? 0 : 1;
    const actualIncrease = finalCount - initialCount;
    
    console.log(`Expected city increase: ${expectedIncrease}`);
    console.log(`Actual city increase: ${actualIncrease}`);
    
    // Final verdict
    if (spaceResult) { // Space was created successfully
      if (cityExists) {
        // City already existed, should find existing one
        if (actualIncrease === 0 && cityCreated) {
          console.log('✅ AUTO-CREATE CITIES FEATURE WORKING CORRECTLY!');
          console.log('   (Found and used existing city)');
        } else {
          console.log('❌ ISSUE: Expected to use existing city but behavior is unexpected');
        }
      } else {
        // City didn't exist, should create new one
        if (actualIncrease === 1 && cityCreated) {
          console.log('✅ AUTO-CREATE CITIES FEATURE WORKING CORRECTLY!');
          console.log('   (Created new city as expected)');
        } else {
          console.log('❌ AUTO-CREATE CITIES FEATURE HAS ISSUES!');
          console.log('   (Failed to create new city)');
        }
      }
    } else {
      console.log('❌ SPACE CREATION FAILED - Cannot test auto-create cities');
    }
    
    // Step 8: Cleanup
    setTimeout(async () => {
      await cleanupTestData();
      process.exit(0);
    }, 2000);
    
  } catch (error) {
    console.error('❌ Final test failed:', error);
    process.exit(1);
  }
}

// Run the test
runFinalTest(); 