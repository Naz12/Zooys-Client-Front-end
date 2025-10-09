/**
 * Math API Integration Test
 * 
 * This test file verifies the math API endpoints are working correctly.
 * Run this with: node test/math-api-test.js
 */

const API_BASE_URL = 'http://localhost:8000';

// Test configuration
const TEST_CONFIG = {
  baseUrl: API_BASE_URL,
  timeout: 10000,
  // Add your test token here if needed
  token: null
};

// Test data
const TEST_DATA = {
  topic: 'algebra',
  difficulty: 'medium',
  problemId: 1,
  userSolution: 'x = 5'
};

// Helper function to make API requests
async function makeRequest(endpoint, method = 'GET', data = null, token = null) {
  const url = `${TEST_CONFIG.baseUrl}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    const responseData = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data: responseData
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Test functions
async function testGetTopics() {
  console.log('🧪 Testing: Get Math Topics');
  const result = await makeRequest('/api/client/math/topics');
  
  if (result.success) {
    console.log('✅ Topics retrieved:', result.data);
    return true;
  } else {
    console.log('❌ Failed to get topics:', result.error || result.data);
    return false;
  }
}

async function testGetDifficulties() {
  console.log('🧪 Testing: Get Math Difficulties');
  const result = await makeRequest('/api/client/math/difficulties');
  
  if (result.success) {
    console.log('✅ Difficulties retrieved:', result.data);
    return true;
  } else {
    console.log('❌ Failed to get difficulties:', result.error || result.data);
    return false;
  }
}

async function testGenerateProblem() {
  console.log('🧪 Testing: Generate Math Problem');
  const result = await makeRequest('/api/client/math/generate', 'POST', {
    topic: TEST_DATA.topic,
    difficulty: TEST_DATA.difficulty
  }, TEST_CONFIG.token);
  
  if (result.success) {
    console.log('✅ Problem generated:', result.data);
    return result.data.id; // Return problem ID for further tests
  } else {
    console.log('❌ Failed to generate problem:', result.error || result.data);
    return null;
  }
}

async function testSolveProblem(problemId) {
  console.log('🧪 Testing: Solve Math Problem');
  const result = await makeRequest('/api/client/math/solve', 'POST', {
    problem_id: problemId,
    user_solution: TEST_DATA.userSolution
  }, TEST_CONFIG.token);
  
  if (result.success) {
    console.log('✅ Solution checked:', result.data);
    return true;
  } else {
    console.log('❌ Failed to solve problem:', result.error || result.data);
    return false;
  }
}

async function testGetProblem(problemId) {
  console.log('🧪 Testing: Get Math Problem by ID');
  const result = await makeRequest(`/api/client/math/problem/${problemId}`, 'GET', null, TEST_CONFIG.token);
  
  if (result.success) {
    console.log('✅ Problem retrieved:', result.data);
    return true;
  } else {
    console.log('❌ Failed to get problem:', result.error || result.data);
    return false;
  }
}

async function testGetHistory() {
  console.log('🧪 Testing: Get Math History');
  const result = await makeRequest('/api/client/math/history', 'GET', null, TEST_CONFIG.token);
  
  if (result.success) {
    console.log('✅ History retrieved:', result.data);
    return true;
  } else {
    console.log('❌ Failed to get history:', result.error || result.data);
    return false;
  }
}

async function testGetStats() {
  console.log('🧪 Testing: Get Math Statistics');
  const result = await makeRequest('/api/client/math/stats', 'GET', null, TEST_CONFIG.token);
  
  if (result.success) {
    console.log('✅ Stats retrieved:', result.data);
    return true;
  } else {
    console.log('❌ Failed to get stats:', result.error || result.data);
    return false;
  }
}

async function testGetHelp(problemId) {
  console.log('🧪 Testing: Get Math Help');
  const result = await makeRequest('/api/client/math/help', 'POST', {
    problem_id: problemId,
    question: 'How do I solve this problem?'
  }, TEST_CONFIG.token);
  
  if (result.success) {
    console.log('✅ Help retrieved:', result.data);
    return true;
  } else {
    console.log('❌ Failed to get help:', result.error || result.data);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Math API Tests...\n');
  
  const results = {
    getTopics: false,
    getDifficulties: false,
    generateProblem: false,
    solveProblem: false,
    getProblem: false,
    getHistory: false,
    getStats: false,
    getHelp: false
  };

  let problemId = null;

  try {
    // Test basic endpoints (no auth required)
    results.getTopics = await testGetTopics();
    console.log('');
    
    results.getDifficulties = await testGetDifficulties();
    console.log('');

    // Test endpoints that require authentication
    if (TEST_CONFIG.token) {
      results.generateProblem = await testGenerateProblem();
      if (results.generateProblem) {
        problemId = results.generateProblem;
        console.log('');
      }

      if (problemId) {
        results.solveProblem = await testSolveProblem(problemId);
        console.log('');

        results.getProblem = await testGetProblem(problemId);
        console.log('');

        results.getHelp = await testGetHelp(problemId);
        console.log('');
      }

      results.getHistory = await testGetHistory();
      console.log('');

      results.getStats = await testGetStats();
      console.log('');
    } else {
      console.log('⚠️  Skipping authenticated tests (no token provided)');
    }

  } catch (error) {
    console.log('❌ Test runner error:', error.message);
  }

  // Summary
  console.log('📊 Test Results Summary:');
  console.log('========================');
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Math API is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the backend server and authentication.');
  }
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  makeRequest,
  testGetTopics,
  testGetDifficulties,
  testGenerateProblem,
  testSolveProblem,
  testGetProblem,
  testGetHistory,
  testGetStats,
  testGetHelp
};



