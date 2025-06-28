// Direct Function Test for findOrCreateCity
require('dotenv').config({ path: '../.env' });

const { db } = require('../config/firebase');

// Copy the findOrCreateCity function from spaces.js
async function findOrCreateCity(locationData) {
  try {
    console.log('🏙️  findOrCreateCity: Function called with data:', JSON.stringify(locationData, null, 2));
    
    const { city, province, country } = locationData;
    
    console.log('🏙️  findOrCreateCity: Extracted values - city:', city, 'province:', province, 'country:', country);
    
    if (!city || !province || !country) {
      const errorMsg = `Missing required fields: city=${city}, province=${province}, country=${country}`;
      console.error('❌ findOrCreateCity: Validation failed -', errorMsg);
      throw new Error('City, province, and country are required to create/find city');
    }

    // First, try to find existing city
    const existingCitySnapshot = await db.collection('cities')
      .where('name', '==', city)
      .where('province', '==', province)
      .where('country', '==', country)
      .limit(1)
      .get();

    if (!existingCitySnapshot.empty) {
      // City exists, return the existing city data
      const existingCityDoc = existingCitySnapshot.docs[0];
      console.log(`✅ Found existing city: ${city}, ${province}, ${country}`);
      return {
        id: existingCityDoc.id,
        ...existingCityDoc.data(),
        existed: true
      };
    }

    // City doesn't exist, create new one
    console.log(`🆕 Creating new city: ${city}, ${province}, ${country}`);
    
    const cityId = `CTY${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newCityData = {
      cityId,
      name: city,
      province,
      country,
      postalCodes: locationData.postalCode ? [locationData.postalCode] : [],
      timezone: 'Asia/Jakarta', // Default timezone - can be enhanced later
      utcOffset: '+07:00',
      statistics: {
        totalSpaces: 0,
        activeSpaces: 0
      },
      search: {
        keywords: [city.toLowerCase(), province.toLowerCase()],
        aliases: [],
        slug: city.toLowerCase().replace(/\s+/g, '-'),
        metaTitle: `Co-working Spaces in ${city}`,
        metaDescription: `Find and book workspaces in ${city}, ${province}`
      },
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'direct_function_test'
    };

    // Save to database
    await db.collection('cities').doc(cityId).set(newCityData);

    console.log(`✅ Successfully created new city: ${cityId}`);
    
    return {
      id: cityId,
      ...newCityData,
      existed: false
    };
  } catch (error) {
    console.error('Error in findOrCreateCity:', error);
    // Don't throw error, just log warning and continue
    console.warn(`⚠️  Could not create/find city for: ${locationData.city}, continuing with space creation`);
    return null;
  }
}

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

async function cleanupTestData() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    // Delete test cities
    const citiesSnapshot = await db.collection('cities')
      .where('createdBy', '==', 'direct_function_test')
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

async function runDirectFunctionTest() {
  console.log('🧪 Starting Direct Function Test for findOrCreateCity');
  console.log('='.repeat(50));
  
  try {
    // Step 1: Count initial cities
    console.log('\n📊 STEP 1: Initial city count');
    const initialCount = await countCities();
    
    // Step 2: Test findOrCreateCity with new city (Denpasar)
    console.log('\n🧪 STEP 2: Testing findOrCreateCity with NEW city');
    const newCityLocation = {
      city: "Denpasar",
      province: "Bali", 
      country: "Indonesia",
      postalCode: "80119"
    };
    
    const newCityResult = await findOrCreateCity(newCityLocation);
    console.log('🔍 New city result:', newCityResult);
    
    // Step 3: Count cities after new city creation
    console.log('\n📊 STEP 3: City count after new city test');
    const afterNewCount = await countCities();
    
    // Step 4: Test findOrCreateCity with existing city (Denpasar again)
    console.log('\n🧪 STEP 4: Testing findOrCreateCity with EXISTING city');
    const existingCityResult = await findOrCreateCity(newCityLocation);
    console.log('🔍 Existing city result:', existingCityResult);
    
    // Step 5: Final count (should be same as step 3)
    console.log('\n📊 STEP 5: Final city count');
    const finalCount = await countCities();
    
    // Step 6: Analysis
    console.log('\n📋 STEP 6: Analysis');
    console.log('='.repeat(30));
    console.log(`Initial cities: ${initialCount}`);
    console.log(`After new city: ${afterNewCount}`);
    console.log(`Final cities: ${finalCount}`);
    console.log(`New city created: ${newCityResult ? (newCityResult.existed ? 'NO (existed)' : 'YES') : 'FAILED'}`);
    console.log(`Existing city found: ${existingCityResult ? (existingCityResult.existed ? 'YES' : 'NO (created)') : 'FAILED'}`);
    
    const actualIncrease = finalCount - initialCount;
    console.log(`City increase: ${actualIncrease} (expected: 1)`);
    
    if (actualIncrease === 1 && newCityResult && !newCityResult.existed && existingCityResult && existingCityResult.existed) {
      console.log('✅ FINDORCREATECITY FUNCTION WORKING PERFECTLY!');
    } else {
      console.log('❌ FINDORCREATECITY FUNCTION HAS ISSUES!');
    }
    
    // Step 7: Test error cases
    console.log('\n🧪 STEP 7: Testing error cases');
    
    // Missing city
    console.log('Testing missing city...');
    const errorResult1 = await findOrCreateCity({ province: "Bali", country: "Indonesia" });
    console.log('Result:', errorResult1); // Should be null
    
    // Missing province
    console.log('Testing missing province...');
    const errorResult2 = await findOrCreateCity({ city: "Denpasar", country: "Indonesia" });
    console.log('Result:', errorResult2); // Should be null
    
    // Missing country
    console.log('Testing missing country...');
    const errorResult3 = await findOrCreateCity({ city: "Denpasar", province: "Bali" });
    console.log('Result:', errorResult3); // Should be null
    
    console.log('✅ Error case testing completed');
    
    // Step 8: Cleanup
    setTimeout(async () => {
      await cleanupTestData();
      process.exit(0);
    }, 2000);
    
  } catch (error) {
    console.error('❌ Direct function test failed:', error);
    process.exit(1);
  }
}

// Run the test
runDirectFunctionTest(); 