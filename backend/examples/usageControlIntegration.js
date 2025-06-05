/**
 * Example Integration of Usage Control System in Express.js
 * Shows how to integrate rate limiting, queuing, and monitoring
 */

const express = require('express');
const { getConfig } = require('../config/usageConfig');
const {
  authLimiter,
  generalLimiter,
  uploadLimiter,
  aiGenerationLimiter,
  burstProtection,
  trackUsage,
  monitorAPICosts
} = require('../middleware/rateLimiter');
const {
  createUsageControlMiddleware,
  queueStatusMiddleware,
  usageStatsMiddleware,
  userUsageMiddleware,
  healthCheckMiddleware
} = require('../middleware/usageControl');

const app = express();
const config = getConfig();

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global usage tracking (optional - tracks all requests)
if (config.features.enableUsageMonitoring) {
  app.use(trackUsage);
}

// Burst protection for all routes (prevents rapid-fire requests)
if (config.features.enableRateLimiting) {
  app.use(burstProtection);
}

// General rate limiting for all routes
if (config.features.enableRateLimiting) {
  app.use(generalLimiter);
}

// Authentication routes with specific rate limiting
app.use('/auth', authLimiter);
app.post('/auth/login', async (req, res) => {
  // Login logic here
  res.json({ success: true, message: 'Login successful' });
});

app.post('/auth/register', async (req, res) => {
  // Registration logic here
  res.json({ success: true, message: 'Registration successful' });
});

app.post('/auth/forgot-password', async (req, res) => {
  // Password reset logic here
  res.json({ success: true, message: 'Password reset email sent' });
});

// File upload routes with upload-specific rate limiting
app.use('/upload', uploadLimiter);
app.post('/upload/isp-screenshot', async (req, res) => {
  // OCR processing logic here
  res.json({ success: true, message: 'Screenshot processed' });
});

// AI generation routes with smart usage control
const usageControlMiddleware = createUsageControlMiddleware({
  enableQueue: config.features.enableSmartQueue,
  enableMonitoring: config.features.enableUsageMonitoring,
  gracefulDegradation: config.features.enableGracefulDegradation,
  maxWaitTime: config.queue.maxWaitTime
});

// Apply usage control to AI endpoints
app.use('/ai', usageControlMiddleware);

// AI generation endpoints
app.post('/ai/generate/task', async (req, res) => {
  // If we reach here, the request either:
  // 1. Was processed immediately and result is in response
  // 2. Was queued and we need to return queue status
  // 3. Failed rate limiting and was rejected
  
  // The usageControlMiddleware handles the queue logic
  // This is only reached for immediate processing or if queue is disabled
  
  try {
    const { taskDescription, userPrompt, writingStyle } = req.body;
    
    // Simulate AI generation (replace with actual Gemini API call)
    const result = await generateTaskNote({
      taskDescription,
      userPrompt,
      writingStyle,
      userId: req.user?.id
    });
    
    res.json({
      success: true,
      result: {
        generatedText: result.text,
        tokensUsed: result.tokens,
        processingTime: result.processingTime
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'AI generation failed',
      details: error.message
    });
  }
});

app.post('/ai/generate/comment', async (req, res) => {
  try {
    const { userPrompt, writingStyle } = req.body;
    
    // Simulate AI generation for comments (longer response)
    const result = await generateCommentNote({
      userPrompt,
      writingStyle,
      userId: req.user?.id
    });
    
    res.json({
      success: true,
      result: {
        generatedText: result.text,
        tokensUsed: result.tokens,
        processingTime: result.processingTime
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'AI generation failed',
      details: error.message
    });
  }
});

// Queue status endpoint
app.get('/ai/status/:requestId', queueStatusMiddleware);

// User usage statistics
app.get('/user/usage', userUsageMiddleware);

// Admin routes (protected)
app.use('/admin', (req, res, next) => {
  // Add authentication check for admin
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
});

app.get('/admin/usage-stats', usageStatsMiddleware);

// Health check endpoint
app.get('/health', healthCheckMiddleware);

// System status endpoint with detailed metrics
app.get('/system/status', (req, res) => {
  const smartQueueService = require('../services/smartQueueService');
  const usageMonitoringService = require('../services/usageMonitoringService');
  
  const queueStats = smartQueueService.getQueueStats();
  const usageStats = usageMonitoringService.getUsageStats();
  
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    system: {
      status: queueStats.currentLoad > 90 ? 'degraded' : 'healthy',
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    },
    queue: queueStats,
    usage: usageStats,
    config: {
      rateLimitingEnabled: config.features.enableRateLimiting,
      queueEnabled: config.features.enableSmartQueue,
      monitoringEnabled: config.features.enableUsageMonitoring
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Application error:', error);
  
  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    ...(isDevelopment && { details: error.message, stack: error.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Simulated AI generation functions (replace with actual implementations)
async function generateTaskNote({ taskDescription, userPrompt, writingStyle, userId }) {
  // Simulate processing time
  const processingTime = Math.random() * 3000 + 1000; // 1-4 seconds
  
  await new Promise(resolve => setTimeout(resolve, processingTime));
  
  // Simulate token usage
  const tokens = Math.floor(Math.random() * 500) + 100;
  
  return {
    text: `Generated task note based on: "${taskDescription}" with prompt: "${userPrompt}"`,
    tokens,
    processingTime
  };
}

async function generateCommentNote({ userPrompt, writingStyle, userId }) {
  // Simulate longer processing for comments
  const processingTime = Math.random() * 5000 + 2000; // 2-7 seconds
  
  await new Promise(resolve => setTimeout(resolve, processingTime));
  
  // Simulate higher token usage for comments
  const tokens = Math.floor(Math.random() * 800) + 200;
  
  return {
    text: `Generated comment note with prompt: "${userPrompt}"`,
    tokens,
    processingTime
  };
}

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  // Close Redis connections
  const { redisClient } = require('../middleware/rateLimiter');
  redisClient.quit();
  
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  
  // Close Redis connections
  const { redisClient } = require('../middleware/rateLimiter');
  redisClient.quit();
  
  process.exit(0);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 SwiftNotes API server running on port ${PORT}`);
  console.log(`📊 Usage control features:`);
  console.log(`   - Rate Limiting: ${config.features.enableRateLimiting ? '✅' : '❌'}`);
  console.log(`   - Smart Queue: ${config.features.enableSmartQueue ? '✅' : '❌'}`);
  console.log(`   - Usage Monitoring: ${config.features.enableUsageMonitoring ? '✅' : '❌'}`);
  console.log(`   - Cost Tracking: ${config.features.enableCostTracking ? '✅' : '❌'}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
