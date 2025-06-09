#!/usr/bin/env node

/**
 * Comprehensive Notes Page Accessibility Test
 * Tests the complete user journey to access the notes page
 */

const axios = require('axios');
const fs = require('fs');

const API_BASE = 'http://localhost:3001/api';
const FRONTEND_BASE = 'http://localhost:5173';

// Test configuration
const TEST_USER = {
  email: 'test-notes-access@example.com',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User'
};

let authToken = null;
let userId = null;

async function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

async function testBackendHealth() {
  try {
    const response = await axios.get(`${API_BASE}/health`);
    await log('Backend health check passed', 'success');
    return true;
  } catch (error) {
    await log(`Backend health check failed: ${error.message}`, 'error');
    return false;
  }
}

async function testUserRegistration() {
  try {
    // First, try to clean up any existing test user
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        email: TEST_USER.email,
        password: TEST_USER.password
      });
      await log('Test user already exists, proceeding with login');
      return await testUserLogin();
    } catch (error) {
      // User doesn't exist, proceed with registration
    }

    const response = await axios.post(`${API_BASE}/auth/register`, TEST_USER);
    
    if (response.data.success) {
      authToken = response.data.session.access_token;
      userId = response.data.user.id;
      await log('User registration successful', 'success');
      return true;
    } else {
      await log(`Registration failed: ${response.data.error}`, 'error');
      return false;
    }
  } catch (error) {
    await log(`Registration error: ${error.response?.data?.error || error.message}`, 'error');
    return false;
  }
}

async function testUserLogin() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: TEST_USER.email,
      password: TEST_USER.password
    });
    
    if (response.data.success) {
      authToken = response.data.session.access_token;
      userId = response.data.user.id;
      await log('User login successful', 'success');
      return true;
    } else {
      await log(`Login failed: ${response.data.error}`, 'error');
      return false;
    }
  } catch (error) {
    await log(`Login error: ${error.response?.data?.error || error.message}`, 'error');
    return false;
  }
}

async function testNotesAPIAccess() {
  try {
    if (!authToken) {
      await log('No auth token available for notes API test', 'error');
      return false;
    }

    const response = await axios.get(`${API_BASE}/notes`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.data.success !== false) {
      await log('Notes API access successful', 'success');
      await log(`Found ${response.data.notes?.length || 0} notes`);
      return true;
    } else {
      await log(`Notes API access failed: ${response.data.error}`, 'error');
      return false;
    }
  } catch (error) {
    await log(`Notes API error: ${error.response?.data?.error || error.message}`, 'error');
    return false;
  }
}

async function testCreateTestNote() {
  try {
    if (!authToken) {
      await log('No auth token available for note creation', 'error');
      return false;
    }

    const testNote = {
      title: 'Test Note for Accessibility',
      content: { text: 'This is a test note to verify accessibility' },
      noteType: 'general'
    };

    const response = await axios.post(`${API_BASE}/notes`, testNote, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      await log('Test note created successfully', 'success');
      return response.data.note.id;
    } else {
      await log(`Note creation failed: ${response.data.error}`, 'error');
      return false;
    }
  } catch (error) {
    await log(`Note creation error: ${error.response?.data?.error || error.message}`, 'error');
    return false;
  }
}

async function testFrontendAccessibility() {
  try {
    // Test if frontend is running
    const response = await axios.get(FRONTEND_BASE);
    await log('Frontend is accessible', 'success');
    return true;
  } catch (error) {
    await log(`Frontend accessibility error: ${error.message}`, 'error');
    return false;
  }
}

async function generateTestReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    testResults: results,
    summary: {
      totalTests: Object.keys(results).length,
      passedTests: Object.values(results).filter(r => r.success).length,
      failedTests: Object.values(results).filter(r => !r.success).length
    },
    recommendations: []
  };

  // Generate recommendations based on failures
  if (!results.backendHealth.success) {
    report.recommendations.push('Start the backend server: npm run backend');
  }
  
  if (!results.frontendAccessibility.success) {
    report.recommendations.push('Start the frontend server: cd frontend && npm run dev');
  }
  
  if (!results.userAuth.success) {
    report.recommendations.push('Check authentication system and database connectivity');
  }
  
  if (!results.notesAPI.success) {
    report.recommendations.push('Check notes API routes and authentication middleware');
  }

  // Write report to file
  fs.writeFileSync('notes-accessibility-report.json', JSON.stringify(report, null, 2));
  await log('Test report generated: notes-accessibility-report.json', 'success');
  
  return report;
}

async function runAccessibilityTests() {
  await log('🚀 Starting Notes Page Accessibility Tests');
  await log('=====================================');

  const results = {};

  // Test 1: Backend Health
  await log('Test 1: Backend Health Check');
  results.backendHealth = {
    success: await testBackendHealth(),
    description: 'Verify backend server is running and responsive'
  };

  // Test 2: Frontend Accessibility
  await log('Test 2: Frontend Accessibility Check');
  results.frontendAccessibility = {
    success: await testFrontendAccessibility(),
    description: 'Verify frontend server is running and accessible'
  };

  // Test 3: User Authentication
  await log('Test 3: User Authentication');
  results.userAuth = {
    success: await testUserRegistration(),
    description: 'Verify user can register/login and obtain auth token'
  };

  // Test 4: Notes API Access
  await log('Test 4: Notes API Access');
  results.notesAPI = {
    success: await testNotesAPIAccess(),
    description: 'Verify authenticated user can access notes API'
  };

  // Test 5: Note Creation
  await log('Test 5: Note Creation');
  const noteId = await testCreateTestNote();
  results.noteCreation = {
    success: !!noteId,
    description: 'Verify user can create notes',
    noteId: noteId
  };

  // Generate comprehensive report
  await log('=====================================');
  const report = await generateTestReport(results);
  
  await log(`Test Summary: ${report.summary.passedTests}/${report.summary.totalTests} tests passed`);
  
  if (report.summary.failedTests > 0) {
    await log('❌ CRITICAL ISSUE DETECTED: Notes page accessibility is compromised', 'error');
    await log('Recommendations:');
    report.recommendations.forEach(rec => log(`  - ${rec}`));
  } else {
    await log('✅ All accessibility tests passed - Notes page should be accessible', 'success');
  }

  return report;
}

// Run the tests
if (require.main === module) {
  runAccessibilityTests()
    .then(report => {
      process.exit(report.summary.failedTests > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runAccessibilityTests };
