#!/usr/bin/env node

/**
 * Test Login Fix - Verify the login functionality works correctly
 * Tests both API connectivity and frontend authentication flow
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api';
const FRONTEND_URL = 'http://localhost:5173';

// Test credentials
const TEST_CREDENTIALS = {
  email: 'demo@swiftnotes.app',
  password: 'demo123'
};

async function testBackendHealth() {
  console.log('🔍 Testing backend health...');
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Backend is healthy');
      console.log(`   Status: ${data.status}`);
      console.log(`   Uptime: ${data.uptime}s`);
      return true;
    } else {
      console.log('❌ Backend health check failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Backend is not running');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testFrontendConnectivity() {
  console.log('\n🔍 Testing frontend connectivity...');
  try {
    const response = await fetch(FRONTEND_URL);
    
    if (response.ok) {
      console.log('✅ Frontend is accessible');
      return true;
    } else {
      console.log('❌ Frontend connectivity failed');
      return false;
    }
  } catch (error) {
    console.log('❌ Frontend is not running');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testLoginAPI() {
  console.log('\n🔍 Testing login API...');
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(TEST_CREDENTIALS),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('✅ Login API works correctly');
      console.log(`   User: ${data.user.firstName} ${data.user.lastName}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Tier: ${data.user.tier}`);
      console.log(`   Credits: ${data.user.credits}`);
      console.log(`   Token: ${data.session.access_token.substring(0, 20)}...`);
      return { success: true, token: data.session.access_token, user: data.user };
    } else {
      console.log('❌ Login API failed');
      console.log(`   Error: ${data.error || 'Unknown error'}`);
      return { success: false };
    }
  } catch (error) {
    console.log('❌ Login API request failed');
    console.log(`   Error: ${error.message}`);
    return { success: false };
  }
}

async function testAuthenticatedRequest(token) {
  console.log('\n🔍 Testing authenticated request...');
  try {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Authenticated request works');
      console.log(`   Profile loaded for: ${data.user.email}`);
      return true;
    } else {
      console.log('❌ Authenticated request failed');
      console.log(`   Error: ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.log('❌ Authenticated request failed');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testEnvironmentConfiguration() {
  console.log('\n🔍 Testing environment configuration...');
  
  // Check if .env file has correct API URL
  const fs = require('fs');
  const path = require('path');
  
  try {
    const envPath = path.join(__dirname, 'frontend', '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    if (envContent.includes('VITE_API_URL=http://localhost:3001/api')) {
      console.log('✅ Frontend .env has correct API URL');
      return true;
    } else {
      console.log('❌ Frontend .env has incorrect API URL');
      console.log('   Expected: VITE_API_URL=http://localhost:3001/api');
      return false;
    }
  } catch (error) {
    console.log('❌ Could not read frontend .env file');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 SwiftNotes Login Fix Verification\n');
  console.log('=' .repeat(50));
  
  const results = {
    backendHealth: false,
    frontendConnectivity: false,
    environmentConfig: false,
    loginAPI: false,
    authenticatedRequest: false
  };

  // Test 1: Backend Health
  results.backendHealth = await testBackendHealth();

  // Test 2: Frontend Connectivity
  results.frontendConnectivity = await testFrontendConnectivity();

  // Test 3: Environment Configuration
  results.environmentConfig = await testEnvironmentConfiguration();

  // Test 4: Login API
  const loginResult = await testLoginAPI();
  results.loginAPI = loginResult.success;

  // Test 5: Authenticated Request (if login succeeded)
  if (loginResult.success && loginResult.token) {
    results.authenticatedRequest = await testAuthenticatedRequest(loginResult.token);
  }

  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(50));
  
  const allPassed = Object.values(results).every(result => result === true);
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} ${testName}`);
  });

  console.log('\n' + '=' .repeat(50));
  
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED! Login functionality is working correctly.');
    console.log('\n📝 Next Steps:');
    console.log('   1. Open http://localhost:5173 in your browser');
    console.log('   2. Try logging in with demo@swiftnotes.app / demo123');
    console.log('   3. Verify you can access the dashboard');
  } else {
    console.log('⚠️  SOME TESTS FAILED! Please check the issues above.');
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Ensure backend is running: npm run dev (in backend folder)');
    console.log('   2. Ensure frontend is running: npm run dev (in frontend folder)');
    console.log('   3. Check .env configuration matches backend port');
  }
  
  console.log('=' .repeat(50));
}

// Run the tests
runTests().catch(console.error);
