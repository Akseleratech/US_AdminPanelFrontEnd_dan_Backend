// Test Sequential ID Function in Isolation
require('dotenv').config({ path: '../.env' });

const { db } = require('../config/firebase');

// Copy the function from spaces.js
async function generateSequentialSpaceId() {
  try {
    console.log('🆔 Starting sequential ID generation...');
    
    const year = new Date().getFullYear();
    console.log(`📅 Current year: ${year}`);
    
    const counterRef = db.collection('counters').doc('spaces');
    console.log('📊 Counter reference created');
    
    const result = await db.runTransaction(async (transaction) => {
      console.log('🔄 Starting transaction...');
      
      const counterDoc = await transaction.get(counterRef);
      console.log(`📖 Counter document exists: ${counterDoc.exists}`);
      
      let lastId = 1;
      let currentYear = year;
      
      if (counterDoc.exists) {
        const data = counterDoc.data();
        console.log('📄 Existing counter data:', data);
        
        lastId = data.lastId + 1;
        currentYear = data.year;
        
        // Reset counter if year changed
        if (currentYear !== year) {
          console.log(`🔄 Year changed from ${currentYear} to ${year}, resetting counter`);
          lastId = 1;
          currentYear = year;
        }
      } else {
        console.log('🆕 No existing counter, starting fresh');
      }
      
      const yearSuffix = year.toString().slice(-2); // Last 2 digits of year
      const sequence = String(lastId).padStart(3, '0'); // 3-digit sequence with leading zeros
      const spaceId = `SPC${yearSuffix}${sequence}`; // Format: SPC25001
      
      console.log(`🎯 Generated ID: ${spaceId} (year: ${yearSuffix}, sequence: ${sequence})`);
      
      // Update counter
      const updateData = {
        lastId: lastId,
        year: currentYear,
        updatedAt: new Date()
      };
      
      console.log('💾 Updating counter with:', updateData);
      transaction.set(counterRef, updateData);
      
      return spaceId;
    });
    
    console.log(`✅ Generated sequential space ID: ${result}`);
    return result;
    
  } catch (error) {
    console.error('❌ Error generating sequential space ID:', error);
    console.error('Stack trace:', error.stack);
    
    // Fallback to timestamp-based ID if sequential fails
    const fallbackId = `SPC${Date.now().toString().slice(-6)}`;
    console.log(`⚠️  Using fallback ID: ${fallbackId}`);
    return fallbackId;
  }
}

async function testMultipleGenerations() {
  console.log('🧪 Testing Sequential Space ID Generation');
  console.log('='.repeat(45));
  
  try {
    // Generate 5 test IDs
    const generatedIds = [];
    
    for (let i = 1; i <= 5; i++) {
      console.log(`\n🔢 Generation ${i}:`);
      const id = await generateSequentialSpaceId();
      generatedIds.push(id);
      
      // Wait a bit between generations
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Analysis
    console.log('\n📊 Analysis of Generated IDs:');
    console.log('='.repeat(30));
    
    generatedIds.forEach((id, index) => {
      console.log(`${index + 1}. ${id}`);
    });
    
    // Check if they're sequential
    console.log('\n🔍 Sequential Check:');
    let isSequential = true;
    
    for (let i = 1; i < generatedIds.length; i++) {
      const currentNum = parseInt(generatedIds[i].slice(-3));
      const previousNum = parseInt(generatedIds[i-1].slice(-3));
      
      if (currentNum !== previousNum + 1) {
        console.log(`❌ Not sequential: ${generatedIds[i-1]} -> ${generatedIds[i]}`);
        isSequential = false;
      } else {
        console.log(`✅ Sequential: ${generatedIds[i-1]} -> ${generatedIds[i]}`);
      }
    }
    
    if (isSequential) {
      console.log('\n🎉 SEQUENTIAL ID GENERATION WORKING PERFECTLY!');
    } else {
      console.log('\n⚠️  Issues with sequential generation');
    }
    
    // Show counter status
    console.log('\n📊 Final Counter Status:');
    const counterDoc = await db.collection('counters').doc('spaces').get();
    if (counterDoc.exists) {
      console.log('Counter data:', counterDoc.data());
    } else {
      console.log('No counter document found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testMultipleGenerations(); 