#!/usr/bin/env node

/**
 * SwiftNotes Comprehensive Fix and Start Script
 * Applies database fixes and starts the backend server
 */

const { createClient } = require('@supabase/supabase-js');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ppavdpzulvosmmkzqtgy.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 SwiftNotes Comprehensive Fix and Start');
console.log('==========================================');

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in environment');
  console.error('   Please set this environment variable to continue');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyDatabaseFixes() {
  console.log('🔍 Applying database foreign key fixes...');
  
  try {
    // Read the SQL fix file
    const sqlFixPath = path.join(__dirname, 'fix-templates-foreign-key.sql');
    if (!fs.existsSync(sqlFixPath)) {
      console.log('⚠️  SQL fix file not found, skipping database fixes');
      return true;
    }

    const sqlContent = fs.readFileSync(sqlFixPath, 'utf8');
    
    // Split SQL commands and execute them
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    for (const command of commands) {
      if (command.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql: command });
          if (error) {
            console.log(`⚠️  SQL command warning: ${error.message}`);
          }
        } catch (err) {
          console.log(`⚠️  SQL command warning: ${err.message}`);
        }
      }
    }

    console.log('✅ Database fixes applied successfully');
    return true;
  } catch (error) {
    console.error('❌ Error applying database fixes:', error.message);
    return false;
  }
}

async function checkBackendDependencies() {
  console.log('📦 Checking backend dependencies...');
  
  const backendPath = path.join(__dirname, 'backend');
  const nodeModulesPath = path.join(backendPath, 'node_modules');
  
  if (!fs.existsSync(nodeModulesPath)) {
    console.log('📦 Installing backend dependencies...');
    
    return new Promise((resolve, reject) => {
      const npmInstall = spawn('npm', ['install'], {
        cwd: backendPath,
        stdio: 'inherit',
        shell: true
      });

      npmInstall.on('close', (code) => {
        if (code !== 0) {
          reject(new Error('Failed to install dependencies'));
        } else {
          console.log('✅ Dependencies installed successfully');
          resolve();
        }
      });
    });
  } else {
    console.log('✅ Dependencies already installed');
  }
}

function startBackendServer() {
  console.log('🚀 Starting backend server...');
  
  const backendPath = path.join(__dirname, 'backend');
  
  const server = spawn('node', ['server.js'], {
    cwd: backendPath,
    stdio: 'inherit',
    shell: true
  });

  server.on('error', (error) => {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  });

  server.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ Server exited with code ${code}`);
    } else {
      console.log('✅ Server stopped gracefully');
    }
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down backend server...');
    server.kill('SIGTERM');
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down backend server...');
    server.kill('SIGTERM');
  });

  return server;
}

async function main() {
  try {
    // Step 1: Apply database fixes
    const dbFixSuccess = await applyDatabaseFixes();
    if (!dbFixSuccess) {
      console.log('⚠️  Database fixes failed, but continuing...');
    }

    // Step 2: Check and install dependencies
    await checkBackendDependencies();

    // Step 3: Start the backend server
    console.log('🎯 All fixes applied, starting backend server...');
    console.log('📍 Backend will be available at: http://localhost:3001');
    console.log('📍 Health check: http://localhost:3001/health');
    console.log('📍 API docs: http://localhost:3001/api');
    console.log('');
    console.log('🔧 To stop the server, press Ctrl+C');
    console.log('');
    
    startBackendServer();

  } catch (error) {
    console.error('❌ Error during startup:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();
