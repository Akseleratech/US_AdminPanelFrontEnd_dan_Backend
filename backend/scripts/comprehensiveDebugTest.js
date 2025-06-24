// Comprehensive Debug Test for Auto-Create Cities Feature
require('dotenv').config({ path: '../.env' });

const { db } = require('../config/firebase');

// Test data
const testSpaceData = {
  name: "CoWork Malang Premium",
  description: "Modern co-working space in the heart of Malang",
  brand: "CoSpace",
  category: "co-working",
  spaceType: "open-space",
  capacity: 50,
  location: {
    address: "Jl. Ijen Boulevard No. 123, Malang",
    city: "Malang",
    province: "Jawa Timur",
    country: "Indonesia",
    latitude: -7.9666,
    longitude: 112.6326,
    postalCode: "65119"
  },
  pricing: {
    hourly: 25000,
    daily: 150000,
    monthly: 2500000,
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

async function testFindOrCreateCity(locationData) {
  console.log('\n🧪 Testing findOrCreateCity function directly...');
  console.log('📍 Input data:', JSON.stringify(locationData, null, 2));
  
  try {
    // Import the function directly from spaces.js
    const spacesModule = require('../routes/spaces');
    
    // Since the function is not exported, we'll test it via API endpoint
    console.log('⚠️  Function is not exported, testing via API call instead...');
    
    const axios = require('axios');
    const response = await axios.post('http://localhost:3001/api/spaces', testSpaceData);
    
    console.log('✅ API Response:', response.data);
    return response.data;
    
  } catch (error) {
    console.error('❌ Error testing findOrCreateCity:', error.message);
    return null;
  }
}

async function testSpaceCreationAPI() {
  console.log('\n🚀 Testing Space Creation via API...');
  
  try {
    const axios = require('axios');
    const response = await axios.post('http://localhost:3001/api/spaces', testSpaceData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Space created successfully!');
    console.log('📄 Response:', JSON.stringify(response.data, null, 2));
    
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

async function directDatabaseTest() {
  console.log('\n🔧 Testing direct database city creation...');
  
  const cityData = {
    cityId: `CTY_TEST_${Date.now()}`,
    name: "Malang",
    province: "Jawa Timur",
    country: "Indonesia",
    postalCodes: ["65119"],
    timezone: 'Asia/Jakarta',
    utcOffset: '+07:00',
    statistics: {
      totalSpaces: 0,
      activeSpaces: 0
    },
    search: {
      keywords: ["malang", "jawa timur"],
      aliases: [],
      slug: "malang",
      metaTitle: "Co-working Spaces in Malang",
      metaDescription: "Find and book workspaces in Malang, Jawa Timur"
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'direct_test'
  };
  
  try {
    await db.collection('cities').doc(cityData.cityId).set(cityData);
    console.log('✅ Direct city creation successful!');
    console.log('🆔 Created city ID:', cityData.cityId);
    
    // Verify it was created
    const doc = await db.collection('cities').doc(cityData.cityId).get();
    if (doc.exists) {
      console.log('✅ Verification: City exists in database');
      console.log('📄 City data:', JSON.stringify(doc.data(), null, 2));
    } else {
      console.log('❌ Verification failed: City not found in database');
    }
    
    return cityData.cityId;
    
  } catch (error) {
    console.error('❌ Direct city creation failed:', error);
    return null;
  }
}

async function checkExistingCity() {
  console.log('\n🔍 Checking if Malang city already exists...');
  
  try {
    const snapshot = await db.collection('cities')
      .where('name', '==', 'Malang')
      .where('province', '==', 'Jawa Timur')
      .where('country', '==', 'Indonesia')
      .get();
    
    if (!snapshot.empty) {
      console.log('✅ City already exists:');
      snapshot.forEach(doc => {
        console.log(`   - ID: ${doc.id}`);
        console.log(`   - Data:`, JSON.stringify(doc.data(), null, 2));
      });
      return true;
    } else {
      console.log('❌ City does not exist yet');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error checking existing city:', error);
    return null;
  }
}

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete test spaces
    const spacesSnapshot = await db.collection('spaces')
      .where('name', '==', 'CoWork Malang Premium')
      .get();
    
    const spaceDeletions = [];
    spacesSnapshot.forEach(doc => {
      spaceDeletions.push(doc.ref.delete());
    });
    
    if (spaceDeletions.length > 0) {
      await Promise.all(spaceDeletions);
      console.log(`✅ Deleted ${spaceDeletions.length} test spaces`);
    }
    
    // Delete test cities
    const citiesSnapshot = await db.collection('cities')
      .where('createdBy', '==', 'direct_test')
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

async function runComprehensiveTest() {
  console.log('🔄 Starting Comprehensive Auto-Create Cities Debug Test');
  console.log('=' * 60);
  
  try {
    // Step 1: Count initial cities
    console.log('\n📊 STEP 1: Initial city count');
    const initialCount = await countCities();
    
    // Step 2: Check if test city exists
    console.log('\n🔍 STEP 2: Check existing city');
    const cityExists = await checkExistingCity();
    
    // Step 3: Test direct database city creation
    console.log('\n🔧 STEP 3: Direct database test');
    const directTestId = await directDatabaseTest();
    
    // Step 4: Count cities after direct test
    console.log('\n📊 STEP 4: City count after direct test');
    const afterDirectCount = await countCities();
    
    // Step 5: Test space creation API (should trigger auto-create)
    console.log('\n🚀 STEP 5: Space creation API test');
    const spaceResult = await testSpaceCreationAPI();
    
    // Step 6: Final city count
    console.log('\n📊 STEP 6: Final city count');
    const finalCount = await countCities();
    
    // Step 7: Analysis
    console.log('\n📋 STEP 7: Analysis');
    console.log('=' * 40);
    console.log(`Initial cities: ${initialCount}`);
    console.log(`After direct test: ${afterDirectCount}`);
    console.log(`Final cities: ${finalCount}`);
    console.log(`City already existed: ${cityExists ? 'YES' : 'NO'}`);
    console.log(`Direct DB test successful: ${directTestId ? 'YES' : 'NO'}`);
    console.log(`Space creation successful: ${spaceResult ? 'YES' : 'NO'}`);
    
    if (spaceResult && spaceResult.message) {
      console.log(`Space creation message: "${spaceResult.message}"`);
    }
    
    // Expected vs Actual
    const expectedIncrease = cityExists ? 0 : 1;
    const actualIncrease = finalCount - initialCount;
    
    console.log(`Expected city increase: ${expectedIncrease}`);
    console.log(`Actual city increase: ${actualIncrease}`);
    
    if (actualIncrease === expectedIncrease) {
      console.log('✅ AUTO-CREATE CITIES FEATURE WORKING CORRECTLY!');
    } else {
      console.log('❌ AUTO-CREATE CITIES FEATURE HAS ISSUES!');
    }
    
    // Step 8: Cleanup
    setTimeout(async () => {
      await cleanupTestData();
      process.exit(0);
    }, 2000);
    
  } catch (error) {
    console.error('❌ Comprehensive test failed:', error);
    process.exit(1);
  }
}

// Run the test
runComprehensiveTest(); 