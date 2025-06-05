/**
 * Quick Phase 3 Test
 * Tests the current status after RLS and foreign key fixes
 */

const API_BASE = 'http://localhost:3001/api';

// Test user credentials
const testUser = {
  email: 'phase1test@swiftnotes.app',
  password: 'Test123!'
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

async function quickTest() {
  console.log('🚀 QUICK PHASE 3 STATUS TEST');
  console.log('='.repeat(50));
  
  // Login
  console.log('🔐 Testing authentication...');
  const loginResult = await apiRequest('/auth/login', 'POST', testUser);
  
  if (!loginResult.success) {
    console.log('❌ Authentication failed');
    return;
  }
  
  const token = loginResult.data.session?.access_token;
  console.log('✅ Authentication successful');
  
  // Test key endpoints
  const tests = [
    { name: 'Organizations API', endpoint: '/organizations' },
    { name: 'Templates API', endpoint: '/templates' },
    { name: 'Analytics Dashboard', endpoint: '/analytics/dashboard' },
    { name: 'Health Check', endpoint: '/health', noAuth: true },
    { name: 'Metrics', endpoint: '/metrics', noAuth: true }
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const test of tests) {
    console.log(`🔍 Testing ${test.name}...`);
    const result = await apiRequest(test.endpoint, 'GET', null, test.noAuth ? null : token);
    
    if (result.success) {
      console.log(`✅ ${test.name} - Working (${result.status})`);
      passed++;
    } else {
      console.log(`❌ ${test.name} - Failed (${result.status})`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 QUICK TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`📈 Success Rate: ${Math.round((passed/total) * 100)}%`);
  
  if (passed === total) {
    console.log('\n🎉 ALL PHASE 3 API ENDPOINTS WORKING!');
    console.log('Ready for comprehensive testing');
  } else if (passed >= total * 0.8) {
    console.log('\n🎊 PHASE 3 MOSTLY WORKING!');
    console.log('Minor issues remaining');
  } else {
    console.log('\n⚠️ PHASE 3 NEEDS MORE FIXES');
    console.log('Apply foreign key fix if not done yet');
  }
}

quickTest().catch(console.error);
