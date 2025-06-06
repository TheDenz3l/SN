#!/usr/bin/env node
// Make this file executable: chmod +x server-manager.js

/**
 * SwiftNotes Server Manager
 * A Node.js-based solution to manage development servers
 * Bypasses launch-process tool limitations
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

class ServerManager {
    constructor() {
        this.projectRoot = __dirname;
        this.backendProcess = null;
        this.frontendProcess = null;
        this.logDir = path.join(this.projectRoot, 'logs');
        
        // Ensure logs directory exists
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
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

    async checkPort(port) {
        return new Promise((resolve) => {
            exec(`lsof -i :${port}`, (error) => {
                resolve(!error); // Port is in use if no error
            });
        });
    }

    async killPort(port) {
        return new Promise((resolve) => {
            exec(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, () => {
                setTimeout(resolve, 1000); // Wait for cleanup
            });
        });
    }

    async startBackend() {
        this.log('🔧 Starting backend server...', 'info');
        
        // Check if port is in use
        if (await this.checkPort(3001)) {
            this.log('⚠️  Port 3001 is in use, killing existing process...', 'warning');
            await this.killPort(3001);
        }

        // Check if .env exists
        const envPath = path.join(this.projectRoot, 'backend', '.env');
        if (!fs.existsSync(envPath)) {
            this.log('❌ Backend .env file not found!', 'error');
            throw new Error('Backend .env file missing');
        }

        // Start backend
        const backendDir = path.join(this.projectRoot, 'backend');
        const serverPath = path.join(backendDir, 'server.js');
        
        this.backendProcess = spawn('node', [serverPath], {
            cwd: backendDir,
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env }
        });

        // Setup logging
        const backendLogPath = path.join(this.logDir, 'backend.log');
        const backendLogStream = fs.createWriteStream(backendLogPath, { flags: 'a' });
        
        this.backendProcess.stdout.pipe(backendLogStream);
        this.backendProcess.stderr.pipe(backendLogStream);
        
        // Also pipe to console
        this.backendProcess.stdout.on('data', (data) => {
            process.stdout.write(`[BACKEND] ${data}`);
        });
        
        this.backendProcess.stderr.on('data', (data) => {
            process.stderr.write(`[BACKEND ERROR] ${data}`);
        });

        this.backendProcess.on('exit', (code) => {
            this.log(`Backend process exited with code ${code}`, code === 0 ? 'info' : 'error');
            this.backendProcess = null;
        });

        // Wait for backend to start
        await this.waitForPort(3001, 10000);
        this.log('✅ Backend started successfully on http://localhost:3001', 'success');
    }

    async startFrontend() {
        this.log('🎨 Starting frontend server...', 'info');
        
        // Check if port is in use
        if (await this.checkPort(5173)) {
            this.log('⚠️  Port 5173 is in use, killing existing process...', 'warning');
            await this.killPort(5173);
        }

        // Check if node_modules exists
        const frontendDir = path.join(this.projectRoot, 'frontend');
        const nodeModulesPath = path.join(frontendDir, 'node_modules');
        
        if (!fs.existsSync(nodeModulesPath)) {
            this.log('📦 Installing frontend dependencies...', 'info');
            await this.runCommand('npm', ['install'], frontendDir);
        }

        // Start frontend
        const vitePath = path.join(frontendDir, 'node_modules', '.bin', 'vite');
        
        this.frontendProcess = spawn('node', [vitePath, '--host', '0.0.0.0', '--port', '5173'], {
            cwd: frontendDir,
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env }
        });

        // Setup logging
        const frontendLogPath = path.join(this.logDir, 'frontend.log');
        const frontendLogStream = fs.createWriteStream(frontendLogPath, { flags: 'a' });
        
        this.frontendProcess.stdout.pipe(frontendLogStream);
        this.frontendProcess.stderr.pipe(frontendLogStream);
        
        // Also pipe to console
        this.frontendProcess.stdout.on('data', (data) => {
            process.stdout.write(`[FRONTEND] ${data}`);
        });
        
        this.frontendProcess.stderr.on('data', (data) => {
            process.stderr.write(`[FRONTEND ERROR] ${data}`);
        });

        this.frontendProcess.on('exit', (code) => {
            this.log(`Frontend process exited with code ${code}`, code === 0 ? 'info' : 'error');
            this.frontendProcess = null;
        });

        // Wait for frontend to start
        await this.waitForPort(5173, 15000);
        this.log('✅ Frontend started successfully on http://localhost:5173', 'success');
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

    async runCommand(command, args, cwd) {
        return new Promise((resolve, reject) => {
            const process = spawn(command, args, { cwd, stdio: 'inherit' });
            process.on('exit', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Command failed with exit code ${code}`));
                }
            });
        });
    }

    async start() {
        try {
            this.log('🚀 Starting SwiftNotes Development Environment...', 'info');
            this.log('================================================', 'info');
            
            // Start backend first
            await this.startBackend();
            
            // Then start frontend
            await this.startFrontend();
            
            this.log('🎉 SwiftNotes Development Environment Ready!', 'success');
            this.log('================================================', 'success');
            this.log('🌐 Frontend: http://localhost:5173', 'info');
            this.log('🔧 Backend:  http://localhost:3001', 'info');
            this.log('📊 Health:   http://localhost:3001/health', 'info');
            this.log('📝 Logs: ' + this.logDir, 'info');
            this.log('🛑 Press Ctrl+C to stop servers', 'warning');
            
            // Handle graceful shutdown
            process.on('SIGINT', () => this.stop());
            process.on('SIGTERM', () => this.stop());
            
            // Keep process alive
            await new Promise(() => {}); // Run forever until killed
            
        } catch (error) {
            this.log(`❌ Failed to start servers: ${error.message}`, 'error');
            await this.stop();
            process.exit(1);
        }
    }

    async stop() {
        this.log('🛑 Shutting down servers...', 'warning');
        
        if (this.backendProcess) {
            this.backendProcess.kill('SIGTERM');
            this.backendProcess = null;
        }
        
        if (this.frontendProcess) {
            this.frontendProcess.kill('SIGTERM');
            this.frontendProcess = null;
        }
        
        // Force kill any remaining processes
        await this.killPort(3001);
        await this.killPort(5173);
        
        this.log('✅ Servers stopped', 'success');
        process.exit(0);
    }

    async status() {
        const backendRunning = await this.checkPort(3001);
        const frontendRunning = await this.checkPort(5173);
        
        this.log('📊 Server Status:', 'info');
        this.log(`Backend (3001):  ${backendRunning ? '✅ Running' : '❌ Not running'}`, backendRunning ? 'success' : 'error');
        this.log(`Frontend (5173): ${frontendRunning ? '✅ Running' : '❌ Not running'}`, frontendRunning ? 'success' : 'error');
    }
}

// CLI Interface
const command = process.argv[2] || 'start';
const manager = new ServerManager();

switch (command) {
    case 'start':
        manager.start();
        break;
    case 'stop':
        manager.stop();
        break;
    case 'status':
        manager.status();
        break;
    default:
        console.log('Usage: node server-manager.js [start|stop|status]');
        process.exit(1);
}
