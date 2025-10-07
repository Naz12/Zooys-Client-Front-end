// Backend API Test Script
// Run this in your browser's developer console to test the backend API endpoints

async function testBackendAPI() {
  const backendUrl = 'http://localhost:8000';
  
  console.log('🔍 Testing Backend API Endpoints...');
  console.log('Backend URL:', backendUrl);
  console.log('Frontend Origin:', window.location.origin);
  
  // Test 1: Basic server connectivity
  console.log('\n📡 Test 1: Server Connectivity');
  try {
    const response = await fetch(`${backendUrl}/`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.text();
      console.log('✅ Server is running');
      console.log('Response:', data);
    } else {
      console.log('❌ Server error:', response.status);
    }
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    return;
  }
  
  // Test 2: Health endpoint
  console.log('\n🏥 Test 2: Health Endpoint');
  try {
    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Health endpoint working');
      console.log('Response:', data);
    } else {
      console.log('❌ Health endpoint failed:', response.status);
    }
  } catch (error) {
    console.log('❌ Health endpoint error:', error.message);
  }
  
  // Test 3: Check available endpoints
  console.log('\n🔍 Test 3: Available Endpoints');
  const endpoints = [
    '/api/summarize',
    '/api/youtube/summarize',
    '/api/pdf/summarize',
    '/api/health',
    '/docs',
    '/openapi.json'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${backendUrl}${endpoint}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log(`${endpoint}: ${response.status} ${response.statusText}`);
    } catch (error) {
      console.log(`${endpoint}: Error - ${error.message}`);
    }
  }
  
  // Test 4: Test /api/summarize endpoint
  console.log('\n📤 Test 4: /api/summarize Endpoint');
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
    
    console.log('Request payload:', JSON.stringify(testRequest, null, 2));
    
    const response = await fetch(`${backendUrl}/api/summarize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || 'test-token'}`
      },
      body: JSON.stringify(testRequest)
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Raw Response:', responseText);
    
    if (response.ok) {
      try {
        const responseJson = JSON.parse(responseText);
        console.log('✅ API endpoint working');
        console.log('Parsed Response:', responseJson);
        
        if (responseJson.summary) {
          console.log('✅ Summary found in response');
          console.log('Summary length:', responseJson.summary.length);
        } else {
          console.log('❌ No summary in response');
          console.log('Response keys:', Object.keys(responseJson));
        }
      } catch (parseError) {
        console.log('❌ Response is not valid JSON');
        console.log('Parse error:', parseError.message);
      }
    } else {
      console.log('❌ API endpoint failed');
      console.log('Error response:', responseText);
    }
  } catch (error) {
    console.log('❌ API request failed:', error.message);
  }
  
  // Test 5: Test with different content types
  console.log('\n🧪 Test 5: Different Content Types');
  const testCases = [
    {
      name: 'YouTube URL',
      request: {
        content_type: "link",
        source: { type: "url", data: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
        options: { mode: "detailed", language: "en", focus: "summary" }
      }
    },
    {
      name: 'Text Content',
      request: {
        content_type: "text",
        source: { type: "text", data: "This is a test document about artificial intelligence." },
        options: { mode: "detailed", language: "en", focus: "summary" }
      }
    }
  ];
  
  for (const testCase of testCases) {
    try {
      console.log(`\nTesting ${testCase.name}:`);
      
      const response = await fetch(`${backendUrl}/api/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || 'test-token'}`
        },
        body: JSON.stringify(testCase.request)
      });
      
      console.log(`Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Success');
        console.log('Has summary:', !!data.summary);
        console.log('Response keys:', Object.keys(data));
      } else {
        const errorText = await response.text();
        console.log('❌ Failed:', errorText);
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }
  
  console.log('\n📋 Summary:');
  console.log('If you see empty responses {}, the backend needs:');
  console.log('1. /api/summarize endpoint implementation');
  console.log('2. YouTube URL processing support');
  console.log('3. Proper response format');
  console.log('\nSee md/backend-cors-setup.md for implementation examples.');
}

// Run the test
testBackendAPI();
