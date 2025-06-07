#!/usr/bin/env node

/**
 * SwiftNotes Health Monitor
 * Continuous health checking and auto-recovery for development servers
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class HealthMonitor {
  constructor() {
    this.projectRoot = __dirname;
    this.logDir = path.join(this.projectRoot, 'logs', 'health');
    this.healthCheckInterval = 30000; // 30 seconds
    this.maxFailures = 3;
    this.failures = { backend: 0, frontend: 0 };
    this.isRunning = false;
    
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    
    console.log(logMessage);
    
    // Write to health log
    const logFile = path.join(this.logDir, 'monitor.log');
    fs.appendFileSync(logFile, logMessage + '\n');
  }

  async checkBackendHealth() {
    try {
      const response = await axios.get('http://localhost:3001/health', {
        timeout: 5000,
        validateStatus: (status) => status < 500
      });
      
      return {
        healthy: response.status === 200,
        status: response.status,
        data: response.data,
        responseTime: response.headers['x-response-time'] || 'unknown'
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        code: error.code
      };
    }
  }

  async checkFrontendHealth() {
    try {
      const response = await axios.get('http://localhost:5173', {
        timeout: 5000,
        validateStatus: (status) => status < 500
      });
      
      return {
        healthy: response.status === 200,
        status: response.status,
        responseTime: response.headers['x-response-time'] || 'unknown'
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        code: error.code
      };
    }
  }

  async checkDatabaseHealth() {
    try {
      // Check if backend can connect to database
      const response = await axios.get('http://localhost:3001/api/health/database', {
        timeout: 10000,
        validateStatus: (status) => status < 500
      });
      
      return {
        healthy: response.status === 200,
        status: response.status,
        data: response.data
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        code: error.code
      };
    }
  }

  async restartService(service) {
    this.log(`Attempting to restart ${service}...`, 'warning');
    
    try {
      if (service === 'backend') {
        await this.execCommand('pm2 restart swiftnotes-backend || npm run backend:restart');
      } else if (service === 'frontend') {
        await this.execCommand('pm2 restart swiftnotes-frontend || npm run frontend:restart');
      }
      
      this.log(`${service} restart initiated`, 'info');
      
      // Reset failure count on successful restart
      this.failures[service] = 0;
      
    } catch (error) {
      this.log(`Failed to restart ${service}: ${error.message}`, 'error');
    }
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

  async performHealthCheck() {
    const timestamp = new Date().toISOString();
    
    // Check all services
    const [backendHealth, frontendHealth, databaseHealth] = await Promise.all([
      this.checkBackendHealth(),
      this.checkFrontendHealth(),
      this.checkDatabaseHealth()
    ]);

    const healthReport = {
      timestamp,
      backend: backendHealth,
      frontend: frontendHealth,
      database: databaseHealth,
      overall: backendHealth.healthy && frontendHealth.healthy && databaseHealth.healthy
    };

    // Log health status
    const statusFile = path.join(this.logDir, 'latest-status.json');
    fs.writeFileSync(statusFile, JSON.stringify(healthReport, null, 2));

    // Handle failures
    if (!backendHealth.healthy) {
      this.failures.backend++;
      this.log(`Backend health check failed (${this.failures.backend}/${this.maxFailures}): ${backendHealth.error || 'Unknown error'}`, 'error');
      
      if (this.failures.backend >= this.maxFailures) {
        await this.restartService('backend');
      }
    } else {
      if (this.failures.backend > 0) {
        this.log('Backend health restored', 'success');
        this.failures.backend = 0;
      }
    }

    if (!frontendHealth.healthy) {
      this.failures.frontend++;
      this.log(`Frontend health check failed (${this.failures.frontend}/${this.maxFailures}): ${frontendHealth.error || 'Unknown error'}`, 'error');
      
      if (this.failures.frontend >= this.maxFailures) {
        await this.restartService('frontend');
      }
    } else {
      if (this.failures.frontend > 0) {
        this.log('Frontend health restored', 'success');
        this.failures.frontend = 0;
      }
    }

    // Log overall status
    if (healthReport.overall) {
      this.log('All services healthy ✅', 'success');
    } else {
      this.log('Some services unhealthy ⚠️', 'warning');
    }

    return healthReport;
  }

  async start() {
    if (this.isRunning) {
      this.log('Health monitor is already running', 'warning');
      return;
    }

    this.isRunning = true;
    this.log('🏥 Starting SwiftNotes Health Monitor...', 'info');
    this.log(`Health check interval: ${this.healthCheckInterval / 1000}s`, 'info');
    this.log(`Max failures before restart: ${this.maxFailures}`, 'info');

    // Initial health check
    await this.performHealthCheck();

    // Set up periodic health checks
    this.healthInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        this.log(`Health check error: ${error.message}`, 'error');
      }
    }, this.healthCheckInterval);

    // Graceful shutdown
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());

    this.log('✅ Health monitor started', 'success');
    
    // Keep process alive
    await new Promise(() => {});
  }

  stop() {
    if (!this.isRunning) {
      return;
    }

    this.log('🛑 Stopping health monitor...', 'info');
    
    if (this.healthInterval) {
      clearInterval(this.healthInterval);
    }
    
    this.isRunning = false;
    this.log('✅ Health monitor stopped', 'success');
    process.exit(0);
  }

  async status() {
    const statusFile = path.join(this.logDir, 'latest-status.json');
    
    if (fs.existsSync(statusFile)) {
      const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
      console.log('📊 Latest Health Status:');
      console.log(JSON.stringify(status, null, 2));
    } else {
      console.log('❌ No health status available');
    }
  }
}

// CLI Interface
const command = process.argv[2] || 'start';
const monitor = new HealthMonitor();

switch (command) {
  case 'start':
    monitor.start();
    break;
  case 'stop':
    monitor.stop();
    break;
  case 'status':
    monitor.status();
    break;
  case 'check':
    monitor.performHealthCheck().then(report => {
      console.log(JSON.stringify(report, null, 2));
      process.exit(0);
    });
    break;
  default:
    console.log('Usage: node health-monitor.js [start|stop|status|check]');
    process.exit(1);
}

module.exports = HealthMonitor;
