// Space ID Format Options Demo
// Demonstrating different approaches for generating space IDs

// Current format (what we have now)
function currentFormat() {
  return `space_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Option 1: Sequential with prefix (simple counter)
let spaceCounter = 1000; // Start from 1000 for 4-digit IDs
function sequentialFormat() {
  return `SPC${String(spaceCounter++).padStart(4, '0')}`;
}

// Option 2: Year + Sequential (more context)
function yearSequentialFormat() {
  const year = new Date().getFullYear().toString().slice(-2); // Last 2 digits of year
  const sequence = String(spaceCounter++).padStart(3, '0');
  return `SPC${year}${sequence}`;
}

// Option 3: City + Sequential (location-based)
function citySequentialFormat(cityName) {
  const cityCode = cityName.substring(0, 3).toUpperCase();
  const sequence = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
  return `${cityCode}${sequence}`;
}

// Option 4: Brand + Sequential
function brandSequentialFormat(brand) {
  const brandMap = {
    'NextSpace': 'NS',
    'UnionSpace': 'US', 
    'CoSpace': 'CS'
  };
  const brandCode = brandMap[brand] || 'SP';
  const sequence = String(spaceCounter++).padStart(4, '0');
  return `${brandCode}${sequence}`;
}

// Option 5: Human-readable format (name-based)
function humanReadableFormat(spaceName, city) {
  const nameSlug = spaceName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(' ')
    .slice(0, 2) // Take first 2 words
    .join('')
    .substring(0, 6);
  
  const cityCode = city.substring(0, 3).toLowerCase();
  const sequence = String(Math.floor(Math.random() * 100)).padStart(2, '0');
  
  return `${nameSlug}-${cityCode}${sequence}`;
}

// Option 6: Short UUID-like (compromise between unique and readable)
function shortUuidFormat() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'SPC-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Demo all formats
console.log('🆔 Space ID Format Options Comparison');
console.log('='.repeat(50));

console.log('\n📊 Current Format (what we have now):');
for (let i = 0; i < 3; i++) {
  console.log(`   ${currentFormat()}`);
}

console.log('\n✨ Option 1 - Sequential (Simple):');
spaceCounter = 1000; // Reset counter
for (let i = 0; i < 3; i++) {
  console.log(`   ${sequentialFormat()}`);
}

console.log('\n📅 Option 2 - Year + Sequential:');
spaceCounter = 1; // Reset counter
for (let i = 0; i < 3; i++) {
  console.log(`   ${yearSequentialFormat()}`);
}

console.log('\n🏙️  Option 3 - City-based:');
const cities = ['Jakarta', 'Bandung', 'Surabaya'];
cities.forEach(city => {
  console.log(`   ${citySequentialFormat(city)} (${city})`);
});

console.log('\n🏢 Option 4 - Brand-based:');
const brands = ['NextSpace', 'UnionSpace', 'CoSpace'];
spaceCounter = 1; // Reset counter
brands.forEach(brand => {
  console.log(`   ${brandSequentialFormat(brand)} (${brand})`);
});

console.log('\n💬 Option 5 - Human-readable:');
const spaceNames = [
  { name: 'Jakarta Premium Office', city: 'Jakarta' },
  { name: 'Bandung Creative Hub', city: 'Bandung' },
  { name: 'Surabaya Business Center', city: 'Surabaya' }
];
spaceNames.forEach(space => {
  console.log(`   ${humanReadableFormat(space.name, space.city)} (${space.name})`);
});

console.log('\n🎲 Option 6 - Short UUID-like:');
for (let i = 0; i < 3; i++) {
  console.log(`   ${shortUuidFormat()}`);
}

console.log('\n📝 Recommendations:');
console.log('='.repeat(30));
console.log('✅ BEST for User Experience: Option 2 (Year + Sequential)');
console.log('   - Format: SPC25001, SPC25002, SPC25003');
console.log('   - Short, memorable, chronological');
console.log('   - Easy to reference and sort');
console.log('');
console.log('✅ GOOD Alternative: Option 4 (Brand-based)');
console.log('   - Format: NS0001, US0002, CS0003');
console.log('   - Includes business context');
console.log('   - Easy categorization by brand');
console.log('');
console.log('⚠️  Current format issues:');
console.log('   - Too long (25+ characters)');
console.log('   - Random strings hard to remember');
console.log('   - No business context');
console.log('   - Difficult for manual reference');

// Show database impact
console.log('\n💾 Database Considerations:');
console.log('='.repeat(30));
console.log('Current approach: Uses timestamp + random');
console.log('- Pros: Guaranteed unique, no collision');
console.log('- Cons: Not user-friendly, hard to reference');
console.log('');
console.log('Sequential approach: Uses counter + prefix');
console.log('- Pros: Short, memorable, sortable');
console.log('- Cons: Need to track last used number');
console.log('- Solution: Store counter in dedicated collection');

// Implementation example for sequential
console.log('\n🔧 Implementation Example (Year + Sequential):');
console.log('='.repeat(40));
console.log(`
// 1. Create counter collection in Firebase
// Collection: 'counters'
// Document: 'spaces'
// Field: { lastId: 0, year: 2025 }

async function generateSequentialSpaceId() {
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
    const spaceId = \`SPC\${yearSuffix}\${sequence}\`;
    
    // Update counter
    transaction.set(counterRef, {
      lastId: lastId,
      year: currentYear,
      updatedAt: new Date()
    });
    
    return spaceId;
  });
  
  return result;
}

// Example output: SPC25001, SPC25002, SPC25003
`);

console.log('\n❓ Question for Decision:');
console.log('Which format would you prefer?');
console.log('1. Keep current random format (guaranteed unique)');
console.log('2. Switch to Year+Sequential (SPC25001, SPC25002...)');
console.log('3. Switch to Brand-based (NS0001, US0002, CS0003...)');
console.log('4. Custom format based on your preference');
console.log('');
console.log('Consider: user experience vs. technical complexity'); 