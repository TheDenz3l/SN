/**
 * Frontend Debug Script - Run this in browser console
 * This script will help identify what's happening in the actual frontend
 */

// Browser console debug script
console.log('🔍 FRONTEND DEBUG SCRIPT - Notes History Legacy Format Issue');
console.log('============================================================');

// Check if we're on the right page
if (!window.location.pathname.includes('notes-history')) {
  console.log('❌ Not on Notes History page. Navigate to /notes-history first.');
} else {
  console.log('✅ On Notes History page');
}

// Check if React is available
if (typeof React !== 'undefined') {
  console.log('✅ React is available');
} else {
  console.log('⚠️ React not directly available (this is normal for production builds)');
}

// Function to analyze the current page state
function analyzeNotesHistoryPage() {
  console.log('\n📊 ANALYZING CURRENT PAGE STATE');
  console.log('===============================');
  
  // Check for notes in the page
  const noteElements = document.querySelectorAll('[data-testid="note-item"], .note-item, .border.border-gray-200');
  console.log(`📝 Found ${noteElements.length} note elements on page`);
  
  // Check for legacy format warnings
  const legacyWarnings = document.querySelectorAll('.text-amber-700, .bg-amber-50');
  console.log(`⚠️ Found ${legacyWarnings.length} legacy format warnings`);
  
  // Check for modal or note details
  const modals = document.querySelectorAll('[role="dialog"], .modal, .fixed.inset-0');
  console.log(`🪟 Found ${modals.length} modal/dialog elements`);
  
  // Look for specific content
  const jsonContent = document.querySelectorAll('pre');
  console.log(`📄 Found ${jsonContent.length} <pre> elements (potential JSON display)`);
  
  if (jsonContent.length > 0) {
    console.log('📄 Content of <pre> elements:');
    jsonContent.forEach((pre, index) => {
      console.log(`   Pre ${index + 1}:`, pre.textContent.substring(0, 200));
    });
  }
  
  // Check for any error messages
  const errorElements = document.querySelectorAll('.text-red-500, .text-red-600, .bg-red-50, .error');
  console.log(`❌ Found ${errorElements.length} error elements`);
  
  if (errorElements.length > 0) {
    errorElements.forEach((error, index) => {
      console.log(`   Error ${index + 1}:`, error.textContent);
    });
  }
}

// Function to check browser console for errors
function checkConsoleErrors() {
  console.log('\n🐛 CHECKING FOR JAVASCRIPT ERRORS');
  console.log('=================================');
  
  // Override console.error to catch errors
  const originalError = console.error;
  const errors = [];
  
  console.error = function(...args) {
    errors.push(args);
    originalError.apply(console, args);
  };
  
  // Check if there are any existing errors
  if (window.errors && window.errors.length > 0) {
    console.log(`❌ Found ${window.errors.length} stored errors`);
    window.errors.forEach((error, index) => {
      console.log(`   Error ${index + 1}:`, error);
    });
  } else {
    console.log('✅ No stored errors found');
  }
}

// Function to simulate clicking on a note
function simulateNoteClick() {
  console.log('\n🖱️ SIMULATING NOTE CLICK');
  console.log('========================');
  
  // Find view/eye buttons
  const viewButtons = document.querySelectorAll('button[title*="View"], button[aria-label*="View"], .eye-icon, [data-testid="view-note"]');
  console.log(`👁️ Found ${viewButtons.length} view buttons`);
  
  if (viewButtons.length > 0) {
    console.log('🖱️ Clicking first view button...');
    viewButtons[0].click();
    
    // Wait a moment then analyze
    setTimeout(() => {
      console.log('\n📊 POST-CLICK ANALYSIS');
      console.log('======================');
      analyzeNotesHistoryPage();
      
      // Check modal content specifically
      const modalContent = document.querySelector('[role="dialog"] .space-y-4, .modal .space-y-4');
      if (modalContent) {
        console.log('🪟 Modal content found:');
        console.log('   Text content:', modalContent.textContent.substring(0, 500));
        console.log('   HTML:', modalContent.innerHTML.substring(0, 500));
      }
    }, 1000);
  } else {
    console.log('❌ No view buttons found. Looking for other clickable elements...');
    
    // Look for any clickable note elements
    const clickableNotes = document.querySelectorAll('.cursor-pointer, [onclick], button');
    console.log(`🖱️ Found ${clickableNotes.length} potentially clickable elements`);
  }
}

// Function to check local storage and auth
function checkAuthAndStorage() {
  console.log('\n🔐 CHECKING AUTHENTICATION & STORAGE');
  console.log('===================================');
  
  const authToken = localStorage.getItem('auth_token');
  console.log(`🎫 Auth token exists: ${!!authToken}`);
  if (authToken) {
    console.log(`🎫 Token preview: ${authToken.substring(0, 20)}...`);
  }
  
  const userData = localStorage.getItem('user');
  console.log(`👤 User data exists: ${!!userData}`);
  if (userData) {
    try {
      const user = JSON.parse(userData);
      console.log(`👤 User email: ${user.email}`);
    } catch (e) {
      console.log('❌ Error parsing user data');
    }
  }
}

// Function to check network requests
function checkNetworkRequests() {
  console.log('\n🌐 MONITORING NETWORK REQUESTS');
  console.log('==============================');
  
  // Override fetch to monitor requests
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    console.log('🔗 Fetch request:', args[0]);
    return originalFetch.apply(this, args).then(response => {
      console.log('📥 Fetch response:', response.status, response.url);
      return response;
    });
  };
  
  console.log('✅ Network monitoring enabled');
}

// Main debug function
function runFullDebug() {
  console.log('\n🚀 RUNNING FULL FRONTEND DEBUG');
  console.log('==============================');
  
  checkAuthAndStorage();
  checkConsoleErrors();
  analyzeNotesHistoryPage();
  checkNetworkRequests();
  
  console.log('\n📋 NEXT STEPS:');
  console.log('1. Run simulateNoteClick() to test note viewing');
  console.log('2. Check browser Network tab for API calls');
  console.log('3. Look for any console errors');
  console.log('4. Clear browser cache if needed');
  
  // Auto-run note click simulation after a delay
  setTimeout(() => {
    simulateNoteClick();
  }, 2000);
}

// Export functions to global scope for manual use
window.debugNotesHistory = {
  analyzeNotesHistoryPage,
  checkConsoleErrors,
  simulateNoteClick,
  checkAuthAndStorage,
  checkNetworkRequests,
  runFullDebug
};

console.log('\n🎯 DEBUG FUNCTIONS AVAILABLE:');
console.log('- debugNotesHistory.runFullDebug() - Run complete analysis');
console.log('- debugNotesHistory.analyzeNotesHistoryPage() - Analyze current page');
console.log('- debugNotesHistory.simulateNoteClick() - Click on a note');
console.log('- debugNotesHistory.checkAuthAndStorage() - Check authentication');

// Auto-run the full debug
runFullDebug();
