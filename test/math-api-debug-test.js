/**
 * Comprehensive Math API Debug Test
 * 
 * This test helps identify why you're getting mock data instead of real API responses.
 */

// Test configuration
const API_BASE_URL = 'http://localhost:8000/api';
const TEST_PROBLEM = '2+5';

// Test functions
async function testBackendConnection() {
    console.log('🔍 Testing Backend Connection...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/math/solve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('auth_token') || 'no-token'}`
            },
            body: JSON.stringify({
                problem_text: TEST_PROBLEM,
                subject_area: 'general',
                difficulty_level: 'intermediate',
                problem_type: 'text'
            }),
            redirect: 'manual'
        });
        
        console.log(`📊 Response Status: ${response.status}`);
        console.log(`📊 Response Type: ${response.type}`);
        console.log(`📊 Response URL: ${response.url}`);
        
        if (response.status === 0 || response.type === 'opaqueredirect') {
            console.log('❌ Request was redirected - this indicates a network/CORS issue');
            return false;
        }
        
        if (response.ok) {
            const data = await response.json();
            console.log('✅ Backend is working! Response:', data);
            return true;
        } else {
            const errorText = await response.text();
            console.log(`❌ Backend error (${response.status}):`, errorText);
            return false;
        }
    } catch (error) {
        console.log('❌ Connection failed:', error.message);
        return false;
    }
}

async function testAuthentication() {
    console.log('\n🔐 Testing Authentication...');
    
    const token = localStorage.getItem('auth_token');
    console.log(`Token present: ${token ? 'Yes' : 'No'}`);
    
    if (token) {
        console.log(`Token length: ${token.length}`);
        console.log(`Token preview: ${token.substring(0, 20)}...`);
    } else {
        console.log('❌ No authentication token found');
        console.log('💡 You may need to log in first');
        return false;
    }
    
    return true;
}

async function testCORS() {
    console.log('\n🌐 Testing CORS Configuration...');
    
    try {
        // Test a simple OPTIONS request
        const response = await fetch(`${API_BASE_URL}/math/solve`, {
            method: 'OPTIONS',
            headers: {
                'Origin': 'http://localhost:3000',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type, Authorization'
            }
        });
        
        console.log(`CORS Preflight Status: ${response.status}`);
        console.log('CORS Headers:', {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
            'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers')
        });
        
        return response.ok;
    } catch (error) {
        console.log('❌ CORS test failed:', error.message);
        return false;
    }
}

async function testNetworkConnectivity() {
    console.log('\n🌍 Testing Network Connectivity...');
    
    try {
        // Test if backend is reachable
        const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`, {
            method: 'GET',
            mode: 'no-cors' // This will work even with CORS issues
        });
        
        console.log('✅ Backend server is reachable');
        return true;
    } catch (error) {
        console.log('❌ Backend server is not reachable');
        console.log('💡 Make sure the Laravel backend is running on port 8000');
        console.log('💡 Run: php artisan serve --port=8000');
        return false;
    }
}

async function testAPIEndpoint() {
    console.log('\n🔧 Testing API Endpoint...');
    
    try {
        const response = await fetch(`${API_BASE_URL}/math/solve`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                problem_text: TEST_PROBLEM,
                subject_area: 'general',
                difficulty_level: 'intermediate',
                problem_type: 'text'
            }),
            redirect: 'manual'
        });
        
        console.log(`API Endpoint Status: ${response.status}`);
        
        if (response.status === 401) {
            console.log('❌ Authentication required - this is expected without a valid token');
            return 'auth_required';
        } else if (response.status === 404) {
            console.log('❌ Endpoint not found - check if the math API is implemented');
            return 'not_found';
        } else if (response.ok) {
            console.log('✅ API endpoint is working');
            return 'working';
        } else {
            console.log(`❌ API error: ${response.status}`);
            return 'error';
        }
    } catch (error) {
        console.log('❌ API test failed:', error.message);
        return 'failed';
    }
}

// Main test function
async function runDebugTests() {
    console.log('🚀 Starting Math API Debug Tests\n');
    console.log(`Testing with problem: "${TEST_PROBLEM}"`);
    console.log(`API Base URL: ${API_BASE_URL}\n`);
    
    const results = {
        backend: await testBackendConnection(),
        auth: await testAuthentication(),
        cors: await testCORS(),
        network: await testNetworkConnectivity(),
        api: await testAPIEndpoint()
    };
    
    console.log('\n📋 Debug Results Summary:');
    console.log('========================');
    console.log(`Backend Connection: ${results.backend ? '✅ Working' : '❌ Failed'}`);
    console.log(`Authentication: ${results.auth ? '✅ Token Present' : '❌ No Token'}`);
    console.log(`CORS Configuration: ${results.cors ? '✅ Working' : '❌ Failed'}`);
    console.log(`Network Connectivity: ${results.network ? '✅ Reachable' : '❌ Not Reachable'}`);
    console.log(`API Endpoint: ${results.api === 'working' ? '✅ Working' : `❌ ${results.api}`}`);
    
    console.log('\n🔧 Troubleshooting Recommendations:');
    console.log('====================================');
    
    if (!results.network) {
        console.log('1. 🚨 Start the Laravel backend: php artisan serve --port=8000');
    }
    
    if (!results.auth) {
        console.log('2. 🔐 Log in to get an authentication token');
    }
    
    if (!results.cors) {
        console.log('3. 🌐 Check CORS configuration in Laravel backend');
    }
    
    if (results.api === 'not_found') {
        console.log('4. 🔧 Implement the math API endpoints in Laravel');
    }
    
    if (results.api === 'auth_required' && results.auth) {
        console.log('5. 🔑 Check if the authentication token is valid');
    }
    
    if (results.backend && results.auth && results.cors && results.network) {
        console.log('🎉 All tests passed! The API should be working.');
        console.log('💡 If you\'re still getting mock data, check the browser console for errors.');
    }
}

// Run the tests
runDebugTests().catch(console.error);

