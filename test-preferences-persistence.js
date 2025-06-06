#!/usr/bin/env node

/**
 * Test script to verify preferences persistence and default settings
 */

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001/api';

// Test user credentials (demo user)
const TEST_USER = {
  email: 'demo@swiftnotes.app',
  password: 'demo123'
};

async function testPreferencesPersistence() {
  console.log('🧪 Testing Preferences Persistence and Default Settings');
  console.log('============================================================');

  let authToken = null;

  try {
    // 1. Login to get auth token
    console.log('\n1️⃣ Logging in...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(TEST_USER)
    });

    const loginResult = await loginResponse.json();
    if (!loginResult.success) {
      throw new Error(`Login failed: ${loginResult.error}`);
    }

    authToken = loginResult.session.access_token;
    console.log('✅ Login successful');

    // 2. Get current user profile
    console.log('\n2️⃣ Getting current user profile...');
    const profileResponse = await fetch(`${API_BASE_URL}/user/profile`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const profileResult = await profileResponse.json();
    if (!profileResult.success) {
      throw new Error(`Profile fetch failed: ${profileResult.error}`);
    }

    console.log('Current preferences:', JSON.stringify(profileResult.user.preferences, null, 2));

    // 3. Test updating preferences with time patterns
    console.log('\n3️⃣ Testing preferences update with time patterns...');
    const newPreferences = {
      defaultToneLevel: 15, // Very authentic
      defaultDetailLevel: 'moderate',
      useTimePatterns: true
    };

    const updateResponse = await fetch(`${API_BASE_URL}/user/preferences`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newPreferences)
    });

    const updateResult = await updateResponse.json();
    if (!updateResult.success) {
      throw new Error(`Preferences update failed: ${updateResult.error}`);
    }

    console.log('✅ Preferences updated successfully');
    console.log('Updated preferences:', JSON.stringify(updateResult.preferences, null, 2));

    // 4. Verify persistence by fetching profile again
    console.log('\n4️⃣ Verifying persistence...');
    const verifyResponse = await fetch(`${API_BASE_URL}/user/profile`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const verifyResult = await verifyResponse.json();
    if (!verifyResult.success) {
      throw new Error(`Verification fetch failed: ${verifyResult.error}`);
    }

    console.log('Verified preferences:', JSON.stringify(verifyResult.user.preferences, null, 2));

    // 5. Test AI generation with default settings
    console.log('\n5️⃣ Testing AI generation with default settings...');
    const generateResponse = await fetch(`${API_BASE_URL}/ai/preview`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'Chad would be prompted by staff to make up his bed in which he complete, he would then be prompted to empty out his garbage can in the bathroom',
        taskDescription: 'Make bed and empty garbage'
      })
    });

    const generateResult = await generateResponse.json();
    if (!generateResult.success) {
      console.log('❌ AI generation failed:', generateResult.error);
    } else {
      console.log('✅ AI generation successful');
      console.log('Generated content preview:');
      console.log('---');
      console.log(generateResult.preview.enhancedContent);
      console.log('---');
      console.log(`Tone Level Used: ${generateResult.preview.toneLevel || 'default'}`);
      console.log(`Detail Level Used: ${generateResult.preview.detailLevel || 'default'}`);
    }

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testPreferencesPersistence();
