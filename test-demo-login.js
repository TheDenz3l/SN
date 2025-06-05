/**
 * Test Demo Login Script
 * Tests the demo user login through the backend API
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api';

async function testDemoLogin() {
  console.log('🧪 Testing Demo User Login through Backend API...');
  
  const demoCredentials = {
    email: 'demo@swiftnotes.app',
    password: 'demo123'
  };

  try {
    // Test login
    console.log('🔐 Attempting login...');
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(demoCredentials)
    });

    const loginResult = await loginResponse.json();
    
    if (!loginResponse.ok) {
      console.error('❌ Login failed:', loginResult);
      return;
    }

    console.log('✅ Login successful!');
    console.log('   User ID:', loginResult.user.id);
    console.log('   Email:', loginResult.user.email);
    console.log('   Name:', `${loginResult.user.firstName} ${loginResult.user.lastName}`);
    console.log('   Tier:', loginResult.user.tier);
    console.log('   Credits:', loginResult.user.credits);

    // Test getting user profile with token
    if (loginResult.session && loginResult.session.access_token) {
      console.log('\n🔍 Testing profile access...');
      console.log('   Using token:', loginResult.session.access_token.substring(0, 50) + '...');

      const profileResponse = await fetch(`${API_BASE}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${loginResult.session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const profileResult = await profileResponse.json();

      if (!profileResponse.ok) {
        console.error('❌ Profile access failed:', profileResult);
        console.error('   Status:', profileResponse.status);
        console.error('   Headers:', Object.fromEntries(profileResponse.headers.entries()));
      } else {
        console.log('✅ Profile access successful!');
        console.log('   Profile data:', profileResult.user);
      }
    }

    console.log('\n🎉 Demo Login Test Complete!');
    console.log('📋 Demo Credentials Confirmed Working:');
    console.log(`   Email: ${demoCredentials.email}`);
    console.log(`   Password: ${demoCredentials.password}`);

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the test
testDemoLogin().catch(console.error);
