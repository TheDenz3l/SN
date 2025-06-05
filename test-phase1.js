/**
 * Phase 1 MVP Test Script
 * Tests all critical functionality for SwiftNotes Phase 1 completion
 */

const API_BASE = 'http://localhost:3001/api';

// Test data
const testUser = {
  email: 'phase1test@swiftnotes.app',
  password: 'Test123!',
  firstName: 'Phase1',
  lastName: 'Tester'
};

const setupData = {
  writingStyle: 'The individual demonstrated significant progress in their communication goals during today\'s session. They successfully completed three verbal requests using appropriate tone and volume. The participant showed improved eye contact and engaged in turn-taking activities for approximately 15 minutes. Overall, the session was productive and the client appeared motivated to continue working on their objectives.',
  ispTasks: [
    { description: 'Communication goals - verbal requests' },
    { description: 'Social interaction - turn-taking' },
    { description: 'Behavioral objectives - attention span' }
  ]
};

// Helper function to make API requests
async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    method,
    headers
  };
  
  if (body) {
    config.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Test functions
async function testHealthCheck() {
  console.log('🔍 Testing API health check...');
  const result = await apiRequest('/health');
  
  if (result.success) {
    console.log('✅ API health check passed');
    return true;
  } else {
    console.log('❌ API health check failed:', result.error);
    return false;
  }
}

async function testUserRegistration() {
  console.log('🔍 Testing user registration...');
  const result = await apiRequest('/auth/register', 'POST', testUser);
  
  if (result.success && result.data.success) {
    console.log('✅ User registration passed');
    return result.data.user;
  } else {
    console.log('❌ User registration failed:', result.data?.error || result.error);
    return null;
  }
}

async function testUserLogin() {
  console.log('🔍 Testing user login...');
  const result = await apiRequest('/auth/login', 'POST', {
    email: testUser.email,
    password: testUser.password
  });
  
  if (result.success && result.data.success) {
    console.log('✅ User login passed');
    return result.data.session?.access_token;
  } else {
    console.log('❌ User login failed:', result.data?.error || result.error);
    return null;
  }
}

async function testSetupCompletion(token) {
  console.log('🔍 Testing setup completion...');
  const result = await apiRequest('/user/complete-setup', 'POST', setupData, token);
  
  if (result.success) {
    console.log('✅ Setup completion passed');
    return true;
  } else {
    console.log('❌ Setup completion failed:', result.data?.error || result.error);
    return false;
  }
}

async function testISPTasksRetrieval(token) {
  console.log('🔍 Testing ISP tasks retrieval...');
  const result = await apiRequest('/isp-tasks', 'GET', null, token);
  
  if (result.success && result.data.tasks) {
    console.log('✅ ISP tasks retrieval passed');
    console.log(`   Found ${result.data.tasks.length} tasks`);
    return result.data.tasks;
  } else {
    console.log('❌ ISP tasks retrieval failed:', result.data?.error || result.error);
    return null;
  }
}

async function testNoteGeneration(token, tasks) {
  console.log('🔍 Testing note generation...');
  
  const noteRequest = {
    title: 'Test Progress Note',
    sections: [
      {
        taskId: tasks[0]?.id,
        prompt: 'Client showed improvement in verbal communication today',
        type: 'task'
      },
      {
        prompt: 'Overall session was productive and client was engaged',
        type: 'comment'
      }
    ]
  };
  
  const result = await apiRequest('/ai/generate', 'POST', noteRequest, token);
  
  if (result.success) {
    console.log('✅ Note generation passed');
    return result.data;
  } else {
    console.log('❌ Note generation failed:', result.data?.error || result.error);
    return null;
  }
}

async function testUserProfile(token) {
  console.log('🔍 Testing user profile retrieval...');
  const result = await apiRequest('/user/profile', 'GET', null, token);
  
  if (result.success) {
    console.log('✅ User profile retrieval passed');
    return result.data;
  } else {
    console.log('❌ User profile retrieval failed:', result.data?.error || result.error);
    return null;
  }
}

// Main test runner
async function runPhase1Tests() {
  console.log('🚀 Starting Phase 1 MVP Tests\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: Health Check
  totalTests++;
  if (await testHealthCheck()) passedTests++;
  console.log('');
  
  // Test 2: User Registration
  totalTests++;
  const user = await testUserRegistration();
  if (user) passedTests++;
  console.log('');
  
  // Test 3: User Login
  totalTests++;
  const token = await testUserLogin();
  if (token) passedTests++;
  console.log('');
  
  if (!token) {
    console.log('❌ Cannot continue tests without authentication token');
    return;
  }
  
  // Test 4: Setup Completion
  totalTests++;
  if (await testSetupCompletion(token)) passedTests++;
  console.log('');
  
  // Test 5: ISP Tasks Retrieval
  totalTests++;
  const tasks = await testISPTasksRetrieval(token);
  if (tasks) passedTests++;
  console.log('');
  
  // Test 6: Note Generation
  totalTests++;
  if (tasks && await testNoteGeneration(token, tasks)) passedTests++;
  console.log('');
  
  // Test 7: User Profile
  totalTests++;
  if (await testUserProfile(token)) passedTests++;
  console.log('');
  
  // Results
  console.log('📊 Test Results:');
  console.log(`   Passed: ${passedTests}/${totalTests}`);
  console.log(`   Success Rate: ${Math.round((passedTests/totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All Phase 1 tests passed! MVP is ready for deployment.');
  } else {
    console.log('⚠️  Some tests failed. Please review and fix issues before deployment.');
  }
}

// Run the tests
runPhase1Tests().catch(console.error);
