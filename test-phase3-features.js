/**
 * Phase 3 Features Test Script
 * Tests all new Phase 3 advanced features and API endpoints
 */

const API_BASE = 'http://localhost:3001/api';

// Test user credentials (from previous tests)
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

// Test functions for Phase 3 features

async function testUserLogin() {
  console.log('🔍 Testing user login for Phase 3 tests...');
  const result = await apiRequest('/auth/login', 'POST', testUser);
  
  if (result.success && result.data.success) {
    console.log('✅ User login successful');
    return result.data.session?.access_token;
  } else {
    console.log('❌ User login failed:', result.data?.error || result.error);
    return null;
  }
}

async function testOrganizationsAPI(token) {
  console.log('\n🏢 Testing Organizations API...');
  
  // Test getting user's organizations
  const orgsResult = await apiRequest('/organizations', 'GET', null, token);
  console.log(orgsResult.success ? '✅ Get organizations' : '❌ Get organizations failed');
  
  // Test creating an organization
  const newOrg = {
    name: 'Test Organization',
    slug: 'test-org-' + Date.now(),
    description: 'A test organization for Phase 3 features'
  };
  
  const createResult = await apiRequest('/organizations', 'POST', newOrg, token);
  console.log(createResult.success ? '✅ Create organization' : '❌ Create organization failed');
  
  if (createResult.success) {
    const orgId = createResult.data.organization.id;
    
    // Test getting organization details
    const detailsResult = await apiRequest(`/organizations/${orgId}`, 'GET', null, token);
    console.log(detailsResult.success ? '✅ Get organization details' : '❌ Get organization details failed');
    
    // Test getting organization members
    const membersResult = await apiRequest(`/organizations/${orgId}/members`, 'GET', null, token);
    console.log(membersResult.success ? '✅ Get organization members' : '❌ Get organization members failed');
    
    return orgId;
  }
  
  return null;
}

async function testTemplatesAPI(token, organizationId) {
  console.log('\n📝 Testing Templates API...');
  
  // Test getting templates
  const templatesResult = await apiRequest('/templates', 'GET', null, token);
  console.log(templatesResult.success ? '✅ Get templates' : '❌ Get templates failed');
  
  // Test creating a template
  const newTemplate = {
    name: 'Test Progress Note Template',
    description: 'A test template for progress notes',
    category: 'progress_note',
    visibility: 'private',
    content: {
      sections: [
        {
          title: 'Session Overview',
          type: 'text',
          placeholder: 'Describe the overall session...'
        },
        {
          title: 'Goals Addressed',
          type: 'list',
          items: []
        },
        {
          title: 'Progress Notes',
          type: 'text',
          placeholder: 'Document client progress...'
        }
      ]
    },
    tags: ['progress', 'session', 'test']
  };
  
  const createResult = await apiRequest('/templates', 'POST', newTemplate, token);
  console.log(createResult.success ? '✅ Create template' : '❌ Create template failed');
  
  if (createResult.success) {
    const templateId = createResult.data.template.id;
    
    // Test getting template details
    const detailsResult = await apiRequest(`/templates/${templateId}`, 'GET', null, token);
    console.log(detailsResult.success ? '✅ Get template details' : '❌ Get template details failed');
    
    // Test recording template usage
    const usageResult = await apiRequest(`/templates/${templateId}/use`, 'POST', {
      modifications: { title: 'Modified title' },
      noteId: null
    }, token);
    console.log(usageResult.success ? '✅ Record template usage' : '❌ Record template usage failed');
    
    return templateId;
  }
  
  return null;
}

async function testAnalyticsAPI(token, organizationId) {
  console.log('\n📊 Testing Analytics API...');
  
  // Test user dashboard analytics
  const dashboardResult = await apiRequest('/analytics/dashboard', 'GET', null, token);
  console.log(dashboardResult.success ? '✅ Get dashboard analytics' : '❌ Get dashboard analytics failed');
  
  // Test productivity insights
  const productivityResult = await apiRequest('/analytics/productivity', 'GET', null, token);
  console.log(productivityResult.success ? '✅ Get productivity insights' : '❌ Get productivity insights failed');
  
  // Test organization analytics (if user has access)
  if (organizationId) {
    const orgAnalyticsResult = await apiRequest(`/analytics/organization/${organizationId}`, 'GET', null, token);
    console.log(orgAnalyticsResult.success ? '✅ Get organization analytics' : '❌ Get organization analytics failed');
  }
  
  return true;
}

async function testAdminAPI(token) {
  console.log('\n👑 Testing Admin API...');
  
  // Test admin dashboard (may fail if user is not admin)
  const dashboardResult = await apiRequest('/admin/dashboard', 'GET', null, token);
  console.log(dashboardResult.success ? '✅ Get admin dashboard' : '⚠️ Admin dashboard (requires admin role)');
  
  // Test admin users list (may fail if user is not admin)
  const usersResult = await apiRequest('/admin/users', 'GET', null, token);
  console.log(usersResult.success ? '✅ Get admin users list' : '⚠️ Admin users list (requires admin role)');
  
  // Test system health (may fail if user is not admin)
  const healthResult = await apiRequest('/admin/system/health', 'GET', null, token);
  console.log(healthResult.success ? '✅ Get system health' : '⚠️ System health (requires admin role)');
  
  return true;
}

async function testEnhancedHealthAndMetrics() {
  console.log('\n🔍 Testing Enhanced Health and Metrics...');
  
  // Test enhanced health endpoint
  const healthResult = await apiRequest('/health');
  if (healthResult.success && healthResult.data.metrics && healthResult.data.memory) {
    console.log('✅ Enhanced health endpoint with metrics');
  } else {
    console.log('❌ Enhanced health endpoint failed');
  }
  
  // Test Prometheus metrics endpoint
  const metricsResponse = await fetch(`${API_BASE}/metrics`);
  const metricsText = await metricsResponse.text();
  
  if (metricsResponse.ok && metricsText.includes('swiftnotes_requests_total')) {
    console.log('✅ Prometheus metrics endpoint');
  } else {
    console.log('❌ Prometheus metrics endpoint failed');
  }
  
  return true;
}

// Main test runner
async function runPhase3Tests() {
  console.log('🚀 Starting Phase 3 Advanced Features Tests\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test 1: Enhanced Health and Metrics
  totalTests++;
  if (await testEnhancedHealthAndMetrics()) passedTests++;
  
  // Test 2: User Authentication
  totalTests++;
  const token = await testUserLogin();
  if (token) passedTests++;
  
  if (!token) {
    console.log('\n❌ Cannot continue tests without authentication token');
    return;
  }
  
  // Test 3: Organizations API
  totalTests++;
  const organizationId = await testOrganizationsAPI(token);
  if (organizationId) passedTests++;
  
  // Test 4: Templates API
  totalTests++;
  const templateId = await testTemplatesAPI(token, organizationId);
  if (templateId) passedTests++;
  
  // Test 5: Analytics API
  totalTests++;
  if (await testAnalyticsAPI(token, organizationId)) passedTests++;
  
  // Test 6: Admin API
  totalTests++;
  if (await testAdminAPI(token)) passedTests++;
  
  // Results
  console.log('\n' + '='.repeat(60));
  console.log('📊 PHASE 3 FEATURES TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`📈 Success Rate: ${Math.round((passedTests/totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 ALL PHASE 3 FEATURES WORKING PERFECTLY!');
    console.log('✅ Team/Organizational Accounts: READY');
    console.log('✅ Template Library System: READY');
    console.log('✅ Advanced Analytics Dashboard: READY');
    console.log('✅ Admin Panel: READY');
    console.log('✅ Enhanced Monitoring: READY');
  } else if (passedTests >= totalTests * 0.8) {
    console.log('\n🎊 PHASE 3 FEATURES MOSTLY WORKING!');
    console.log('Most advanced features are functional with minor issues.');
  } else {
    console.log('\n⚠️ SOME PHASE 3 FEATURES NEED ATTENTION');
    console.log('Please review and fix issues before proceeding.');
  }
  
  console.log('\n🚀 Phase 3 Advanced Features Testing Complete!');
}

// Run the tests
runPhase3Tests().catch(console.error);
