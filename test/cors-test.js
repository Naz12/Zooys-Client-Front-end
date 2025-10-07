// CORS Test Script
// Run this in your browser's developer console to test backend CORS configuration

async function testCORSConfiguration() {
  const backendUrl = 'http://localhost:8000';
  
  console.log('🔍 Testing CORS Configuration...');
  console.log('Backend URL:', backendUrl);
  console.log('Frontend Origin:', window.location.origin);
  
  // Test 1: Basic connectivity
  console.log('\n📡 Test 1: Basic Connectivity');
  try {
    const response = await fetch(`${backendUrl}/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.text();
      console.log('✅ Backend is running');
      console.log('Response:', data);
    } else {
      console.log('❌ Backend responded with status:', response.status);
    }
  } catch (error) {
    console.log('❌ CORS Error:', error.message);
    console.log('💡 This means CORS is not configured on the backend');
  }
  
  // Test 2: Health endpoint
  console.log('\n🏥 Test 2: Health Endpoint');
  try {
    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Health endpoint accessible');
      console.log('Response:', data);
    } else {
      console.log('❌ Health endpoint failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Health endpoint CORS Error:', error.message);
  }
  
  // Test 3: OPTIONS preflight request
  console.log('\n🛡️ Test 3: OPTIONS Preflight Request');
  try {
    const response = await fetch(`${backendUrl}/api/summarize`, {
      method: 'OPTIONS',
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    console.log('OPTIONS Response Status:', response.status);
    console.log('CORS Headers:');
    console.log('- Access-Control-Allow-Origin:', response.headers.get('Access-Control-Allow-Origin'));
    console.log('- Access-Control-Allow-Methods:', response.headers.get('Access-Control-Allow-Methods'));
    console.log('- Access-Control-Allow-Headers:', response.headers.get('Access-Control-Allow-Headers'));
    
    if (response.ok) {
      console.log('✅ OPTIONS request successful - CORS is configured');
    } else {
      console.log('❌ OPTIONS request failed - CORS not configured');
    }
  } catch (error) {
    console.log('❌ OPTIONS request CORS Error:', error.message);
  }
  
  // Test 4: POST request (actual API call)
  console.log('\n📤 Test 4: POST Request to /api/summarize');
  try {
    const testRequest = {
      content_type: "link",
      source: {
        type: "url",
        data: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      },
      options: {
        mode: "detailed",
        language: "en",
        focus: "summary"
      }
    };
    
    const response = await fetch(`${backendUrl}/api/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || 'test-token'}`
      },
      body: JSON.stringify(testRequest)
    });
    
    console.log('POST Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ POST request successful');
      console.log('Response:', data);
    } else {
      const errorText = await response.text();
      console.log('❌ POST request failed:', response.status);
      console.log('Error:', errorText);
    }
  } catch (error) {
    console.log('❌ POST request CORS Error:', error.message);
  }
  
  console.log('\n📋 Summary:');
  console.log('If you see CORS errors, the backend needs CORS configuration.');
  console.log('See md/backend-cors-setup.md for setup instructions.');
}

// Run the test
testCORSConfiguration();
