const puppeteer = require('puppeteer');

async function testFrontendPreferences() {
  console.log('🧪 Testing Frontend Preferences Fix');
  console.log('='.repeat(50));

  let browser;
  try {
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: false, // Set to true for headless mode
      defaultViewport: { width: 1280, height: 720 }
    });
    
    const page = await browser.newPage();
    
    // Step 1: Navigate to the app
    console.log('\n1. 🌐 Navigating to SwiftNotes...');
    await page.goto('http://localhost:5173');
    await page.waitForSelector('body', { timeout: 10000 });
    console.log('✅ Page loaded successfully');

    // Step 2: Login
    console.log('\n2. 🔐 Logging in...');
    
    // Wait for login form
    await page.waitForSelector('input[type="email"]', { timeout: 5000 });
    
    // Fill login form
    await page.type('input[type="email"]', 'phase1test@swiftnotes.app');
    await page.type('input[type="password"]', 'Test123!');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    console.log('✅ Login successful');

    // Step 3: Navigate to Settings
    console.log('\n3. ⚙️ Navigating to Settings...');
    
    // Look for settings/profile link
    await page.waitForSelector('a[href*="settings"], a[href*="profile"], button:contains("Settings")', { timeout: 5000 });
    
    // Try different selectors for settings
    const settingsSelectors = [
      'a[href="/settings"]',
      'a[href="/profile"]', 
      'button[aria-label*="Settings"]',
      'button[title*="Settings"]',
      '[data-testid="settings-button"]'
    ];
    
    let settingsFound = false;
    for (const selector of settingsSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 1000 });
        await page.click(selector);
        settingsFound = true;
        break;
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!settingsFound) {
      console.log('⚠️ Could not find settings button, trying manual navigation...');
      await page.goto('http://localhost:5173/settings');
    }
    
    await page.waitForSelector('body', { timeout: 5000 });
    console.log('✅ Settings page loaded');

    // Step 4: Navigate to Writing Preferences
    console.log('\n4. 📝 Finding Writing Preferences section...');
    
    // Look for writing preferences or generation settings
    const preferencesSelectors = [
      'button:contains("Writing")',
      'button:contains("Preferences")', 
      'button:contains("Generation")',
      '[data-section="writing"]',
      '[data-section="preferences"]'
    ];
    
    let preferencesFound = false;
    for (const selector of preferencesSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 1000 });
        await page.click(selector);
        preferencesFound = true;
        break;
      } catch (e) {
        // Try next selector
      }
    }
    
    if (!preferencesFound) {
      console.log('⚠️ Could not find preferences section button');
    }

    // Step 5: Test Tone Level Slider
    console.log('\n5. 🎚️ Testing tone level slider...');
    
    await page.waitForSelector('input[type="range"]', { timeout: 5000 });
    
    // Get current value
    const currentToneLevel = await page.$eval('input[type="range"]', el => el.value);
    console.log(`Current tone level: ${currentToneLevel}`);
    
    // Set new value
    const newToneLevel = 85;
    await page.$eval('input[type="range"]', (el, value) => {
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, newToneLevel);
    
    console.log(`✅ Set tone level to: ${newToneLevel}`);

    // Step 6: Test Detail Level Selection
    console.log('\n6. 📊 Testing detail level selection...');
    
    // Look for detail level buttons
    const detailButtons = await page.$$('button:contains("Comprehensive"), button:contains("Brief"), button:contains("Detailed")');
    
    if (detailButtons.length > 0) {
      // Click on "Comprehensive" if available
      const comprehensiveButton = await page.$('button:contains("Comprehensive")');
      if (comprehensiveButton) {
        await comprehensiveButton.click();
        console.log('✅ Selected "Comprehensive" detail level');
      }
    } else {
      console.log('⚠️ Could not find detail level buttons');
    }

    // Step 7: Save Preferences
    console.log('\n7. 💾 Saving preferences...');
    
    const saveButton = await page.$('button:contains("Save"), button:contains("Save Preferences")');
    if (saveButton) {
      await saveButton.click();
      console.log('✅ Clicked save button');
      
      // Wait for success message
      try {
        await page.waitForSelector('.toast, .notification, .alert', { timeout: 3000 });
        console.log('✅ Save notification appeared');
      } catch (e) {
        console.log('⚠️ No save notification detected');
      }
    } else {
      console.log('❌ Could not find save button');
    }

    // Step 8: Refresh and verify persistence
    console.log('\n8. 🔄 Testing persistence after page refresh...');
    
    await page.reload({ waitUntil: 'networkidle0' });
    
    // Navigate back to preferences
    await page.waitForSelector('body', { timeout: 5000 });
    
    // Check if values persisted
    await page.waitForSelector('input[type="range"]', { timeout: 5000 });
    const persistedToneLevel = await page.$eval('input[type="range"]', el => el.value);
    
    console.log(`Persisted tone level: ${persistedToneLevel}`);
    
    if (persistedToneLevel == newToneLevel) {
      console.log('✅ Tone level persisted correctly!');
    } else {
      console.log('❌ Tone level did not persist');
    }

    console.log('\n🎉 Frontend preferences test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Check if puppeteer is available
try {
  testFrontendPreferences();
} catch (error) {
  console.log('⚠️ Puppeteer not available. Please install with: npm install puppeteer');
  console.log('Manual testing instructions:');
  console.log('1. Open http://localhost:5173');
  console.log('2. Login with phase1test@swiftnotes.app / Test123!');
  console.log('3. Go to Settings > Writing Preferences');
  console.log('4. Change tone level and detail level');
  console.log('5. Click Save Preferences');
  console.log('6. Refresh page and verify settings persist');
}
