#!/usr/bin/env node

/**
 * SwiftNotes Persistent Development Server
 * Advanced server management with PM2, file watching, and auto-recovery
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');

class PersistentDevServer {
  constructor() {
    this.projectRoot = __dirname;
    this.logDir = path.join(this.projectRoot, 'logs');
    this.pm2Available = false;
    this.watchers = new Map();
    this.healthCheckInterval = null;
    
    this.ensureDirectories();
    this.checkPM2Availability();
  }

  ensureDirectories() {
    const dirs = [this.logDir, path.join(this.logDir, 'health')];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  async checkPM2Availability() {
    try {
      await this.execCommand('pm2 --version');
      this.pm2Available = true;
      this.log('✅ PM2 is available', 'success');
    } catch (error) {
      this.pm2Available = false;
      this.log('⚠️ PM2 not available, falling back to basic mode', 'warning');
    }
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    
    const logMessage = `${colors[type]}[${timestamp}] ${message}${colors.reset}`;
    console.log(logMessage);
    
    // Write to log file
    const logFile = path.join(this.logDir, 'dev-server.log');
    fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
  }

  async execCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }

  async checkPort(port) {
    try {
      await this.execCommand(`lsof -i :${port}`);
      return true;
    } catch {
      return false;
    }
  }

  async killPort(port) {
    try {
      await this.execCommand(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      this.log(`Warning: Could not kill port ${port}: ${error.message}`, 'warning');
    }
  }

  setupFileWatchers() {
    if (!this.pm2Available) {
      this.log('Setting up manual file watchers...', 'info');
      
      // Backend file watcher
      const backendWatcher = chokidar.watch([
        './backend/routes/**/*.js',
        './backend/middleware/**/*.js',
        './backend/services/**/*.js',
        './backend/server.js'
      ], {
        ignored: /node_modules|\.git|logs|coverage/,
        persistent: true,
        ignoreInitial: true
      });

      backendWatcher.on('change', (path) => {
        this.log(`Backend file changed: ${path}`, 'info');
        this.restartBackend();
      });

      this.watchers.set('backend', backendWatcher);

      // Frontend file watcher (Vite handles this automatically)
      const frontendWatcher = chokidar.watch([
        './frontend/vite.config.ts',
        './frontend/tailwind.config.js'
      ], {
        ignored: /node_modules|\.git|dist/,
        persistent: true,
        ignoreInitial: true
      });

      frontendWatcher.on('change', (path) => {
        this.log(`Frontend config changed: ${path}`, 'info');
        this.restartFrontend();
      });

      this.watchers.set('frontend', frontendWatcher);
    }
  }

  setupHealthMonitoring() {
    this.log('Setting up health monitoring...', 'info');
    
    this.healthCheckInterval = setInterval(async () => {
      const backendHealthy = await this.checkBackendHealth();
      const frontendHealthy = await this.checkFrontendHealth();
      
      const healthStatus = {
        timestamp: new Date().toISOString(),
        backend: backendHealthy,
        frontend: frontendHealthy
      };
      
      // Log health status
      const healthFile = path.join(this.logDir, 'health', 'status.json');
      fs.writeFileSync(healthFile, JSON.stringify(healthStatus, null, 2));
      
      // Auto-restart if unhealthy
      if (!backendHealthy) {
        this.log('Backend unhealthy, attempting restart...', 'warning');
        await this.restartBackend();
      }
      
      if (!frontendHealthy) {
        this.log('Frontend unhealthy, attempting restart...', 'warning');
        await this.restartFrontend();
      }
    }, 30000); // Check every 30 seconds
  }

  async checkBackendHealth() {
    try {
      const { stdout } = await this.execCommand('curl -s http://localhost:3001/health');
      return stdout.includes('ok') || stdout.includes('healthy');
    } catch {
      return false;
    }
  }

  async checkFrontendHealth() {
    return await this.checkPort(5173);
  }

  async startBackend() {
    this.log('🔧 Starting backend server...', 'info');

    const backendDir = path.join(this.projectRoot, 'backend');
    const serverPath = path.join(backendDir, 'server.js');

    this.backendProcess = spawn('node', [serverPath], {
      cwd: backendDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'development' }
    });

    this.setupProcessLogging(this.backendProcess, 'backend');
    await this.waitForPort(3001, 10000);
    this.log('✅ Backend started on http://localhost:3001', 'success');
  }

  async startFrontend() {
    this.log('🎨 Starting frontend server...', 'info');

    const frontendDir = path.join(this.projectRoot, 'frontend');

    this.frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: frontendDir,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'development' }
    });

    this.setupProcessLogging(this.frontendProcess, 'frontend');
    await this.waitForPort(5173, 15000);
    this.log('✅ Frontend started on http://localhost:5173', 'success');
  }

  setupProcessLogging(process, name) {
    const logPath = path.join(this.logDir, `${name}.log`);
    const logStream = fs.createWriteStream(logPath, { flags: 'a' });

    process.stdout.pipe(logStream);
    process.stderr.pipe(logStream);

    process.stdout.on('data', (data) => {
      console.log(`[${name.toUpperCase()}] ${data}`);
    });

    process.stderr.on('data', (data) => {
      console.error(`[${name.toUpperCase()} ERROR] ${data}`);
    });

    process.on('exit', (code) => {
      this.log(`${name} process exited with code ${code}`, code === 0 ? 'info' : 'error');
    });
  }

  async waitForPort(port, timeout = 10000) {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (await this.checkPort(port)) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    throw new Error(`Port ${port} did not become available within ${timeout}ms`);
  }

  async restartBackend() {
    this.log('🔄 Restarting backend...', 'info');
    if (this.backendProcess) {
      this.backendProcess.kill('SIGTERM');
    }
    await this.killPort(3001);
    await this.startBackend();
  }

  async restartFrontend() {
    this.log('🔄 Restarting frontend...', 'info');
    if (this.frontendProcess) {
      this.frontendProcess.kill('SIGTERM');
    }
    await this.killPort(5173);
    await this.startFrontend();
  }

  async startWithPM2() {
    this.log('🚀 Starting SwiftNotes with PM2...', 'info');
    
    try {
      // Stop any existing processes
      await this.execCommand('pm2 delete swiftnotes-backend swiftnotes-frontend 2>/dev/null || true');
      
      // Start with ecosystem config
      await this.execCommand('pm2 start ecosystem.config.js');
      
      // Show status
      const { stdout } = await this.execCommand('pm2 list');
      this.log('PM2 Process Status:', 'info');
      console.log(stdout);
      
      this.log('✅ SwiftNotes started with PM2', 'success');
      this.log('📊 Monitor with: pm2 monit', 'info');
      this.log('📝 Logs with: pm2 logs', 'info');
      
    } catch (error) {
      this.log(`❌ Failed to start with PM2: ${error.message}`, 'error');
      throw error;
    }
  }

  async startBasicMode() {
    this.log('🚀 Starting SwiftNotes in basic mode...', 'info');
    
    // Clean up ports
    await this.killPort(3001);
    await this.killPort(5173);
    
    // Start backend
    await this.startBackend();
    
    // Start frontend
    await this.startFrontend();
    
    // Setup file watchers and health monitoring
    this.setupFileWatchers();
    this.setupHealthMonitoring();
    
    this.log('✅ SwiftNotes started in basic mode', 'success');
  }

  async start() {
    try {
      this.log('🚀 Starting SwiftNotes Persistent Development Server...', 'info');
      this.log('='.repeat(60), 'info');
      
      if (this.pm2Available) {
        await this.startWithPM2();
      } else {
        await this.startBasicMode();
      }
      
      this.displayStatus();
      this.setupGracefulShutdown();
      
      // Keep process alive
      if (!this.pm2Available) {
        await new Promise(() => {}); // Run forever
      }
      
    } catch (error) {
      this.log(`❌ Failed to start: ${error.message}`, 'error');
      await this.stop();
      process.exit(1);
    }
  }

  displayStatus() {
    this.log('🎉 SwiftNotes Development Environment Ready!', 'success');
    this.log('='.repeat(60), 'success');
    this.log('🌐 Frontend: http://localhost:5173', 'info');
    this.log('🔧 Backend:  http://localhost:3001', 'info');
    this.log('📊 Health:   http://localhost:3001/health', 'info');
    this.log('📝 Logs:     ' + this.logDir, 'info');
    
    if (this.pm2Available) {
      this.log('📊 Monitor:  pm2 monit', 'info');
      this.log('📝 PM2 Logs: pm2 logs', 'info');
      this.log('🛑 Stop:     npm run dev:stop', 'info');
    } else {
      this.log('🛑 Stop:     Ctrl+C', 'info');
    }
  }

  setupGracefulShutdown() {
    const shutdown = async () => {
      this.log('🛑 Graceful shutdown initiated...', 'warning');
      await this.stop();
    };
    
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('SIGUSR2', shutdown); // nodemon restart
  }

  async stop() {
    this.log('🛑 Stopping SwiftNotes servers...', 'warning');
    
    // Clear health monitoring
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    
    // Close file watchers
    for (const [name, watcher] of this.watchers) {
      await watcher.close();
      this.log(`Closed ${name} file watcher`, 'info');
    }
    
    if (this.pm2Available) {
      try {
        await this.execCommand('pm2 delete swiftnotes-backend swiftnotes-frontend');
        this.log('✅ PM2 processes stopped', 'success');
      } catch (error) {
        this.log(`Warning: PM2 cleanup failed: ${error.message}`, 'warning');
      }
    } else {
      await this.killPort(3001);
      await this.killPort(5173);
    }
    
    this.log('✅ SwiftNotes stopped', 'success');
    
    if (!this.pm2Available) {
      process.exit(0);
    }
  }

  async status() {
    if (this.pm2Available) {
      try {
        const { stdout } = await this.execCommand('pm2 list');
        console.log(stdout);
      } catch (error) {
        this.log(`PM2 status error: ${error.message}`, 'error');
      }
    }
    
    const backendRunning = await this.checkPort(3001);
    const frontendRunning = await this.checkPort(5173);
    
    this.log('📊 Server Status:', 'info');
    this.log(`Backend (3001):  ${backendRunning ? '✅ Running' : '❌ Not running'}`, backendRunning ? 'success' : 'error');
    this.log(`Frontend (5173): ${frontendRunning ? '✅ Running' : '❌ Not running'}`, frontendRunning ? 'success' : 'error');
  }
}

// CLI Interface
const command = process.argv[2] || 'start';
const server = new PersistentDevServer();

switch (command) {
  case 'start':
    server.start();
    break;
  case 'stop':
    server.stop();
    break;
  case 'status':
    server.status();
    break;
  case 'restart':
    server.stop().then(() => server.start());
    break;
  default:
    console.log('Usage: node persistent-dev-server.js [start|stop|status|restart]');
    process.exit(1);
}

module.exports = PersistentDevServer;
