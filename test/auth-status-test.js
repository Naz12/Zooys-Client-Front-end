// Auth Status Test
// Run this in browser console to check authentication status

function checkAuthStatus() {
  console.log('=== Authentication Status Check ===');
  
  const token = localStorage.getItem('auth_token');
  console.log('Auth token present:', !!token);
  
  if (token) {
    console.log('Token length:', token.length);
    console.log('Token preview:', token.substring(0, 20) + '...');
    
    // Try to decode the token (basic check)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('Token payload:', payload);
      console.log('Token expires at:', new Date(payload.exp * 1000));
      console.log('Token is expired:', Date.now() > payload.exp * 1000);
    } catch (e) {
      console.log('Token is not a valid JWT');
    }
  } else {
    console.log('❌ No authentication token found');
    console.log('Please log in first before testing math API');
  }
  
  return !!token;
}

// Run the check
checkAuthStatus();
