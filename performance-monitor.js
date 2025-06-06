/**
 * Performance Monitoring Script
 * Monitors the frontend for performance issues, infinite loops, and excessive re-renders
 */

const puppeteer = require('puppeteer');

async function monitorPerformance() {
  console.log('🔍 Starting Performance Monitoring...');
  console.log('=====================================\n');

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      devtools: true,  // Open DevTools
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Monitor console logs for performance issues
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('🔄') || text.includes('Warning') || text.includes('Error')) {
        console.log(`🚨 Console: ${text}`);
      }
    });

    // Monitor for errors
    page.on('pageerror', error => {
      console.log(`❌ Page Error: ${error.message}`);
    });

    // Monitor network requests
    let requestCount = 0;
    page.on('request', request => {
      requestCount++;
      if (requestCount > 50) {
        console.log(`⚠️ High request count: ${requestCount}`);
      }
    });

    console.log('📱 Opening SwiftNotes app...');
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });

    // Monitor CPU usage
    const client = await page.target().createCDPSession();
    await client.send('Runtime.enable');

    // Check for infinite loops by monitoring script execution time
    let scriptExecutionTime = 0;
    client.on('Runtime.consoleAPICalled', (event) => {
      if (event.type === 'log' && event.args[0]?.value?.includes('🔄')) {
        scriptExecutionTime++;
        if (scriptExecutionTime > 100) {
          console.log('🚨 POTENTIAL INFINITE LOOP DETECTED!');
          console.log(`Script execution count: ${scriptExecutionTime}`);
        }
      }
    });

    // Wait and monitor for 30 seconds
    console.log('⏱️ Monitoring for 30 seconds...');
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Performance metrics
    const metrics = await page.metrics();
    console.log('\n📊 Performance Metrics:');
    console.log('========================');
    console.log(`Timestamp: ${metrics.Timestamp}`);
    console.log(`Documents: ${metrics.Documents}`);
    console.log(`Frames: ${metrics.Frames}`);
    console.log(`JSEventListeners: ${metrics.JSEventListeners}`);
    console.log(`Nodes: ${metrics.Nodes}`);
    console.log(`LayoutCount: ${metrics.LayoutCount}`);
    console.log(`RecalcStyleCount: ${metrics.RecalcStyleCount}`);
    console.log(`LayoutDuration: ${metrics.LayoutDuration}`);
    console.log(`RecalcStyleDuration: ${metrics.RecalcStyleDuration}`);
    console.log(`ScriptDuration: ${metrics.ScriptDuration}`);
    console.log(`TaskDuration: ${metrics.TaskDuration}`);
    console.log(`JSHeapUsedSize: ${(metrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`JSHeapTotalSize: ${(metrics.JSHeapTotalSize / 1024 / 1024).toFixed(2)} MB`);

    // Check for performance issues
    const issues = [];
    if (metrics.LayoutCount > 100) issues.push('Excessive layout recalculations');
    if (metrics.RecalcStyleCount > 100) issues.push('Excessive style recalculations');
    if (metrics.JSHeapUsedSize > 50 * 1024 * 1024) issues.push('High memory usage');
    if (scriptExecutionTime > 50) issues.push('Potential infinite loops');
    if (requestCount > 20) issues.push('Too many network requests');

    if (issues.length > 0) {
      console.log('\n🚨 PERFORMANCE ISSUES DETECTED:');
      console.log('================================');
      issues.forEach(issue => console.log(`❌ ${issue}`));
    } else {
      console.log('\n✅ No major performance issues detected');
    }

    // Test login flow
    console.log('\n🔐 Testing login flow...');
    try {
      await page.goto('http://localhost:5173/login');
      await page.waitForSelector('input[type="email"]', { timeout: 5000 });
      
      await page.type('input[type="email"]', 'demo@swiftnotes.app');
      await page.type('input[type="password"]', 'demo123');
      
      await page.click('button[type="submit"]');
      await page.waitForNavigation({ timeout: 10000 });
      
      console.log('✅ Login flow completed successfully');
      
      // Test settings page
      console.log('🔧 Testing settings page...');
      await page.goto('http://localhost:5173/profile');
      await page.waitForSelector('[data-testid="settings-page"], .settings, h1', { timeout: 5000 });
      
      console.log('✅ Settings page loaded successfully');
      
    } catch (error) {
      console.log(`❌ Login/Settings test failed: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Performance monitoring failed:', error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Check if puppeteer is available
try {
  monitorPerformance();
} catch (error) {
  console.log('⚠️ Puppeteer not available, running basic checks...');
  console.log('To install: npm install puppeteer');
  
  // Basic fetch test
  fetch('http://localhost:5173')
    .then(response => {
      if (response.ok) {
        console.log('✅ Frontend server is responding');
      } else {
        console.log('❌ Frontend server returned error:', response.status);
      }
    })
    .catch(error => {
      console.log('❌ Frontend server is not accessible:', error.message);
    });
}
