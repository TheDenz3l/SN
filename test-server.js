#!/usr/bin/env node

/**
 * Simple HTTP Test Server for SwiftNotes Navigation Tests
 * Serves test files to avoid CORS issues with file:// protocol
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;
const HOST = 'localhost';

// MIME types for different file extensions
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return mimeTypes[ext] || 'application/octet-stream';
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end('<h1>404 - File Not Found</h1>');
      return;
    }

    const mimeType = getMimeType(filePath);
    res.writeHead(200, { 
      'Content-Type': mimeType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // Default to index.html for root path
  if (pathname === '/') {
    pathname = '/browser-navigation-test.html';
  }

  // Security: prevent directory traversal
  if (pathname.includes('..')) {
    res.writeHead(403, { 'Content-Type': 'text/html' });
    res.end('<h1>403 - Forbidden</h1>');
    return;
  }

  // Construct file path
  const filePath = path.join(__dirname, pathname);

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // Try to serve from current directory
      const fallbackPath = path.join(__dirname, path.basename(pathname));
      fs.access(fallbackPath, fs.constants.F_OK, (fallbackErr) => {
        if (fallbackErr) {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end(`
            <h1>404 - File Not Found</h1>
            <p>Requested: ${pathname}</p>
            <p>Available test files:</p>
            <ul>
              <li><a href="/browser-navigation-test.html">Navigation Test</a></li>
              <li><a href="/navigation-verification-test.html">Verification Test</a></li>
            </ul>
          `);
          return;
        }
        serveFile(res, fallbackPath);
      });
      return;
    }
    serveFile(res, filePath);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`🧪 Test Server running at http://${HOST}:${PORT}/`);
  console.log(`📁 Serving files from: ${__dirname}`);
  console.log(`🔗 Available test files:`);
  console.log(`   - http://${HOST}:${PORT}/browser-navigation-test.html`);
  console.log(`   - http://${HOST}:${PORT}/navigation-verification-test.html`);
  console.log(`\n🚀 To run tests:`);
  console.log(`   1. Start SwiftNotes: npm run dev`);
  console.log(`   2. Open: http://${HOST}:${PORT}/`);
  console.log(`   3. Click "Open SwiftNotes" and run tests`);
  console.log(`\n⏹️  Press Ctrl+C to stop the server`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Test server shutting down...');
  server.close(() => {
    console.log('✅ Test server stopped');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
