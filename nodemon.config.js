/**
 * Enhanced Nodemon Configuration for SwiftNotes
 * Provides intelligent file watching and restart behavior
 */

module.exports = {
  // Main script to watch
  script: './backend/server.js',
  
  // File extensions to watch
  ext: 'js,json,env',
  
  // Directories and files to watch
  watch: [
    './backend/routes/',
    './backend/middleware/',
    './backend/services/',
    './backend/config/',
    './backend/server.js',
    './backend/.env'
  ],
  
  // Directories and files to ignore
  ignore: [
    './backend/node_modules/',
    './backend/logs/',
    './backend/coverage/',
    './backend/dist/',
    './backend/*.test.js',
    './backend/*.spec.js',
    './backend/test/',
    './backend/tests/',
    './logs/',
    './node_modules/',
    '.git/',
    '*.log'
  ],
  
  // Environment variables
  env: {
    NODE_ENV: 'development',
    DEBUG: 'swiftnotes:*'
  },
  
  // Restart behavior
  restartable: 'rs',
  delay: 1000, // Wait 1 second before restarting
  
  // Verbose output
  verbose: true,
  
  // Watch options
  legacyWatch: false,
  polling: false,
  
  // Events
  events: {
    restart: './scripts/on-restart.js',
    crash: './scripts/on-crash.js'
  },
  
  // Signal to send to kill the process
  signal: 'SIGTERM',
  
  // Time to wait before forcefully killing
  killTimeout: 5000,
  
  // Colors in output
  colours: true,
  
  // Clear console on restart
  clear: false,
  
  // Run in quiet mode
  quiet: false,
  
  // Additional nodemon options
  options: {
    // Ignore specific file patterns
    ignorePatterns: [
      '*.tmp',
      '*.temp',
      '*.swp',
      '*.swo',
      '*~'
    ],
    
    // Watch for changes in package.json
    watchPackageJson: true,
    
    // Restart on package.json changes
    restartOnPackageChange: true
  }
};
