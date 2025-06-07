#!/usr/bin/env node

/**
 * SwiftNotes Persistent Development Server Setup
 * Automated setup and configuration for the persistent development environment
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class PersistentDevSetup {
  constructor() {
    this.projectRoot = __dirname;
    this.logDir = path.join(this.projectRoot, 'logs');
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
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async execCommand(command, cwd = this.projectRoot) {
    return new Promise((resolve, reject) => {
      exec(command, { cwd }, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }

  async runNpmCommand(command, cwd = this.projectRoot) {
    return new Promise((resolve, reject) => {
      const process = spawn('npm', command.split(' '), {
        cwd,
        stdio: 'inherit',
        shell: true
      });
      
      process.on('exit', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`npm command failed with exit code ${code}`));
        }
      });
    });
  }

  async checkNodeVersion() {
    try {
      const { stdout } = await this.execCommand('node --version');
      const version = stdout.trim();
      const majorVersion = parseInt(version.replace('v', '').split('.')[0]);
      
      if (majorVersion < 18) {
        throw new Error(`Node.js version ${version} is not supported. Please upgrade to Node.js 18 or higher.`);
      }
      
      this.log(`✅ Node.js version: ${version}`, 'success');
      return true;
    } catch (error) {
      this.log(`❌ Node.js check failed: ${error.message}`, 'error');
      return false;
    }
  }

  async checkPM2() {
    try {
      await this.execCommand('pm2 --version');
      this.log('✅ PM2 is already installed', 'success');
      return true;
    } catch (error) {
      this.log('⚠️ PM2 not found, will install locally', 'warning');
      return false;
    }
  }

  async installDependencies() {
    this.log('📦 Installing root dependencies...', 'info');
    
    try {
      await this.runNpmCommand('install');
      this.log('✅ Root dependencies installed', 'success');
    } catch (error) {
      this.log(`❌ Failed to install root dependencies: ${error.message}`, 'error');
      throw error;
    }

    this.log('📦 Installing backend dependencies...', 'info');
    try {
      await this.runNpmCommand('install', path.join(this.projectRoot, 'backend'));
      this.log('✅ Backend dependencies installed', 'success');
    } catch (error) {
      this.log(`❌ Failed to install backend dependencies: ${error.message}`, 'error');
      throw error;
    }

    this.log('📦 Installing frontend dependencies...', 'info');
    try {
      await this.runNpmCommand('install', path.join(this.projectRoot, 'frontend'));
      this.log('✅ Frontend dependencies installed', 'success');
    } catch (error) {
      this.log(`❌ Failed to install frontend dependencies: ${error.message}`, 'error');
      throw error;
    }
  }

  async setupDirectories() {
    const directories = [
      this.logDir,
      path.join(this.logDir, 'health'),
      path.join(this.projectRoot, 'scripts')
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.log(`📁 Created directory: ${dir}`, 'info');
      }
    });
  }

  async createScripts() {
    const scriptsDir = path.join(this.projectRoot, 'scripts');
    
    // Create on-restart script
    const onRestartScript = `#!/usr/bin/env node
console.log('[RESTART] SwiftNotes backend restarting...');
const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, '..', 'logs', 'restarts.log');
fs.appendFileSync(logFile, \`[\${new Date().toISOString()}] Backend restarted\\n\`);
`;
    
    fs.writeFileSync(path.join(scriptsDir, 'on-restart.js'), onRestartScript);
    
    // Create on-crash script
    const onCrashScript = `#!/usr/bin/env node
console.log('[CRASH] SwiftNotes backend crashed!');
const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, '..', 'logs', 'crashes.log');
fs.appendFileSync(logFile, \`[\${new Date().toISOString()}] Backend crashed\\n\`);
`;
    
    fs.writeFileSync(path.join(scriptsDir, 'on-crash.js'), onCrashScript);
    
    this.log('📝 Created event scripts', 'success');
  }

  async validateEnvironment() {
    this.log('🔍 Validating environment...', 'info');
    
    // Check for .env files
    const envFiles = [
      path.join(this.projectRoot, 'backend', '.env'),
      path.join(this.projectRoot, 'frontend', '.env')
    ];
    
    envFiles.forEach(envFile => {
      if (fs.existsSync(envFile)) {
        this.log(`✅ Found: ${envFile}`, 'success');
      } else {
        this.log(`⚠️ Missing: ${envFile}`, 'warning');
      }
    });
    
    // Check for required files
    const requiredFiles = [
      path.join(this.projectRoot, 'backend', 'server.js'),
      path.join(this.projectRoot, 'frontend', 'package.json'),
      path.join(this.projectRoot, 'backend', 'package.json')
    ];
    
    requiredFiles.forEach(file => {
      if (fs.existsSync(file)) {
        this.log(`✅ Found: ${path.basename(file)}`, 'success');
      } else {
        this.log(`❌ Missing: ${file}`, 'error');
        throw new Error(`Required file missing: ${file}`);
      }
    });
  }

  async testSetup() {
    this.log('🧪 Testing setup...', 'info');
    
    try {
      // Test PM2 ecosystem config
      await this.execCommand('pm2 prettylist');
      this.log('✅ PM2 is working', 'success');
    } catch (error) {
      this.log('⚠️ PM2 test failed, but local PM2 should work', 'warning');
    }
    
    // Test nodemon config
    if (fs.existsSync(path.join(this.projectRoot, 'nodemon.config.js'))) {
      this.log('✅ Nodemon config found', 'success');
    }
    
    // Test ecosystem config
    if (fs.existsSync(path.join(this.projectRoot, 'ecosystem.config.js'))) {
      this.log('✅ PM2 ecosystem config found', 'success');
    }
  }

  async setup() {
    try {
      this.log('🚀 Setting up SwiftNotes Persistent Development Environment...', 'info');
      this.log('='.repeat(70), 'info');
      
      // Step 1: Check Node.js version
      if (!(await this.checkNodeVersion())) {
        throw new Error('Node.js version check failed');
      }
      
      // Step 2: Setup directories
      await this.setupDirectories();
      
      // Step 3: Install dependencies
      await this.installDependencies();
      
      // Step 4: Check PM2
      await this.checkPM2();
      
      // Step 5: Create scripts
      await this.createScripts();
      
      // Step 6: Validate environment
      await this.validateEnvironment();
      
      // Step 7: Test setup
      await this.testSetup();
      
      this.log('🎉 Setup completed successfully!', 'success');
      this.log('='.repeat(70), 'success');
      this.log('', 'info');
      this.log('📋 Next steps:', 'info');
      this.log('  1. npm run dev:persistent  - Start persistent development server', 'info');
      this.log('  2. npm run health:monitor  - Start health monitoring (optional)', 'info');
      this.log('  3. npm run help            - View all available commands', 'info');
      this.log('', 'info');
      this.log('📊 Monitoring:', 'info');
      this.log('  - Logs: ./logs/', 'info');
      this.log('  - Health: npm run health:status', 'info');
      this.log('  - PM2 Dashboard: npm run dev:pm2:monit', 'info');
      
    } catch (error) {
      this.log(`❌ Setup failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  async clean() {
    this.log('🧹 Cleaning up development environment...', 'info');
    
    try {
      // Stop all PM2 processes
      await this.execCommand('pm2 delete all').catch(() => {});
      
      // Clean logs
      if (fs.existsSync(this.logDir)) {
        fs.rmSync(this.logDir, { recursive: true, force: true });
        this.log('🗑️ Cleaned logs directory', 'info');
      }
      
      this.log('✅ Cleanup completed', 'success');
    } catch (error) {
      this.log(`⚠️ Cleanup warning: ${error.message}`, 'warning');
    }
  }
}

// CLI Interface
const command = process.argv[2] || 'setup';
const setup = new PersistentDevSetup();

switch (command) {
  case 'setup':
    setup.setup();
    break;
  case 'clean':
    setup.clean();
    break;
  default:
    console.log('Usage: node setup-persistent-dev.js [setup|clean]');
    process.exit(1);
}

module.exports = PersistentDevSetup;
