// Simple Backend Connection Test
// Run this in browser console to test backend connectivity

async function testBackendConnection() {
  console.log('🔍 Testing backend connection...');
  
  try {
    // Test basic server connectivity
    const response = await fetch('http://localhost:8000/', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Backend server is running');
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    // Test API endpoint
    const apiResponse = await fetch('http://localhost:8000/api/health', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (apiResponse.ok) {
      console.log('✅ API endpoint is accessible');
    } else {
      console.log('⚠️ API endpoint returned status:', apiResponse.status);
    }
    
  } catch (error) {
    console.log('❌ Backend connection failed:', error.message);
    console.log('💡 Make sure your Laravel backend is running on http://localhost:8000');
  }
}

// Run the test
testBackendConnection();

