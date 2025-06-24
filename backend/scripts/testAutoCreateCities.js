// Test script for auto-creation of cities from Google Maps data
require('dotenv').config();
const { db } = require('../config/firebase');

const testCases = [
  {
    name: "Test 1: Create space with new city (Bandung)",
    spaceData: {
      name: "CoSpace Bandung Central",
      brand: "CoSpace",
      category: "co-working",
      capacity: 30,
      location: {
        address: "Jl. Asia Afrika No. 8, Bandung",
        city: "Bandung",
        province: "Jawa Barat",
        country: "Indonesia",
        postalCode: "40111",
        coordinates: { lat: -6.921831, lng: 107.607048 },
        latitude: -6.921831,
        longitude: 107.607048
      },
      pricing: {
        hourly: 25000,
        daily: 150000,
        monthly: 1500000,
        currency: "IDR"
      }
    }
  },
  {
    name: "Test 2: Create space with existing city (should use existing)",
    spaceData: {
      name: "CoSpace Bandung West",
      brand: "CoSpace", 
      category: "meeting-room",
      capacity: 8,
      location: {
        address: "Jl. Sukajadi No. 125, Bandung",
        city: "Bandung",
        province: "Jawa Barat",
        country: "Indonesia",
        postalCode: "40161",
        coordinates: { lat: -6.892944, lng: 107.588478 },
        latitude: -6.892944,
        longitude: 107.588478
      },
      pricing: {
        hourly: 50000,
        daily: 200000,
        currency: "IDR"
      }
    }
  },
  {
    name: "Test 3: Create space with another new city (Surabaya)",
    spaceData: {
      name: "NextSpace Surabaya Hub",
      brand: "NextSpace",
      category: "co-working",
      capacity: 50,
      location: {
        address: "Jl. Pemuda No. 31-37, Surabaya",
        city: "Surabaya", 
        province: "Jawa Timur",
        country: "Indonesia",
        postalCode: "60271",
        coordinates: { lat: -7.245635, lng: 112.738497 },
        latitude: -7.245635,
        longitude: 112.738497
      },
      pricing: {
        hourly: 30000,
        daily: 200000,
        monthly: 1800000,
        currency: "IDR"
      }
    }
  }
];

async function findOrCreateCity(locationData) {
  try {
    const { city, province, country } = locationData;
    
    if (!city || !province || !country) {
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
      timezone: 'Asia/Jakarta',
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
      createdBy: 'test_auto_maps_api'
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
    return null;
  }
}

async function updateCityStatistics(cityName) {
  try {
    const citySnapshot = await db.collection('cities')
      .where('name', '==', cityName)
      .limit(1)
      .get();
    
    if (!citySnapshot.empty) {
      const cityDoc = citySnapshot.docs[0];
      const cityRef = cityDoc.ref;
      
      // Count total and active spaces in this city
      const spacesSnapshot = await db.collection('spaces')
        .where('location.city', '==', cityName)
        .get();
      
      let totalSpaces = 0;
      let activeSpaces = 0;
      
      spacesSnapshot.forEach(doc => {
        totalSpaces++;
        if (doc.data().isActive) activeSpaces++;
      });
      
      // Update city statistics
      await cityRef.update({
        'statistics.totalSpaces': totalSpaces,
        'statistics.activeSpaces': activeSpaces,
        updatedAt: new Date()
      });

      console.log(`📊 Updated city statistics for ${cityName}: ${totalSpaces} total, ${activeSpaces} active`);
    }
  } catch (error) {
    console.warn('Could not update city statistics:', error);
  }
}

async function createTestSpace(testCase) {
  try {
    console.log(`\n🧪 ${testCase.name}`);
    console.log('=====================================');
    
    const spaceData = testCase.spaceData;
    
    // Auto-create city if needed
    const cityResult = await findOrCreateCity(spaceData.location);
    let cityMessage = '';
    if (cityResult) {
      if (cityResult.existed) {
        cityMessage = ` (City "${spaceData.location.city}" already exists)`;
      } else {
        cityMessage = ` (New city "${spaceData.location.city}" created automatically)`;
      }
    }

    // Generate space ID
    const spaceId = `space_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Prepare final data
    const newSpaceData = {
      spaceId,
      ...spaceData,
      description: spaceData.description || `Professional ${spaceData.category} space`,
      spaceType: spaceData.spaceType || spaceData.category,
      isActive: true,
      amenities: spaceData.amenities || [],
      images: spaceData.images || [],
      thumbnail: spaceData.thumbnail || null,
      operatingHours: {
        monday: { open: "08:00", close: "22:00" },
        tuesday: { open: "08:00", close: "22:00" },
        wednesday: { open: "08:00", close: "22:00" },
        thursday: { open: "08:00", close: "22:00" },
        friday: { open: "08:00", close: "22:00" },
        saturday: { open: "09:00", close: "18:00" },
        sunday: { open: "09:00", close: "18:00" }
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'test_api',
      version: 1,
      slug: spaceData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      searchKeywords: [
        ...spaceData.name.toLowerCase().split(' '),
        spaceData.brand.toLowerCase(),
        spaceData.category.toLowerCase(),
        spaceData.location.city.toLowerCase(),
        spaceData.location.province.toLowerCase()
      ].filter((v, i, a) => a.indexOf(v) === i && v.length > 1)
    };

    // Save to database
    await db.collection('spaces').doc(spaceId).set(newSpaceData);
    console.log(`✅ Space created: ${spaceId}`);

    // Update city statistics
    await updateCityStatistics(spaceData.location.city);

    console.log(`✅ Test completed successfully${cityMessage}`);
    
    return {
      success: true,
      spaceId,
      cityMessage,
      cityResult
    };
  } catch (error) {
    console.error(`❌ Test failed:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function checkCitiesCollection() {
  try {
    console.log('\n📋 Cities Collection Status:');
    console.log('=====================================');
    
    const citiesSnapshot = await db.collection('cities').get();
    console.log(`Total cities in database: ${citiesSnapshot.size}`);
    
    citiesSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`- ${data.name}, ${data.province} (${data.statistics?.totalSpaces || 0} spaces)`);
    });
  } catch (error) {
    console.error('Error checking cities collection:', error);
  }
}

async function runTests() {
  console.log('🚀 Starting Auto-Create Cities Test');
  console.log('=====================================\n');
  
  try {
    // Check initial state
    await checkCitiesCollection();
    
    const results = [];
    
    // Run test cases
    for (const testCase of testCases) {
      const result = await createTestSpace(testCase);
      results.push(result);
      
      // Wait a bit between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Check final state
    await checkCitiesCollection();
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log('=====================================');
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Successful tests: ${successful}`);
    console.log(`❌ Failed tests: ${failed}`);
    
    if (failed > 0) {
      console.log('\nFailed tests:');
      results.filter(r => !r.success).forEach((r, i) => {
        console.log(`- Test ${i + 1}: ${r.error}`);
      });
    }
    
    console.log('\n🎉 All tests completed!');
    
  } catch (error) {
    console.error('Error during test execution:', error);
  } finally {
    process.exit(0);
  }
}

// Run the tests
runTests(); 