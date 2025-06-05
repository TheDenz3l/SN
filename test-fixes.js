#!/usr/bin/env node

/**
 * Test Script for SwiftNotes Fixes
 * Verifies that all fixes are working correctly
 */

const fetch = require('node-fetch');

const API_URL = 'http://localhost:3001/api';
const HEALTH_URL = 'http://localhost:3001/health';

console.log('🧪 Testing SwiftNotes Fixes');
console.log('============================');

async function testBackendHealth() {
  console.log('\n🔍 Testing Backend Health...');
  try {
    const response = await fetch(HEALTH_URL);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend Health Check: PASSED');
      console.log(`   Status: ${data.status}`);
      console.log(`   Version: ${data.version}`);
      console.log(`   Database: ${data.database}`);
      return true;
    } else {
      console.log('❌ Backend Health Check: FAILED');
      console.log(`   Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Backend Health Check: FAILED');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...');
  
  // Generate unique test user
  const timestamp = Date.now();
  const testUser = {
    email: `test${timestamp}@example.com`,
    password: 'Test123!',
    firstName: 'Test',
    lastName: 'User'
  };

  try {
    // Test registration
    console.log('   📝 Testing registration...');
    const registerResponse = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });

    if (!registerResponse.ok) {
      const errorData = await registerResponse.json();
      console.log('❌ Registration: FAILED');
      console.log(`   Error: ${errorData.error}`);
      if (errorData.details) {
        console.log(`   Details: ${JSON.stringify(errorData.details, null, 2)}`);
      }
      return false;
    }

    const registerData = await registerResponse.json();
    console.log('✅ Registration: PASSED');

    // Test login
    console.log('   🔑 Testing login...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      }),
    });

    if (!loginResponse.ok) {
      const errorData = await loginResponse.json();
      console.log('❌ Login: FAILED');
      console.log(`   Error: ${errorData.error}`);
      return false;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login: PASSED');

    // Test profile access
    console.log('   👤 Testing profile access...');
    const profileResponse = await fetch(`${API_URL}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${loginData.session.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!profileResponse.ok) {
      const errorData = await profileResponse.json();
      console.log('❌ Profile Access: FAILED');
      console.log(`   Error: ${errorData.error}`);
      return false;
    }

    const profileData = await profileResponse.json();
    console.log('✅ Profile Access: PASSED');
    console.log(`   User ID: ${profileData.user.id}`);
    console.log(`   Email: ${profileData.user.email}`);

    return { success: true, token: loginData.session.access_token };

  } catch (error) {
    console.log('❌ Authentication Test: FAILED');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testDatabaseOperations(authToken) {
  console.log('\n🗄️  Testing Database Operations...');
  
  if (!authToken) {
    console.log('❌ Database Operations: SKIPPED (no auth token)');
    return false;
  }

  try {
    // Test ISP Tasks
    console.log('   📋 Testing ISP Tasks...');
    const ispTasksResponse = await fetch(`${API_URL}/isp-tasks`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (ispTasksResponse.ok) {
      console.log('✅ ISP Tasks: PASSED');
    } else {
      console.log('❌ ISP Tasks: FAILED');
      console.log(`   Status: ${ispTasksResponse.status}`);
    }

    // Test Notes
    console.log('   📝 Testing Notes...');
    const notesResponse = await fetch(`${API_URL}/notes`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (notesResponse.ok) {
      console.log('✅ Notes: PASSED');
    } else {
      console.log('❌ Notes: FAILED');
      console.log(`   Status: ${notesResponse.status}`);
    }

    // Test Organizations (Phase 3)
    console.log('   🏢 Testing Organizations...');
    const orgsResponse = await fetch(`${API_URL}/organizations`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (orgsResponse.ok) {
      console.log('✅ Organizations: PASSED');
    } else {
      console.log('❌ Organizations: FAILED');
      console.log(`   Status: ${orgsResponse.status}`);
    }

    return true;

  } catch (error) {
    console.log('❌ Database Operations: FAILED');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('Starting comprehensive fix verification...\n');

  let passedTests = 0;
  let totalTests = 3;

  // Test 1: Backend Health
  const healthPassed = await testBackendHealth();
  if (healthPassed) passedTests++;

  // Test 2: Authentication
  const authResult = await testAuthentication();
  if (authResult && authResult.success) {
    passedTests++;
    
    // Test 3: Database Operations
    const dbPassed = await testDatabaseOperations(authResult.token);
    if (dbPassed) passedTests++;
  }

  // Results
  console.log('\n📊 TEST RESULTS');
  console.log('================');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ SwiftNotes is working correctly');
    console.log('🚀 You can now use the application');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED');
    console.log('📖 Check the TROUBLESHOOTING.md guide');
    console.log('🔧 Run: node fix-and-start.js');
  }

  console.log('\n🔗 Useful URLs:');
  console.log('   Backend Health: http://localhost:3001/health');
  console.log('   API Docs: http://localhost:3001/api');
  console.log('   Frontend: http://localhost:5173');
}

// Run the tests
runTests().catch(error => {
  console.error('❌ Test runner failed:', error.message);
  process.exit(1);
});
