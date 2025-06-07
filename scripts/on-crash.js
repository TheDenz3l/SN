#!/usr/bin/env node
console.log('[CRASH] SwiftNotes backend crashed!');
const fs = require('fs');
const path = require('path');
const logFile = path.join(__dirname, '..', 'logs', 'crashes.log');
fs.appendFileSync(logFile, `[${new Date().toISOString()}] Backend crashed\n`);
