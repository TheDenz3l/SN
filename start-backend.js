#!/usr/bin/env node

/**
 * SwiftNotes Backend Startup Script
 * Ensures proper backend server startup with all necessary checks
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting SwiftNotes Backend Server...');
console.log('=====================================');

// Check if we're in the right directory
const backendPath = path.join(__dirname, 'backend');
const packageJsonPath = path.join(backendPath, 'package.json');

if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Error: backend/package.json not found');
  console.error('   Please run this script from the SwiftNotes root directory');
  process.exit(1);
}

// Check if node_modules exists
const nodeModulesPath = path.join(backendPath, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Installing backend dependencies...');
  const npmInstall = spawn('npm', ['install'], {
    cwd: backendPath,
    stdio: 'inherit',
    shell: true
  });

  npmInstall.on('close', (code) => {
    if (code !== 0) {
      console.error('❌ Failed to install dependencies');
      process.exit(1);
    }
    startServer();
  });
} else {
  startServer();
}

function startServer() {
  console.log('🔧 Starting backend server...');
  
  // Start the backend server
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
}
