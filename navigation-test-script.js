/**
 * Navigation Test Script for SwiftNotes
 * Run this in browser console to test navigation functionality
 */

console.log('🧪 SWIFTNOTES NAVIGATION TEST SCRIPT');
console.log('=====================================');

// Test configuration
const TEST_CONFIG = {
  routes: [
    '/dashboard',
    '/generate',
    '/notes',
    '/setup',
    '/profile'
  ],
  clickDelay: 800, // Shorter delay for React Router navigation
  maxTestCycles: 3,
  navigationTimeout: 300 // Timeout for React Router navigation
};

// Navigation test results
let testResults = {
  totalClicks: 0,
  successfulNavigations: 0,
  failedNavigations: 0,
  hangingNavigations: 0,
  errors: []
};

// Helper function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to check if page is responsive
const checkPageResponsiveness = () => {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;
      
      // Check if page is still responsive (can execute JS)
      try {
        document.querySelector('body');
        clearInterval(checkInterval);
        resolve({ responsive: true, responseTime: elapsed });
      } catch (error) {
        if (elapsed > 10000) { // 10 second timeout
          clearInterval(checkInterval);
          resolve({ responsive: false, responseTime: elapsed });
        }
      }
    }, 100);
  });
};

// Test navigation to a specific route
const testNavigation = async (route) => {
  console.log(`🔄 Testing navigation to: ${route}`);

  try {
    const startTime = Date.now();

    // Find navigation link (React Router Link component)
    const navLink = document.querySelector(`a[href="${route}"]`);
    if (!navLink) {
      throw new Error(`Navigation link for ${route} not found`);
    }

    // Verify this is a React Router Link (should not have target="_blank" or external href)
    const isReactRouterLink = !navLink.hasAttribute('target') &&
                             navLink.href.includes(window.location.origin);

    if (!isReactRouterLink) {
      console.warn(`⚠️ Link for ${route} may not be a React Router Link`);
    }

    // Click the navigation link (should trigger React Router navigation)
    navLink.click();
    testResults.totalClicks++;

    // Wait for React Router navigation (shorter wait since no page reload)
    await wait(300);

    // Check if navigation was successful
    const currentPath = window.location.pathname;
    const responseCheck = await checkPageResponsiveness();

    const navigationTime = Date.now() - startTime;

    if (currentPath === route && responseCheck.responsive) {
      testResults.successfulNavigations++;
      console.log(`✅ Successfully navigated to ${route} (${navigationTime}ms) - React Router`);
      return { success: true, route, navigationTime, responseTime: responseCheck.responseTime, type: 'react-router' };
    } else if (!responseCheck.responsive) {
      testResults.hangingNavigations++;
      console.log(`❌ ${route} - Window unresponsive (${navigationTime}ms)`);
      return { success: false, route, navigationTime, error: 'Window unresponsive', type: 'react-router' };
    } else {
      testResults.failedNavigations++;
      console.log(`❌ Navigation to ${route} failed - ended up at ${currentPath} (${navigationTime}ms)`);
      return { success: false, route, navigationTime, error: `Wrong destination: ${currentPath}`, type: 'react-router' };
    }
    
  } catch (error) {
    testResults.failedNavigations++;
    testResults.errors.push({ route, error: error.message });
    console.log(`❌ Navigation to ${route} failed:`, error.message);
    return { success: false, route, error: error.message };
  }
};

// Run comprehensive navigation test
const runNavigationTest = async () => {
  console.log(`🚀 Starting navigation test with ${TEST_CONFIG.maxTestCycles} cycles...`);
  
  const allResults = [];
  
  for (let cycle = 1; cycle <= TEST_CONFIG.maxTestCycles; cycle++) {
    console.log(`\n📊 Test Cycle ${cycle}/${TEST_CONFIG.maxTestCycles}`);
    console.log('─'.repeat(40));
    
    for (const route of TEST_CONFIG.routes) {
      const result = await testNavigation(route);
      allResults.push(result);
      
      // Wait between navigations to prevent overwhelming the system
      await wait(TEST_CONFIG.clickDelay);
    }
  }
  
  // Generate test report
  console.log('\n📋 NAVIGATION TEST REPORT');
  console.log('='.repeat(50));
  console.log(`Total Clicks: ${testResults.totalClicks}`);
  console.log(`Successful Navigations: ${testResults.successfulNavigations}`);
  console.log(`Failed Navigations: ${testResults.failedNavigations}`);
  console.log(`Hanging Navigations: ${testResults.hangingNavigations}`);
  console.log(`Success Rate: ${((testResults.successfulNavigations / testResults.totalClicks) * 100).toFixed(1)}%`);
  
  if (testResults.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    testResults.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.route}: ${error.error}`);
    });
  }
  
  // Performance analysis
  const successfulResults = allResults.filter(r => r.success);
  if (successfulResults.length > 0) {
    const avgNavigationTime = successfulResults.reduce((sum, r) => sum + r.navigationTime, 0) / successfulResults.length;
    console.log(`\n⚡ Average Navigation Time: ${avgNavigationTime.toFixed(0)}ms`);
  }
  
  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  if (testResults.hangingNavigations > 0) {
    console.log('⚠️ Page hanging detected - check PM2 configuration and navigation implementation');
  }
  if (testResults.failedNavigations > testResults.successfulNavigations) {
    console.log('⚠️ High failure rate - check React Router configuration');
  }
  if (testResults.successfulNavigations === testResults.totalClicks) {
    console.log('✅ All navigation tests passed - system is stable');
  }
  
  return {
    summary: testResults,
    detailedResults: allResults,
    recommendations: testResults.hangingNavigations > 0 ? ['Check PM2 config', 'Verify navigation implementation'] : ['System stable']
  };
};

// Quick single navigation test
const quickTest = async (route = '/dashboard') => {
  console.log(`🔍 Quick test: navigating to ${route}`);
  const result = await testNavigation(route);
  return result;
};

// Export functions to global scope
window.navigationTest = {
  runFull: runNavigationTest,
  quickTest: quickTest,
  checkResponsiveness: checkPageResponsiveness,
  results: testResults
};

// Navigation verification function
const verifyNavigationSetup = () => {
  console.log('\n🔍 VERIFYING NAVIGATION SETUP');
  console.log('============================');

  // Check for React Router
  const hasReactRouter = !!window.history?.pushState;
  console.log(`📍 React Router support: ${hasReactRouter ? '✅' : '❌'}`);

  // Check all navigation links
  const allLinks = document.querySelectorAll('a[href]');
  console.log(`🔗 Total links found: ${allLinks.length}`);

  const routerLinks = Array.from(allLinks).filter(link =>
    link.href.includes(window.location.origin) &&
    !link.hasAttribute('target') &&
    !link.href.includes('mailto:') &&
    !link.href.includes('tel:')
  );

  console.log(`⚛️ React Router links: ${routerLinks.length}`);
  console.log(`🌐 External/other links: ${allLinks.length - routerLinks.length}`);

  // List all navigation routes
  const routes = routerLinks.map(link => {
    const url = new URL(link.href);
    return url.pathname;
  }).filter((route, index, arr) => arr.indexOf(route) === index);

  console.log('📋 Available routes:', routes);

  return {
    hasReactRouter,
    totalLinks: allLinks.length,
    routerLinks: routerLinks.length,
    routes
  };
};

console.log('\n🎯 AVAILABLE TEST FUNCTIONS:');
console.log('- navigationTest.runFull() - Run complete navigation test');
console.log('- navigationTest.quickTest("/route") - Test single route');
console.log('- navigationTest.checkResponsiveness() - Check page responsiveness');
console.log('- navigationTest.verifySetup() - Verify navigation setup');
console.log('- navigationTest.results - View current test results');

// Add verification to exports
window.navigationTest.verifySetup = verifyNavigationSetup;

console.log('\n🏁 Ready to test! Run navigationTest.verifySetup() first, then navigationTest.runFull().');
