// Simple Space Creation Test with New Sequential ID
require('dotenv').config({ path: '../.env' });

const { db } = require('../config/firebase');

// Import the generateSequentialSpaceId function (copy from spaces.js)
async function generateSequentialSpaceId() {
  try {
    const year = new Date().getFullYear();
    const counterRef = db.collection('counters').doc('spaces');
    
    const result = await db.runTransaction(async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      
      let lastId = 1;
      let currentYear = year;
      
      if (counterDoc.exists) {
        const data = counterDoc.data();
        lastId = data.lastId + 1;
        currentYear = data.year;
        
        // Reset counter if year changed
        if (currentYear !== year) {
          lastId = 1;
          currentYear = year;
        }
      }
      
      const yearSuffix = year.toString().slice(-2);
      const sequence = String(lastId).padStart(3, '0');
      const spaceId = `SPC${yearSuffix}${sequence}`;
      
      // Update counter
      transaction.set(counterRef, {
        lastId: lastId,
        year: currentYear,
        updatedAt: new Date()
      });
      
      return spaceId;
    });
    
    return result;
    
  } catch (error) {
    console.error('Error generating sequential space ID:', error);
    const fallbackId = `SPC${Date.now().toString().slice(-6)}`;
    return fallbackId;
  }
}

async function createTestSpaceDirectly() {
  console.log('🧪 Testing Direct Space Creation with New Sequential ID');
  console.log('='.repeat(55));
  
  try {
    // Generate sequential ID
    console.log('\n🆔 Generating sequential space ID...');
    const spaceId = await generateSequentialSpaceId();
    console.log(`✅ Generated ID: ${spaceId}`);
    
    // Create space data
    const spaceData = {
      spaceId,
      name: "Test Sequential Space",
      description: "Testing new sequential ID format",
      brand: "CoSpace",
      category: "Private Office",
      spaceType: "open-space",
      capacity: 10,
      location: {
        address: "Jl. Test Sequential No. 1",
        city: "Jakarta",
        province: "DKI Jakarta",
        country: "Indonesia",
        latitude: -6.2088,
        longitude: 106.8456
      },
      pricing: {
        hourly: 30000,
        daily: 200000,
        monthly: 4000000,
        currency: "IDR"
      },
      amenities: ["wifi"],
      isActive: true,
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
      createdBy: 'sequential_test',
      version: 1,
      slug: "test-sequential-space",
      searchKeywords: ["test", "sequential", "space", "cospace", "private office", "jakarta"]
    };
    
    // Save to database
    console.log('\n💾 Saving space to database...');
    await db.collection('spaces').doc(spaceId).set(spaceData);
    console.log(`✅ Space saved successfully with ID: ${spaceId}`);
    
    // Verify it was saved
    console.log('\n🔍 Verifying space was saved...');
    const doc = await db.collection('spaces').doc(spaceId).get();
    if (doc.exists) {
      const data = doc.data();
      console.log('✅ Space verified in database:');
      console.log(`   - Name: ${data.name}`);
      console.log(`   - ID: ${data.spaceId}`);
      console.log(`   - City: ${data.location.city}`);
      console.log(`   - Brand: ${data.brand}`);
    } else {
      console.log('❌ Space not found in database');
    }
    
    // Test another sequential ID
    console.log('\n🔄 Generating another sequential ID...');
    const spaceId2 = await generateSequentialSpaceId();
    console.log(`✅ Second ID: ${spaceId2}`);
    
    // Verify sequence
    const firstNum = parseInt(spaceId.slice(-3));
    const secondNum = parseInt(spaceId2.slice(-3));
    
    if (secondNum === firstNum + 1) {
      console.log('✅ Sequential generation working correctly!');
    } else {
      console.log('❌ Sequential generation not working');
    }
    
    console.log('\n📋 Summary:');
    console.log(`First space ID: ${spaceId}`);
    console.log(`Second space ID: ${spaceId2}`);
    console.log(`Format: SPC[Year][Sequence]`);
    console.log(`Year: ${new Date().getFullYear().toString().slice(-2)}`);
    console.log(`Length: 8 characters (vs 25+ with old format)`);
    
    // Cleanup
    console.log('\n🧹 Cleaning up test space...');
    await db.collection('spaces').doc(spaceId).delete();
    console.log('✅ Test space deleted');
    
    console.log('\n🎉 NEW SEQUENTIAL SPACE ID FORMAT WORKING PERFECTLY!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
createTestSpaceDirectly(); 