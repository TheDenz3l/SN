#!/usr/bin/env node

/**
 * Robust SwiftNotes Server Startup Script
 * Handles port cleanup, process management, and stable server initialization
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execAsync = util.promisify(exec);

class RobustServerManager {
  constructor() {
    this.projectRoot = __dirname;
    this.backendPort = 3001;
    this.frontendPort = 5173;
    this.maxRetries = 3;
    this.retryDelay = 5000;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m',   // Red
      reset: '\x1b[0m'     // Reset
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async killPort(port) {
    try {
      this.log(`🔧 Cleaning up port ${port}...`, 'info');
      
      // Find and kill processes using the port
      const { stdout } = await execAsync(`lsof -ti:${port} || true`);
      const pids = stdout.trim().split('\n').filter(pid => pid);
      
      if (pids.length > 0) {
        this.log(`Found ${pids.length} processes on port ${port}`, 'warning');
        
        for (const pid of pids) {
          try {
            await execAsync(`kill -9 ${pid}`);
            this.log(`Killed process ${pid}`, 'success');
          } catch (error) {
            this.log(`Failed to kill process ${pid}: ${error.message}`, 'warning');
          }
        }
        
        // Wait for ports to be freed
        await this.sleep(2000);
      }
      
      return true;
    } catch (error) {
      this.log(`Port cleanup failed: ${error.message}`, 'warning');
      return false;
    }
  }

  async checkPort(port) {
    try {
      const { stdout } = await execAsync(`lsof -ti:${port} || true`);
      return stdout.trim().length > 0;
    } catch (error) {
      return false;
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async stopPM2() {
    try {
      this.log('🛑 Stopping existing PM2 processes...', 'info');
      await execAsync('pm2 delete swiftnotes-backend swiftnotes-frontend 2>/dev/null || true');
      await execAsync('pm2 kill 2>/dev/null || true');
      await this.sleep(3000);
      this.log('✅ PM2 processes stopped', 'success');
    } catch (error) {
      this.log(`PM2 stop warning: ${error.message}`, 'warning');
    }
  }

  async cleanupPorts() {
    this.log('🧹 Cleaning up ports...', 'info');
    await this.killPort(this.backendPort);
    await this.killPort(this.frontendPort);
    await this.killPort(5174); // Alternative Vite port
    this.log('✅ Port cleanup completed', 'success');
  }

  async validateEnvironment() {
    this.log('🔍 Validating environment...', 'info');
    
    const requiredFiles = [
      'backend/.env',
      'backend/server.js',
      'frontend/package.json',
      'ecosystem.config.js'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required file missing: ${file}`);
      }
    }
    
    this.log('✅ Environment validation passed', 'success');
  }

  async startWithPM2() {
    this.log('🚀 Starting SwiftNotes with PM2...', 'info');
    
    try {
      // Start with ecosystem config
      await execAsync('pm2 start ecosystem.config.js --env development');
      
      // Wait for processes to initialize
      await this.sleep(10000);
      
      // Check status
      const { stdout } = await execAsync('pm2 jlist');
      const processes = JSON.parse(stdout);
      
      const backend = processes.find(p => p.name === 'swiftnotes-backend');
      const frontend = processes.find(p => p.name === 'swiftnotes-frontend');
      
      if (backend && backend.pm2_env.status === 'online') {
        this.log('✅ Backend started successfully', 'success');
      } else {
        throw new Error('Backend failed to start');
      }
      
      if (frontend && frontend.pm2_env.status === 'online') {
        this.log('✅ Frontend started successfully', 'success');
      } else {
        throw new Error('Frontend failed to start');
      }
      
      this.log('🎉 SwiftNotes started successfully!', 'success');
      this.log('📊 Backend: http://localhost:3001', 'info');
      this.log('🎨 Frontend: http://localhost:5173', 'info');
      this.log('📝 Logs: pm2 logs', 'info');
      this.log('📊 Monitor: pm2 monit', 'info');
      
    } catch (error) {
      this.log(`❌ Failed to start with PM2: ${error.message}`, 'error');
      throw error;
    }
  }

  async start() {
    try {
      this.log('🚀 Starting Robust SwiftNotes Server...', 'info');
      this.log('=' .repeat(60), 'info');
      
      // Step 1: Validate environment
      await this.validateEnvironment();
      
      // Step 2: Stop existing processes
      await this.stopPM2();
      
      // Step 3: Clean up ports
      await this.cleanupPorts();
      
      // Step 4: Wait for cleanup
      await this.sleep(3000);
      
      // Step 5: Start with PM2
      await this.startWithPM2();
      
      this.log('=' .repeat(60), 'success');
      this.log('✅ SwiftNotes is now running stably!', 'success');
      
    } catch (error) {
      this.log(`❌ Startup failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  async stop() {
    this.log('🛑 Stopping SwiftNotes...', 'warning');
    await this.stopPM2();
    await this.cleanupPorts();
    this.log('✅ SwiftNotes stopped', 'success');
  }

  async restart() {
    this.log('🔄 Restarting SwiftNotes...', 'info');
    await this.stop();
    await this.sleep(5000);
    await this.start();
  }

  async status() {
    try {
      const { stdout } = await execAsync('pm2 jlist');
      const processes = JSON.parse(stdout);
      
      const backend = processes.find(p => p.name === 'swiftnotes-backend');
      const frontend = processes.find(p => p.name === 'swiftnotes-frontend');
      
      this.log('📊 SwiftNotes Status:', 'info');
      this.log(`Backend:  ${backend ? (backend.pm2_env.status === 'online' ? '✅ Online' : `❌ ${backend.pm2_env.status}`) : '❌ Not found'}`, 
        backend && backend.pm2_env.status === 'online' ? 'success' : 'error');
      this.log(`Frontend: ${frontend ? (frontend.pm2_env.status === 'online' ? '✅ Online' : `❌ ${frontend.pm2_env.status}`) : '❌ Not found'}`, 
        frontend && frontend.pm2_env.status === 'online' ? 'success' : 'error');
        
      if (backend) {
        this.log(`Backend restarts: ${backend.pm2_env.restart_time}`, 'info');
      }
      if (frontend) {
        this.log(`Frontend restarts: ${frontend.pm2_env.restart_time}`, 'info');
      }
      
    } catch (error) {
      this.log('❌ Failed to get status', 'error');
    }
  }
}

// CLI Interface
const command = process.argv[2] || 'start';
const manager = new RobustServerManager();

switch (command) {
  case 'start':
    manager.start();
    break;
  case 'stop':
    manager.stop();
    break;
  case 'restart':
    manager.restart();
    break;
  case 'status':
    manager.status();
    break;
  default:
    console.log('Usage: node robust-server-start.js [start|stop|restart|status]');
    process.exit(1);
}
