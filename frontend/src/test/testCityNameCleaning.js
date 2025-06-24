// Test script for city name cleaning functions
// This tests the cleaning logic used in GoogleMap.jsx

// Function to clean city/regency names by removing administrative prefixes
const cleanCityName = (rawCityName) => {
  if (!rawCityName) return '';
  
  // List of prefixes to remove (case insensitive)
  const prefixesToRemove = [
    'Kabupaten ', 'Kab. ', 'Kab ',
    'Kota ', 'Kotamadya ',
    'Provinsi ', 'Prov. ', 'Prov ',
    'Daerah Istimewa ', 'DI ',
    'Daerah Khusus Ibukota ', 'DKI '
  ];
  
  let cleanedName = rawCityName;
  
  // Remove prefixes (case insensitive)
  prefixesToRemove.forEach(prefix => {
    const regex = new RegExp(`^${prefix}`, 'i');
    cleanedName = cleanedName.replace(regex, '');
  });
  
  // Trim any extra spaces
  cleanedName = cleanedName.trim();
  
  return cleanedName;
};

// Function to clean province names
const cleanProvinceName = (rawProvinceName) => {
  if (!rawProvinceName) return '';
  
  // List of prefixes to remove for provinces
  const prefixesToRemove = [
    'Provinsi ', 'Prov. ', 'Prov ',
    'Daerah Istimewa ', 'DI ',
    'Daerah Khusus Ibukota ', 'DKI '
  ];
  
  let cleanedName = rawProvinceName;
  
  // Remove prefixes (case insensitive)
  prefixesToRemove.forEach(prefix => {
    const regex = new RegExp(`^${prefix}`, 'i');
    cleanedName = cleanedName.replace(regex, '');
  });
  
  // Special cases for common Indonesian provinces
  const specialCases = {
    'Jakarta': 'DKI Jakarta',
    'Yogyakarta': 'DI Yogyakarta',
    'Aceh': 'Aceh'
  };
  
  // Check if cleaned name matches special cases
  if (specialCases[cleanedName]) {
    cleanedName = specialCases[cleanedName];
  }
  
  cleanedName = cleanedName.trim();
  return cleanedName;
};

// Test cases
const testCases = [
  // City/Regency test cases
  {
    type: 'city',
    input: 'Kabupaten Sleman',
    expected: 'Sleman',
    description: 'Remove "Kabupaten" prefix from Sleman'
  },
  {
    type: 'city',
    input: 'Kota Bandung',
    expected: 'Bandung',
    description: 'Remove "Kota" prefix from Bandung'
  },
  {
    type: 'city',
    input: 'Kab. Bantul',
    expected: 'Bantul',
    description: 'Remove "Kab." prefix from Bantul'
  },
  {
    type: 'city',
    input: 'Kotamadya Jakarta Pusat',
    expected: 'Jakarta Pusat',
    description: 'Remove "Kotamadya" prefix from Jakarta Pusat'
  },
  {
    type: 'city',
    input: 'Surabaya',
    expected: 'Surabaya',
    description: 'Keep plain city name unchanged'
  },
  
  // Province test cases
  {
    type: 'province',
    input: 'Daerah Istimewa Yogyakarta',
    expected: 'DI Yogyakarta',
    description: 'Clean DI Yogyakarta province name'
  },
  {
    type: 'province',
    input: 'Provinsi Jawa Barat',
    expected: 'Jawa Barat',
    description: 'Remove "Provinsi" prefix from Jawa Barat'
  },
  {
    type: 'province',
    input: 'DKI Jakarta',
    expected: 'DKI Jakarta',
    description: 'Keep DKI Jakarta as special case'
  },
  {
    type: 'province',
    input: 'Daerah Khusus Ibukota Jakarta',
    expected: 'DKI Jakarta',
    description: 'Convert full DKI name to standard format'
  },
  {
    type: 'province',
    input: 'Bali',
    expected: 'Bali',
    description: 'Keep plain province name unchanged'
  }
];

// Run tests
function runTests() {
  console.log('🧪 Testing City & Province Name Cleaning Functions');
  console.log('================================================\n');
  
  let passedTests = 0;
  let failedTests = 0;
  
  testCases.forEach((testCase, index) => {
    const { type, input, expected, description } = testCase;
    
    let result;
    if (type === 'city') {
      result = cleanCityName(input);
    } else if (type === 'province') {
      result = cleanProvinceName(input);
    }
    
    const passed = result === expected;
    const status = passed ? '✅ PASS' : '❌ FAIL';
    
    console.log(`Test ${index + 1}: ${description}`);
    console.log(`Type: ${type.toUpperCase()}`);
    console.log(`Input: "${input}"`);
    console.log(`Expected: "${expected}"`);
    console.log(`Result: "${result}"`);
    console.log(`Status: ${status}\n`);
    
    if (passed) {
      passedTests++;
    } else {
      failedTests++;
    }
  });
  
  console.log('================================================');
  console.log(`📊 Test Summary:`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${((passedTests / testCases.length) * 100).toFixed(1)}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 All tests passed! City name cleaning functions work correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the cleaning logic.');
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { cleanCityName, cleanProvinceName, runTests };
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  runTests();
} 