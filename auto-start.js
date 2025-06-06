#!/usr/bin/env node

/**
 * SwiftNotes Auto-Start Script
 * Simplified version that works around launch-process limitations
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 SwiftNotes Auto-Start Script');
console.log('================================');

// Function to execute command and return promise
function execCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
        console.log(`📝 Executing: ${command}`);
        exec(command, options, (error, stdout, stderr) => {
            if (error) {
                console.error(`❌ Error: ${error.message}`);
                reject(error);
                return;
            }
            if (stderr) {
                console.error(`⚠️  stderr: ${stderr}`);
            }
            if (stdout) {
                console.log(`✅ stdout: ${stdout}`);
            }
            resolve(stdout);
        });
    });
}

// Function to check if port is in use
function checkPort(port) {
    return new Promise((resolve) => {
        exec(`lsof -i :${port}`, (error) => {
            resolve(!error); // Port is in use if no error
        });
    });
}

async function startServers() {
    try {
        console.log('🔍 Checking current server status...');
        
        const backendRunning = await checkPort(3001);
        const frontendRunning = await checkPort(5173);
        
        console.log(`Backend (3001): ${backendRunning ? '✅ Running' : '❌ Not running'}`);
        console.log(`Frontend (5173): ${frontendRunning ? '✅ Running' : '❌ Not running'}`);
        
        if (backendRunning && frontendRunning) {
            console.log('🎉 Both servers are already running!');
            console.log('🌐 Frontend: http://localhost:5173');
            console.log('🔧 Backend: http://localhost:3001');
            return;
        }
        
        // Kill any existing processes
        if (backendRunning) {
            console.log('🔄 Stopping existing backend...');
            await execCommand('lsof -ti:3001 | xargs kill -9 2>/dev/null || true');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        if (frontendRunning) {
            console.log('🔄 Stopping existing frontend...');
            await execCommand('lsof -ti:5173 | xargs kill -9 2>/dev/null || true');
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        console.log('🚀 Starting servers...');
        console.log('');
        console.log('📋 INSTRUCTIONS FOR MANUAL STARTUP:');
        console.log('===================================');
        console.log('');
        console.log('Since the automated startup has limitations, please run these commands in your terminal:');
        console.log('');
        console.log('🔧 Terminal 1 (Backend):');
        console.log('cd /Users/bmar/Desktop/swift/SN/backend');
        console.log('node server.js');
        console.log('');
        console.log('🎨 Terminal 2 (Frontend):');
        console.log('cd /Users/bmar/Desktop/swift/SN/frontend');
        console.log('npm run dev');
        console.log('');
        console.log('🌐 Once both are running, access:');
        console.log('Frontend: http://localhost:5173');
        console.log('Backend: http://localhost:3001');
        console.log('');
        console.log('💡 Alternative single command:');
        console.log('cd /Users/bmar/Desktop/swift/SN && npm run dev-auto');
        
    } catch (error) {
        console.error('❌ Error during startup:', error.message);
    }
}

// Run the startup
startServers();
