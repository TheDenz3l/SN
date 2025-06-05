/**
 * Test Migration Application
 * Test if we can apply the migration step by step
 */

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://ppavdpzulvosmmkzqtgy.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYXZkcHp1bHZvc21ta3pxdGd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk5MjMyMywiZXhwIjoyMDY0NTY4MzIzfQ.yHF0fEOLMNsUTdsztGfvHGsonournMGiojrn0MhpHXA';

const supabase = createClient(supabaseUrl, serviceKey);

async function testBackendConnection() {
  console.log('🧪 Testing backend server connection...');
  
  try {
    // Test if backend server is running
    const response = await fetch('http://localhost:3001/health');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend server is running:', data.status);
      return true;
    } else {
      console.log('❌ Backend server not responding');
      return false;
    }
  } catch (error) {
    console.log('❌ Backend server not running:', error.message);
    return false;
  }
}

async function startBackendServer() {
  console.log('🚀 Starting backend server...');
  
  try {
    // Change to backend directory and start server
    const { spawn } = require('child_process');
    const server = spawn('npm', ['start'], {
      cwd: './backend',
      stdio: 'inherit',
      shell: true
    });
    
    console.log('⏳ Backend server starting... (PID:', server.pid, ')');
    
    // Wait a moment for server to start
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    return server;
  } catch (error) {
    console.error('❌ Failed to start backend server:', error);
    return null;
  }
}

async function testDatabaseTables() {
  console.log('🔍 Testing database tables...');
  
  try {
    // Test user_profiles
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    
    if (profileError) {
      console.error('❌ user_profiles error:', profileError);
      return false;
    }
    
    console.log('✅ user_profiles table accessible');
    
    if (profiles && profiles.length > 0) {
      const profile = profiles[0];
      console.log('📋 Current user_profiles columns:', Object.keys(profile));
      
      // Check for new columns
      const hasNewColumns = profile.hasOwnProperty('writing_style_confidence');
      console.log(hasNewColumns ? '✅ New columns present' : '⚠️  New columns missing');
    }
    
    // Test new tables
    try {
      const { data: analytics, error: analyticsError } = await supabase
        .from('user_writing_analytics')
        .select('*')
        .limit(1);
      
      if (analyticsError) {
        console.log('⚠️  user_writing_analytics table not found (expected if migration not applied)');
      } else {
        console.log('✅ user_writing_analytics table exists');
      }
    } catch (error) {
      console.log('⚠️  user_writing_analytics table not accessible');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database test failed:', error);
    return false;
  }
}

async function testFrontendBuild() {
  console.log('🏗️  Testing frontend build...');
  
  try {
    const { spawn } = require('child_process');
    const fs = require('fs');
    
    // Check if frontend directory exists
    if (!fs.existsSync('./frontend')) {
      console.log('❌ Frontend directory not found');
      return false;
    }
    
    console.log('✅ Frontend directory exists');
    
    // Check if node_modules exists
    if (!fs.existsSync('./frontend/node_modules')) {
      console.log('⚠️  Frontend dependencies not installed');
      console.log('💡 Run: cd frontend && npm install');
      return false;
    }
    
    console.log('✅ Frontend dependencies installed');
    return true;
  } catch (error) {
    console.error('❌ Frontend test failed:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 SwiftNotes System Test');
  console.log('=========================\n');
  
  // Test database
  const dbOk = await testDatabaseTables();
  if (!dbOk) {
    console.error('❌ Database test failed');
    return;
  }
  
  // Test frontend
  const frontendOk = await testFrontendBuild();
  if (!frontendOk) {
    console.error('❌ Frontend test failed');
    return;
  }
  
  // Test backend
  const backendRunning = await testBackendConnection();
  
  console.log('\n📋 System Status Summary:');
  console.log('=========================');
  console.log(`✅ Database: Connected`);
  console.log(`${frontendOk ? '✅' : '❌'} Frontend: ${frontendOk ? 'Ready' : 'Needs setup'}`);
  console.log(`${backendRunning ? '✅' : '⚠️ '} Backend: ${backendRunning ? 'Running' : 'Not running'}`);
  
  if (!backendRunning) {
    console.log('\n🚀 To start the backend server:');
    console.log('cd backend && npm start');
  }
  
  console.log('\n📄 Manual Migration Steps:');
  console.log('===========================');
  console.log('1. Open: https://supabase.com/dashboard/project/ppavdpzulvosmmkzqtgy/sql/new');
  console.log('2. Copy and paste database-migration-writing-analytics.sql');
  console.log('3. Run the SQL');
  console.log('4. Copy and paste writing-analytics-functions.sql');
  console.log('5. Run the SQL');
  console.log('6. Restart backend server if running');
  
  console.log('\n🧪 Test the Enhanced Setup:');
  console.log('============================');
  console.log('1. Go to: http://localhost:5173/setup');
  console.log('2. Enter a writing style sample (100+ characters)');
  console.log('3. Watch for real-time style analysis');
  console.log('4. Complete setup and generate a note');
  console.log('5. Check analytics in dashboard');
}

main().catch(console.error);
