// Test New Sequential Space ID Format
require('dotenv').config({ path: '../.env' });

const { db } = require('../config/firebase');
const axios = require('axios');

// Test data
const testSpaces = [
  {
    name: "Test Space Alpha",
    description: "First test space for ID format",
    brand: "CoSpace",
    category: "Private Office",
    spaceType: "open-space",
    capacity: 10,
    location: {
      address: "Jl. Test Alpha No. 1",
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
    isActive: true
  },
  {
    name: "Test Space Beta",
    description: "Second test space for ID format",
    brand: "NextSpace",
    category: "Private Office",
    spaceType: "private-room",
    capacity: 5,
    location: {
      address: "Jl. Test Beta No. 2",
      city: "Bandung",
      province: "Jawa Barat",
      country: "Indonesia",
      latitude: -6.9175,
      longitude: 107.6191
    },
    pricing: {
      hourly: 25000,
      daily: 150000,
      monthly: 3000000,
      currency: "IDR"
    },
    amenities: ["wifi", "coffee"],
    isActive: true
  },
  {
    name: "Test Space Gamma",
    description: "Third test space for ID format",
    brand: "UnionSpace",
    category: "Private Office",
    spaceType: "meeting-room",
    capacity: 8,
    location: {
      address: "Jl. Test Gamma No. 3",
      city: "Surabaya",
      province: "Jawa Timur",
      country: "Indonesia",
      latitude: -7.2504,
      longitude: 112.7688
    },
    pricing: {
      hourly: 35000,
      daily: 250000,
      monthly: 5000000,
      currency: "IDR"
    },
    amenities: ["wifi", "projector"],
    isActive: true
  }
];

async function createTestSpaces() {
  console.log('🧪 Testing New Sequential Space ID Format');
  console.log('='.repeat(50));
  
  const createdSpaces = [];
  
  try {
    for (let i = 0; i < testSpaces.length; i++) {
      const spaceData = testSpaces[i];
      
      console.log(`\n🚀 Creating test space ${i + 1}: ${spaceData.name}`);
      
      const response = await axios.post('http://localhost:3001/api/spaces', spaceData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        const space = response.data.data;
        console.log(`✅ Created: ${space.name}`);
        console.log(`🆔 Space ID: ${space.spaceId}`);
        console.log(`📍 City: ${space.location.city}`);
        console.log(`💬 Message: ${response.data.message}`);
        
        createdSpaces.push(space);
      } else {
        console.log(`❌ Failed to create: ${spaceData.name}`);
      }
      
      // Wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Analysis
    console.log('\n📊 Analysis of Generated IDs:');
    console.log('='.repeat(30));
    
    createdSpaces.forEach((space, index) => {
      console.log(`${index + 1}. ${space.spaceId} - ${space.name} (${space.location.city})`);
    });
    
    // Check ID format consistency
    console.log('\n🔍 ID Format Analysis:');
    const idPattern = /^SPC\d{2}\d{3}$/; // Pattern: SPC + 2 digits year + 3 digits sequence
    
    let allValid = true;
    let isSequential = true;
    let previousNumber = 0;
    
    createdSpaces.forEach((space, index) => {
      const id = space.spaceId;
      const isValid = idPattern.test(id);
      
      if (!isValid) {
        console.log(`❌ Invalid format: ${id}`);
        allValid = false;
      } else {
        // Extract number from ID (last 3 digits)
        const numberPart = parseInt(id.slice(-3));
        console.log(`✅ Valid format: ${id} (sequence: ${numberPart})`);
        
        if (index > 0 && numberPart !== previousNumber + 1) {
          isSequential = false;
        }
        previousNumber = numberPart;
      }
    });
    
    console.log('\n📋 Final Results:');
    console.log('='.repeat(20));
    console.log(`Format validity: ${allValid ? '✅ All valid' : '❌ Some invalid'}`);
    console.log(`Sequential order: ${isSequential ? '✅ Sequential' : '❌ Not sequential'}`);
    console.log(`Total spaces created: ${createdSpaces.length}`);
    
    if (allValid && isSequential) {
      console.log('🎉 NEW SPACE ID FORMAT WORKING PERFECTLY!');
    } else {
      console.log('⚠️  Issues detected with new format');
    }
    
    return createdSpaces;
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    return [];
  }
}

async function cleanupTestSpaces(spaces) {
  console.log('\n🧹 Cleaning up test spaces...');
  
  try {
    const deletions = [];
    
    for (const space of spaces) {
      console.log(`Deleting: ${space.spaceId} (${space.name})`);
      deletions.push(
        db.collection('spaces').doc(space.spaceId).delete()
      );
    }
    
    await Promise.all(deletions);
    console.log(`✅ Deleted ${deletions.length} test spaces`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

async function runTest() {
  try {
    // Create test spaces
    const createdSpaces = await createTestSpaces();
    
    // Wait a moment before cleanup
    if (createdSpaces.length > 0) {
      console.log('\n⏱️  Waiting 3 seconds before cleanup...');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Cleanup
      await cleanupTestSpaces(createdSpaces);
    }
    
    console.log('\n✅ Test completed!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
runTest(); 