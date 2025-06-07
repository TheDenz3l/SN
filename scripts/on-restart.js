#!/usr/bin/env node
console.log('[RESTART] SwiftNotes backend restarting...');
const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, '..', 'logs', 'restarts.log');
fs.appendFileSync(logFile, `[${new Date().toISOString()}] Backend restarted\n`);
