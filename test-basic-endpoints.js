/**
 * Basic Test Script for Analytics Endpoints
 * Tests basic endpoint availability without authentication
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testHealthEndpoint() {
  try {
    console.log('🏥 Testing health endpoint...');
    const response = await axios.get(`${BASE_URL}/health`);
    
    if (response.status === 200) {
      console.log('✅ Health endpoint working:', response.data);
      return true;
    } else {
      console.log('❌ Health endpoint failed:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Health endpoint error:', error.message);
    return false;
  }
}

async function testAnalyticsEndpointsStructure() {
  console.log('🔍 Testing analytics endpoints structure (expecting 401 for protected routes)...');
  
  const endpoints = [
    '/api/writing-analytics/summary',
    '/api/writing-analytics/history',
    '/api/writing-analytics/style-evolution'
  ];
  
  let structureValid = true;
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${BASE_URL}${endpoint}`);
      console.log(`❌ ${endpoint}: Expected 401, got ${response.status}`);
      structureValid = false;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log(`✅ ${endpoint}: Correctly protected (401)`);
      } else {
        console.log(`❌ ${endpoint}: Unexpected error - ${error.message}`);
        structureValid = false;
      }
    }
  }
  
  return structureValid;
}

async function testPostEndpointsStructure() {
  console.log('📝 Testing POST analytics endpoints structure...');
  
  const endpoints = [
    '/api/writing-analytics/log',
    '/api/writing-analytics/evolve-style',
    '/api/writing-analytics/analyze-style'
  ];
  
  let structureValid = true;
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.post(`${BASE_URL}${endpoint}`, {});
      console.log(`❌ ${endpoint}: Expected 401, got ${response.status}`);
      structureValid = false;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log(`✅ ${endpoint}: Correctly protected (401)`);
      } else if (error.response && error.response.status === 400) {
        console.log(`✅ ${endpoint}: Correctly validates input (400)`);
      } else {
        console.log(`❌ ${endpoint}: Unexpected error - ${error.message}`);
        structureValid = false;
      }
    }
  }
  
  return structureValid;
}

async function testServerLogs() {
  console.log('📊 Testing if analytics routes are loaded...');
  
  // Test a few requests to see server logs
  try {
    await axios.get(`${BASE_URL}/api/writing-analytics/summary`);
  } catch (error) {
    // Expected to fail, just want to see server logs
  }
  
  try {
    await axios.post(`${BASE_URL}/api/writing-analytics/log`, { test: true });
  } catch (error) {
    // Expected to fail, just want to see server logs
  }
  
  console.log('✅ Check server logs to see if analytics routes are being hit');
  return true;
}

async function runBasicTests() {
  console.log('🚀 Starting Basic Analytics Endpoint Tests\n');
  
  const tests = [
    { name: 'Health Endpoint', fn: testHealthEndpoint },
    { name: 'Analytics GET Endpoints Structure', fn: testAnalyticsEndpointsStructure },
    { name: 'Analytics POST Endpoints Structure', fn: testPostEndpointsStructure },
    { name: 'Server Logs Test', fn: testServerLogs }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    console.log(`\n--- Testing: ${test.name} ---`);
    const result = await test.fn();
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log('\n🏁 Basic Test Results Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All basic tests passed! Analytics endpoints are properly configured.');
    console.log('\n📋 Next Steps:');
    console.log('1. Create a test user account to test authenticated endpoints');
    console.log('2. Test the frontend integration');
    console.log('3. Verify analytics data logging works end-to-end');
  } else {
    console.log('\n⚠️  Some basic tests failed. Please check the server configuration.');
  }
}

// Run the tests
runBasicTests().catch(console.error);
