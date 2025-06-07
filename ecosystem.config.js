/**
 * PM2 Ecosystem Configuration for SwiftNotes
 * Provides persistent development server management with auto-reload and monitoring
 */

module.exports = {
  apps: [
    {
      // Backend API Server
      name: 'swiftnotes-backend',
      script: './backend/server.js',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      
      // Auto-reload configuration (disabled for stability)
      watch: false,

      
      // Environment and runtime
      env: {
        NODE_ENV: 'development',
        PORT: 3001,
        PM2_SERVE_PATH: './backend',
        PM2_SERVE_PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      
      // Process management
      autorestart: true,
      max_restarts: 5,
      min_uptime: '30s',
      max_memory_restart: '500M',
      restart_delay: 5000,
      exp_backoff_restart_delay: 100,
      
      // Logging
      log_file: './logs/backend-combined.log',
      out_file: './logs/backend-out.log',
      error_file: './logs/backend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Advanced options
      kill_timeout: 10000,
      listen_timeout: 15000,
      shutdown_with_message: true,
      wait_ready: false,
      force: true,
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true
    },
    
    {
      // Frontend Development Server
      name: 'swiftnotes-frontend',
      script: 'npm',
      args: 'run dev',
      cwd: './frontend',
      
      // Auto-reload configuration (Vite handles its own HMR)
      watch: false,
      
      // Environment and runtime
      env: {
        NODE_ENV: 'development',
        VITE_API_URL: 'http://localhost:3001/api',
        BROWSER: 'none' // Prevent auto-opening browser
      },
      env_production: {
        NODE_ENV: 'production'
      },
      
      // Process management
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      max_memory_restart: '1G',
      restart_delay: 2000,
      
      // Logging
      log_file: './logs/frontend-combined.log',
      out_file: './logs/frontend-out.log',
      error_file: './logs/frontend-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      // Advanced options
      kill_timeout: 5000,
      listen_timeout: 10000,
      shutdown_with_message: true,
      wait_ready: false,
      
      // Health monitoring
      health_check_grace_period: 5000,
      health_check_fatal_exceptions: false
    }
  ],
  
  // Deployment configuration (for future use)
  deploy: {
    production: {
      user: 'deploy',
      host: ['your-server.com'],
      ref: 'origin/main',
      repo: 'git@github.com:your-org/swiftnotes.git',
      path: '/var/www/swiftnotes',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt update && apt install git -y'
    }
  }
};
