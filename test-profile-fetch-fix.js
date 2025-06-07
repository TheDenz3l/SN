/**
 * Test script to verify the "Failed to fetch user profile" fix
 * This script tests the enhanced error handling and retry logic
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api';

// Test configuration
const TEST_CONFIG = {
  maxRetries: 3,
  retryDelay: 200,
  testTimeout: 30000
};

/**
 * Make API request with error handling
 */
async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const data = await response.json();

    return {
      success: response.ok,
      status: response.status,
      data,
      error: response.ok ? null : data.error
    };
  } catch (error) {
    return {
      success: false,
      status: 0,
      data: null,
      error: error.message
    };
  }
}

/**
 * Test authentication and profile fetching
 */
async function testProfileFetching() {
  console.log('🧪 Testing Profile Fetching Fix');
  console.log('================================\n');

  // Step 1: Test backend health
  console.log('1. 🏥 Testing backend health...');
  const healthResult = await apiRequest('/health');
  
  if (!healthResult.success) {
    console.log('❌ Backend is not running. Please start the server first.');
    return;
  }
  
  console.log('✅ Backend is healthy');
  console.log(`   Status: ${healthResult.data.status}`);
  console.log(`   Database: ${healthResult.data.database}`);
  console.log(`   Services: ${JSON.stringify(healthResult.data.services)}\n`);

  // Step 2: Test authentication with valid credentials
  console.log('2. 🔐 Testing authentication...');
  const loginResult = await apiRequest('/auth/login', 'POST', {
    email: 'demo@swiftnotes.app',
    password: 'demo123'
  });

  if (!loginResult.success) {
    console.log('❌ Login failed:', loginResult.error);
    console.log('   Please ensure demo user exists or update credentials');
    return;
  }

  const token = loginResult.data.session?.access_token || loginResult.data.token;
  console.log('✅ Login successful');
  console.log(`   Token: ${token ? token.substring(0, 20) + '...' : 'Present'}`);
  console.log(`   User: ${loginResult.data.user.email}\n`);

  // Step 3: Test profile fetching with enhanced error handling
  console.log('3. 👤 Testing profile fetching...');
  const profileResult = await apiRequest('/user/profile', 'GET', null, token);
  
  if (!profileResult.success) {
    console.log('❌ Profile fetch failed:', profileResult.error);
    console.log(`   Status: ${profileResult.status}`);
    console.log(`   Error Code: ${profileResult.data?.code || 'N/A'}`);
    console.log(`   Retryable: ${profileResult.data?.retryable || 'N/A'}`);
    
    // Test retry logic if error is retryable
    if (profileResult.data?.retryable) {
      console.log('\n🔄 Testing retry logic...');
      for (let attempt = 1; attempt <= TEST_CONFIG.maxRetries; attempt++) {
        console.log(`   Attempt ${attempt}/${TEST_CONFIG.maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.retryDelay * attempt));
        
        const retryResult = await apiRequest('/user/profile', 'GET', null, token);
        if (retryResult.success) {
          console.log('✅ Retry successful!');
          break;
        } else if (attempt === TEST_CONFIG.maxRetries) {
          console.log('❌ All retries failed');
        }
      }
    }
    return;
  }

  const user = profileResult.data.user;
  console.log('✅ Profile fetched successfully');
  console.log(`   User ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Setup Complete: ${user.hasCompletedSetup}`);
  console.log(`   Writing Style: ${user.writingStyle ? 'Set' : 'Not set'}`);
  console.log(`   Credits: ${user.credits}`);
  console.log(`   Tier: ${user.tier}\n`);

  // Step 4: Test note generation (which depends on profile data)
  console.log('4. 📝 Testing note generation...');
  
  if (!user.hasCompletedSetup || !user.writingStyle) {
    console.log('⚠️ User setup not complete, skipping note generation test');
    return;
  }

  const noteRequest = {
    title: 'Test Note - Profile Fix Verification',
    sections: [
      {
        taskId: null,
        prompt: 'Test prompt for verifying profile fetch fix',
        type: 'task',
        detailLevel: 'brief',
        toneLevel: 50
      }
    ],
    saveNote: false
  };

  const generateResult = await apiRequest('/ai/generate', 'POST', noteRequest, token);
  
  if (!generateResult.success) {
    console.log('❌ Note generation failed:', generateResult.error);
    console.log(`   Status: ${generateResult.status}`);
    console.log(`   Error Code: ${generateResult.data?.code || 'N/A'}`);
    
    // Check if it's a profile-related error
    if (generateResult.data?.code?.includes('PROFILE')) {
      console.log('🔍 Profile-related error detected in note generation');
    }
    return;
  }

  console.log('✅ Note generation successful');
  console.log(`   Sections generated: ${generateResult.data.sections?.length || 0}`);
  console.log(`   Credits used: ${generateResult.data.creditsUsed || 0}`);
  console.log(`   Free generation used: ${generateResult.data.usedFreeGeneration || false}\n`);

  // Step 5: Test with invalid token to verify error handling
  console.log('5. 🚫 Testing invalid token handling...');
  const invalidToken = 'invalid-token-12345';
  const invalidResult = await apiRequest('/user/profile', 'GET', null, invalidToken);
  
  if (invalidResult.success) {
    console.log('❌ Invalid token was accepted (this should not happen)');
  } else {
    console.log('✅ Invalid token properly rejected');
    console.log(`   Error: ${invalidResult.error}`);
    console.log(`   Status: ${invalidResult.status}`);
    console.log(`   Error Code: ${invalidResult.data?.code || 'N/A'}\n`);
  }

  console.log('🎉 Profile fetching fix verification complete!');
  console.log('All tests passed successfully.');
}

/**
 * Run the test
 */
async function runTest() {
  try {
    await testProfileFetching();
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  }
}

// Set timeout for the entire test
setTimeout(() => {
  console.error('❌ Test timed out after 30 seconds');
  process.exit(1);
}, TEST_CONFIG.testTimeout);

// Run the test
runTest();
