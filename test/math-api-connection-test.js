// Math API Connection Test
// Run this in browser console to test math API connectivity

async function testMathApiConnection() {
  console.log('Testing Math API connection...');
  
  const token = localStorage.getItem('auth_token');
  console.log('Auth token present:', !!token);
  
  if (!token) {
    console.log('❌ No auth token found. Please log in first.');
    return;
  }
  
  try {
    // Test math history endpoint
    console.log('Testing /api/math/history...');
    const historyResponse = await fetch('http://localhost:8000/api/math/history', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('History response status:', historyResponse.status);
    console.log('History response headers:', Object.fromEntries(historyResponse.headers.entries()));
    
    const historyData = await historyResponse.text();
    console.log('History response body:', historyData);
    
    if (historyResponse.ok) {
      console.log('✅ Math history endpoint is working');
      try {
        const jsonData = JSON.parse(historyData);
        console.log('✅ Valid JSON response:', jsonData);
      } catch (e) {
        console.log('❌ Invalid JSON response for history');
      }
    } else {
      console.log('❌ Math history endpoint returned error:', historyResponse.status);
    }
    
  } catch (error) {
    console.log('❌ Math API connection failed:', error.message);
    console.log('Error details:', error);
    
    if (error.message.includes('Failed to fetch')) {
      console.log('🔍 Troubleshooting suggestions:');
      console.log('1. Check if backend server is running on http://localhost:8000');
      console.log('2. Verify CORS configuration allows requests from frontend');
      console.log('3. Check if math API endpoints are properly configured in backend');
      console.log('4. Ensure authentication is working correctly');
    }
  }
}

// Test math solve endpoint
async function testMathSolveEndpoint() {
  console.log('Testing Math Solve endpoint...');
  
  const token = localStorage.getItem('auth_token');
  
  try {
    const solveResponse = await fetch('http://localhost:8000/api/math/solve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        problem_text: "What is 2 + 2?",
        subject_area: "arithmetic",
        difficulty_level: "easy"
      })
    });
    
    console.log('Solve response status:', solveResponse.status);
    const solveData = await solveResponse.text();
    console.log('Solve response body:', solveData);
    
    if (solveResponse.ok) {
      console.log('✅ Math solve endpoint is working');
    } else {
      console.log('❌ Math solve endpoint returned error:', solveResponse.status);
    }
    
  } catch (error) {
    console.log('❌ Math solve test failed:', error.message);
  }
}

// Run the tests
console.log('=== Math API Connection Tests ===');
testMathApiConnection().then(() => {
  console.log('\n=== Testing Math Solve Endpoint ===');
  return testMathSolveEndpoint();
}).then(() => {
  console.log('\n=== Tests Complete ===');
});
