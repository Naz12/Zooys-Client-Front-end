// Direct Math API Test
// Test math endpoints without authentication first

async function testMathEndpointsDirectly() {
  console.log('=== Testing Math Endpoints Directly ===');
  
  const endpoints = [
    'http://localhost:8000/api/math/history',
    'http://localhost:8000/api/math/solve',
    'http://localhost:8000/api/math/stats'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\nTesting: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`Status: ${response.status}`);
      console.log(`Headers:`, Object.fromEntries(response.headers.entries()));
      
      const text = await response.text();
      console.log(`Response: ${text.substring(0, 200)}...`);
      
      if (response.status === 401) {
        console.log('✅ Endpoint exists but requires authentication');
      } else if (response.status === 404) {
        console.log('❌ Endpoint does not exist');
      } else if (response.status === 200) {
        console.log('✅ Endpoint is accessible');
      } else {
        console.log(`⚠️ Unexpected status: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`❌ Connection failed: ${error.message}`);
    }
  }
}

// Test with authentication
async function testMathEndpointsWithAuth() {
  console.log('\n=== Testing Math Endpoints with Authentication ===');
  
  const token = localStorage.getItem('auth_token');
  if (!token) {
    console.log('❌ No auth token - please log in first');
    return;
  }
  
  try {
    const response = await fetch('http://localhost:8000/api/math/history', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`Status: ${response.status}`);
    const text = await response.text();
    console.log(`Response: ${text}`);
    
  } catch (error) {
    console.log(`❌ Auth test failed: ${error.message}`);
  }
}

// Run tests
testMathEndpointsDirectly().then(() => {
  return testMathEndpointsWithAuth();
});
