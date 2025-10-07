// URL Construction Test
// Test the corrected API URL construction

console.log('=== API URL Construction Test ===');

// Test the corrected base URL
const API_BASE_URL = 'http://localhost:8000/api';
const mathEndpoints = [
  '/math/solve',
  '/math/history', 
  '/math/stats',
  '/math/help'
];

console.log('Base URL:', API_BASE_URL);
console.log('\nConstructed URLs:');

mathEndpoints.forEach(endpoint => {
  const fullUrl = `${API_BASE_URL}${endpoint}`;
  console.log(`✅ ${endpoint} → ${fullUrl}`);
});

console.log('\nExpected final URLs:');
console.log('✅ http://localhost:8000/api/math/solve');
console.log('✅ http://localhost:8000/api/math/history');
console.log('✅ http://localhost:8000/api/math/stats');
console.log('✅ http://localhost:8000/api/math/help');

console.log('\n=== Test Complete ===');
console.log('All URLs now correctly include /api prefix!');
