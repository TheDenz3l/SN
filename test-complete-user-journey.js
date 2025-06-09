#!/usr/bin/env node

/**
 * Complete User Journey Test for Notes Page Accessibility
 * Simulates the exact steps a real user would take to access the notes page
 */

const axios = require('axios');
const fs = require('fs');

const API_BASE = 'http://localhost:3001/api';
const FRONTEND_BASE = 'http://localhost:5173';

// Test user for journey simulation
const JOURNEY_USER = {
  email: 'journey-test@example.com',
  password: 'JourneyTest123!',
  firstName: 'Journey',
  lastName: 'Tester'
};

let journeyLog = [];
let authToken = null;

function logStep(step, success, details = '', data = null) {
  const entry = {
    timestamp: new Date().toISOString(),
    step,
    success,
    details,
    data
  };
  journeyLog.push(entry);
  
  const status = success ? '✅' : '❌';
  console.log(`${status} Step ${step}: ${details}`);
  
  if (!success) {
    console.log(`   Error details: ${JSON.stringify(data, null, 2)}`);
  }
}

async function step1_LandOnHomePage() {
  try {
    const response = await axios.get(FRONTEND_BASE);
    if (response.status === 200) {
      logStep(1, true, 'User successfully lands on homepage');
      return true;
    } else {
      logStep(1, false, 'Homepage not accessible', { status: response.status });
      return false;
    }
  } catch (error) {
    logStep(1, false, 'Cannot access homepage', { error: error.message });
    return false;
  }
}

async function step2_NavigateToLogin() {
  try {
    // Simulate clicking on login link
    const response = await axios.get(`${FRONTEND_BASE}/login`);
    if (response.status === 200) {
      logStep(2, true, 'User can navigate to login page');
      return true;
    } else {
      logStep(2, false, 'Login page not accessible', { status: response.status });
      return false;
    }
  } catch (error) {
    logStep(2, false, 'Cannot access login page', { error: error.message });
    return false;
  }
}

async function step3_RegisterNewUser() {
  try {
    const response = await axios.post(`${API_BASE}/auth/register`, JOURNEY_USER);
    
    if (response.data.success) {
      authToken = response.data.session.access_token;
      logStep(3, true, 'User successfully registers and gets auth token');
      return true;
    } else {
      // Try login instead if user already exists
      return await step3_LoginExistingUser();
    }
  } catch (error) {
    if (error.response?.data?.error?.includes('already exists')) {
      return await step3_LoginExistingUser();
    }
    logStep(3, false, 'Registration failed', { error: error.response?.data || error.message });
    return false;
  }
}

async function step3_LoginExistingUser() {
  try {
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: JOURNEY_USER.email,
      password: JOURNEY_USER.password
    });
    
    if (response.data.success) {
      authToken = response.data.session.access_token;
      logStep(3, true, 'User successfully logs in with existing account');
      return true;
    } else {
      logStep(3, false, 'Login failed', { error: response.data.error });
      return false;
    }
  } catch (error) {
    logStep(3, false, 'Login request failed', { error: error.response?.data || error.message });
    return false;
  }
}

async function step4_AccessDashboard() {
  try {
    // Simulate being redirected to dashboard after login
    const response = await axios.get(`${FRONTEND_BASE}/dashboard`);
    if (response.status === 200) {
      logStep(4, true, 'User successfully accesses dashboard');
      return true;
    } else {
      logStep(4, false, 'Dashboard not accessible', { status: response.status });
      return false;
    }
  } catch (error) {
    logStep(4, false, 'Cannot access dashboard', { error: error.message });
    return false;
  }
}

async function step5_LookForNotesNavigation() {
  try {
    // Check if notes navigation is available by testing the route
    const response = await axios.get(`${FRONTEND_BASE}/notes`);
    if (response.status === 200) {
      logStep(5, true, 'Notes page route exists and is accessible');
      return true;
    } else {
      logStep(5, false, 'Notes page route not accessible', { status: response.status });
      return false;
    }
  } catch (error) {
    logStep(5, false, 'Cannot access notes page route', { error: error.message });
    return false;
  }
}

async function step6_AccessNotesAPI() {
  try {
    if (!authToken) {
      logStep(6, false, 'No auth token available for API access');
      return false;
    }

    const response = await axios.get(`${API_BASE}/notes`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.data.success !== false) {
      logStep(6, true, `Notes API accessible, found ${response.data.notes?.length || 0} notes`);
      return true;
    } else {
      logStep(6, false, 'Notes API returned error', { error: response.data.error });
      return false;
    }
  } catch (error) {
    logStep(6, false, 'Notes API request failed', { 
      error: error.response?.data || error.message,
      status: error.response?.status 
    });
    return false;
  }
}

async function step7_CreateFirstNote() {
  try {
    if (!authToken) {
      logStep(7, false, 'No auth token available for note creation');
      return false;
    }

    const testNote = {
      title: 'My First Note - Journey Test',
      content: { text: 'This is my first note created during the user journey test.' },
      noteType: 'general'
    };

    const response = await axios.post(`${API_BASE}/notes`, testNote, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      logStep(7, true, 'User successfully creates their first note');
      return response.data.note.id;
    } else {
      logStep(7, false, 'Note creation failed', { error: response.data.error });
      return false;
    }
  } catch (error) {
    logStep(7, false, 'Note creation request failed', { 
      error: error.response?.data || error.message 
    });
    return false;
  }
}

async function step8_ViewNotesInHistory() {
  try {
    if (!authToken) {
      logStep(8, false, 'No auth token available for viewing notes history');
      return false;
    }

    const response = await axios.get(`${API_BASE}/notes`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.data.success !== false && response.data.notes?.length > 0) {
      logStep(8, true, `User can view notes history with ${response.data.notes.length} notes`);
      return true;
    } else {
      logStep(8, false, 'Notes history is empty or inaccessible', { 
        notesCount: response.data.notes?.length || 0 
      });
      return false;
    }
  } catch (error) {
    logStep(8, false, 'Cannot access notes history', { 
      error: error.response?.data || error.message 
    });
    return false;
  }
}

async function identifyAccessibilityBarriers() {
  const barriers = [];
  
  // Analyze journey log for potential barriers
  const failedSteps = journeyLog.filter(entry => !entry.success);
  
  if (failedSteps.length === 0) {
    return ['No technical barriers detected - all systems working correctly'];
  }
  
  failedSteps.forEach(step => {
    switch (step.step) {
      case 1:
        barriers.push('🚨 CRITICAL: Homepage is not accessible - users cannot start their journey');
        break;
      case 2:
        barriers.push('🚨 CRITICAL: Login page is not accessible - users cannot authenticate');
        break;
      case 3:
        barriers.push('🚨 CRITICAL: Authentication system is broken - users cannot log in');
        break;
      case 4:
        barriers.push('⚠️ HIGH: Dashboard is not accessible - users cannot access main app');
        break;
      case 5:
        barriers.push('🎯 TARGET ISSUE: Notes page route is not accessible - this is the reported problem');
        break;
      case 6:
        barriers.push('🎯 TARGET ISSUE: Notes API is not accessible - backend issue affecting notes');
        break;
      case 7:
        barriers.push('⚠️ MEDIUM: Users cannot create notes - affects user experience');
        break;
      case 8:
        barriers.push('🎯 TARGET ISSUE: Users cannot view notes history - core functionality broken');
        break;
    }
  });
  
  return barriers;
}

async function generateJourneyReport() {
  const report = {
    timestamp: new Date().toISOString(),
    testType: 'Complete User Journey Test',
    user: JOURNEY_USER.email,
    journeySteps: journeyLog,
    summary: {
      totalSteps: journeyLog.length,
      successfulSteps: journeyLog.filter(entry => entry.success).length,
      failedSteps: journeyLog.filter(entry => !entry.success).length,
      journeyCompleted: journeyLog.length > 0 && journeyLog[journeyLog.length - 1].success
    },
    accessibilityBarriers: await identifyAccessibilityBarriers(),
    recommendations: []
  };
  
  // Generate specific recommendations
  if (report.summary.failedSteps === 0) {
    report.recommendations.push('✅ All technical systems are working correctly');
    report.recommendations.push('🔍 The accessibility issue may be related to:');
    report.recommendations.push('   - User interface/UX problems making navigation unclear');
    report.recommendations.push('   - Missing or hidden navigation elements');
    report.recommendations.push('   - User education/onboarding issues');
    report.recommendations.push('   - Browser-specific compatibility issues');
  } else {
    report.accessibilityBarriers.forEach(barrier => {
      if (barrier.includes('Homepage')) {
        report.recommendations.push('🔧 Start frontend server: cd frontend && npm run dev');
      }
      if (barrier.includes('Authentication')) {
        report.recommendations.push('🔧 Check backend server: npm run backend');
        report.recommendations.push('🔧 Verify database connectivity and auth configuration');
      }
      if (barrier.includes('Notes')) {
        report.recommendations.push('🔧 Check notes API routes and authentication middleware');
        report.recommendations.push('🔧 Verify database notes table and permissions');
      }
    });
  }
  
  // Save report
  fs.writeFileSync('user-journey-report.json', JSON.stringify(report, null, 2));
  
  return report;
}

async function runCompleteUserJourney() {
  console.log('🚀 Starting Complete User Journey Test for Notes Page Accessibility');
  console.log('================================================================');
  console.log('This test simulates the exact steps a real user would take...\n');

  // Execute journey steps
  const step1Success = await step1_LandOnHomePage();
  if (!step1Success) return await generateJourneyReport();

  const step2Success = await step2_NavigateToLogin();
  if (!step2Success) return await generateJourneyReport();

  const step3Success = await step3_RegisterNewUser();
  if (!step3Success) return await generateJourneyReport();

  const step4Success = await step4_AccessDashboard();
  if (!step4Success) return await generateJourneyReport();

  const step5Success = await step5_LookForNotesNavigation();
  if (!step5Success) return await generateJourneyReport();

  const step6Success = await step6_AccessNotesAPI();
  if (!step6Success) return await generateJourneyReport();

  const noteId = await step7_CreateFirstNote();
  if (!noteId) return await generateJourneyReport();

  const step8Success = await step8_ViewNotesInHistory();

  // Generate final report
  const report = await generateJourneyReport();
  
  console.log('\n================================================================');
  console.log('📊 USER JOURNEY TEST COMPLETE');
  console.log('================================================================');
  console.log(`✅ Successful Steps: ${report.summary.successfulSteps}/${report.summary.totalSteps}`);
  console.log(`❌ Failed Steps: ${report.summary.failedSteps}/${report.summary.totalSteps}`);
  console.log(`🎯 Journey Completed: ${report.summary.journeyCompleted ? 'YES' : 'NO'}`);
  
  if (report.accessibilityBarriers.length > 0) {
    console.log('\n🚨 ACCESSIBILITY BARRIERS DETECTED:');
    report.accessibilityBarriers.forEach(barrier => console.log(`   ${barrier}`));
  }
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    report.recommendations.forEach(rec => console.log(`   ${rec}`));
  }
  
  console.log(`\n📄 Detailed report saved: user-journey-report.json`);
  
  return report;
}

// Run the test
if (require.main === module) {
  runCompleteUserJourney()
    .then(report => {
      process.exit(report.summary.failedSteps > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Journey test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runCompleteUserJourney };
