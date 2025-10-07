// Backend Connection Test
// Run this in browser console to test backend connectivity

async function testBackendConnection() {
  console.log('Testing backend connection...');
  
  try {
    // Test basic connectivity
    const response = await fetch('http://localhost:8000/api/summarize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({
        content_type: "link",
        source: {
          type: "url",
          data: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" // Test URL
        },
        options: {
          mode: "detailed",
          language: "en",
          focus: "summary"
        }
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.text();
    console.log('Response body:', data);
    
    if (response.ok) {
      console.log('✅ Backend is responding');
      try {
        const jsonData = JSON.parse(data);
        console.log('✅ Valid JSON response:', jsonData);
      } catch (e) {
        console.log('❌ Invalid JSON response');
      }
    } else {
      console.log('❌ Backend returned error:', response.status);
    }
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    console.log('Make sure backend server is running on http://localhost:8000');
  }
}

// Run the test
testBackendConnection();
