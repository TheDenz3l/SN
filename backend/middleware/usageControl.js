/**
 * Integrated Usage Control Middleware for SwiftNotes
 * Combines rate limiting, usage monitoring, and smart queuing
 */

const usageMonitoringService = require('../services/usageMonitoringService');
const smartQueueService = require('../services/smartQueueService');

// Enhanced middleware that provides graceful degradation
const createUsageControlMiddleware = (options = {}) => {
  const {
    enableQueue = true,
    enableMonitoring = true,
    gracefulDegradation = true,
    maxWaitTime = 30000, // 30 seconds max wait
  } = options;

  return async (req, res, next) => {
    const startTime = Date.now();
    const userId = req.user?.id;
    const userTier = req.user?.tier || 'free';
    const endpoint = req.path;

    try {
      // Check if this is an AI generation request
      const isAIRequest = endpoint.includes('/generate') || endpoint.includes('/ai/');
      
      if (isAIRequest && enableQueue && false) { // TEMPORARILY DISABLE QUEUE
        // Handle AI requests through smart queue
        await handleAIRequest(req, res, next, {
          userId,
          userTier,
          maxWaitTime,
          enableMonitoring
        });
      } else {
        // Handle regular requests with monitoring
        if (enableMonitoring) {
          await trackRegularRequest(req, res, next, {
            userId,
            endpoint,
            startTime
          });
        } else {
          next();
        }
      }
    } catch (error) {
      console.error('Usage control error:', error);
      
      if (gracefulDegradation) {
        // Continue with request even if usage control fails
        console.warn('Continuing with degraded usage control');
        next();
      } else {
        res.status(500).json({
          success: false,
          error: 'Usage control system temporarily unavailable'
        });
      }
    }
  };
};

// Handle AI generation requests through smart queue
const handleAIRequest = async (req, res, next, options) => {
  const { userId, userTier, maxWaitTime, enableMonitoring } = options;
  
  try {
    // Add request to smart queue
    const queueResult = await smartQueueService.addRequest({
      userId,
      userTier,
      type: req.body?.type || 'task',
      data: req.body,
      timeout: maxWaitTime
    });

    // Set up real-time status updates
    const requestId = queueResult.requestId;
    
    // Store request ID for client polling
    req.queueRequestId = requestId;
    
    // If queue position is reasonable, wait for result
    if (queueResult.estimatedWaitTime < maxWaitTime) {
      await waitForQueueResult(req, res, requestId, enableMonitoring);
    } else {
      // Return queue status for client polling
      res.json({
        success: true,
        queued: true,
        requestId,
        queuePosition: queueResult.queuePosition,
        estimatedWaitTime: queueResult.estimatedWaitTime,
        message: 'Request queued due to high demand. Please check status using the provided request ID.'
      });
    }
  } catch (error) {
    if (error.message.includes('Queue is full')) {
      res.status(503).json({
        success: false,
        error: 'Service temporarily overloaded. Please try again in a few minutes.',
        retryAfter: 300 // 5 minutes
      });
    } else {
      throw error;
    }
  }
};

// Wait for queue result with timeout
const waitForQueueResult = async (req, res, requestId, enableMonitoring) => {
  const maxWaitTime = 30000; // 30 seconds
  const pollInterval = 1000; // 1 second
  const startTime = Date.now();
  
  const pollForResult = async () => {
    const status = smartQueueService.getRequestStatus(requestId);
    
    if (status.status === 'completed') {
      // Track successful completion
      if (enableMonitoring) {
        await usageMonitoringService.trackAPICall({
          userId: req.user?.id,
          endpoint: req.path,
          cost: calculateCost(status.result),
          success: true,
          duration: Date.now() - startTime
        });
      }
      
      res.json({
        success: true,
        result: status.result,
        processingTime: status.processingTime
      });
      return;
    }
    
    if (status.status === 'failed') {
      // Track failure
      if (enableMonitoring) {
        await usageMonitoringService.trackAPICall({
          userId: req.user?.id,
          endpoint: req.path,
          cost: 0,
          success: false,
          duration: Date.now() - startTime
        });
      }
      
      res.status(500).json({
        success: false,
        error: status.error || 'AI generation failed',
        attempts: status.attempts
      });
      return;
    }
    
    // Check timeout
    if (Date.now() - startTime > maxWaitTime) {
      res.json({
        success: true,
        queued: true,
        requestId,
        status: status.status,
        message: 'Request is taking longer than expected. Please check status using the request ID.',
        estimatedCompletion: status.estimatedCompletion
      });
      return;
    }
    
    // Continue polling
    setTimeout(pollForResult, pollInterval);
  };
  
  // Start polling
  setTimeout(pollForResult, pollInterval);
};

// Track regular (non-AI) requests
const trackRegularRequest = async (req, res, next, options) => {
  const { userId, endpoint, startTime } = options;
  
  // Wrap response to track completion
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    const success = res.statusCode < 400;
    
    // Track the request
    usageMonitoringService.trackAPICall({
      userId,
      endpoint,
      cost: 0, // No cost for regular requests
      success,
      duration
    }).catch(error => {
      console.error('Error tracking regular request:', error);
    });
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Calculate cost based on AI result
const calculateCost = (result) => {
  if (!result || !result.tokensUsed) {
    return 0;
  }
  
  // Rough cost calculation (adjust based on actual API pricing)
  const inputTokens = result.tokensUsed * 0.7; // Assume 70% input tokens
  const outputTokens = result.tokensUsed * 0.3; // Assume 30% output tokens
  
  // Gemini 1.5 Pro pricing (approximate)
  const inputCostPer1K = 0.00125;
  const outputCostPer1K = 0.00375;
  
  return ((inputTokens / 1000) * inputCostPer1K) + ((outputTokens / 1000) * outputCostPer1K);
};

// Middleware for checking queue status
const queueStatusMiddleware = (req, res, next) => {
  const requestId = req.params.requestId || req.query.requestId;
  
  if (!requestId) {
    return res.status(400).json({
      success: false,
      error: 'Request ID is required'
    });
  }
  
  const status = smartQueueService.getRequestStatus(requestId);
  
  if (status.status === 'not_found') {
    return res.status(404).json({
      success: false,
      error: 'Request not found or expired'
    });
  }
  
  res.json({
    success: true,
    status: status.status,
    ...status
  });
};

// Middleware for getting usage statistics (admin only)
const usageStatsMiddleware = (req, res, next) => {
  // Check if user is admin
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required'
    });
  }
  
  const timeframe = req.query.timeframe || 'daily';
  const usageStats = usageMonitoringService.getUsageStats(timeframe);
  const queueStats = smartQueueService.getQueueStats();
  
  res.json({
    success: true,
    usage: usageStats,
    queue: queueStats,
    timestamp: new Date().toISOString()
  });
};

// Middleware for getting user-specific usage data
const userUsageMiddleware = (req, res, next) => {
  const userId = req.user?.id;
  const days = parseInt(req.query.days) || 7;
  
  if (!userId) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  
  const userUsage = usageMonitoringService.getUserUsage(userId, days);
  
  res.json({
    success: true,
    usage: userUsage || {
      totalRequests: 0,
      successRate: 0,
      dailyBreakdown: [],
      topEndpoints: []
    }
  });
};

// Health check middleware
const healthCheckMiddleware = (req, res, next) => {
  const queueStats = smartQueueService.getQueueStats();
  const usageStats = usageMonitoringService.getUsageStats();
  
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    queue: {
      totalQueued: queueStats.queues.total,
      processing: queueStats.processing,
      currentLoad: queueStats.currentLoad
    },
    usage: {
      totalCosts: usageStats.totalCosts,
      activeUsers: usageStats.activeUsers,
      successRate: usageStats.successRate
    }
  };
  
  // Determine overall health
  if (queueStats.currentLoad > 90) {
    health.status = 'degraded';
    health.warnings = ['High queue load'];
  }
  
  if (queueStats.queues.total > 500) {
    health.status = 'degraded';
    health.warnings = health.warnings || [];
    health.warnings.push('Large queue backlog');
  }
  
  res.json(health);
};

module.exports = {
  createUsageControlMiddleware,
  queueStatusMiddleware,
  usageStatsMiddleware,
  userUsageMiddleware,
  healthCheckMiddleware
};
