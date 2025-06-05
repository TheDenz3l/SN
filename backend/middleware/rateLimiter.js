/**
 * Smart Rate Limiting Middleware for SwiftNotes
 * User-friendly approach with multiple tiers and graceful degradation
 */

const rateLimit = require('express-rate-limit');

// Try to import Redis dependencies, fallback to memory store if not available
let RedisStore, redisClient;
const useRedis = process.env.ENABLE_REDIS === 'true' && process.env.NODE_ENV !== 'test';

if (useRedis) {
  try {
    const { default: RedisStoreClass } = require('rate-limit-redis');
    const Redis = require('redis');

    RedisStore = RedisStoreClass;
    redisClient = Redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    // Handle Redis connection errors gracefully
    redisClient.on('error', (err) => {
      console.warn('Redis connection error, falling back to memory store:', err.message);
      RedisStore = null;
      redisClient = null;
    });

    // Try to connect
    redisClient.connect().catch((err) => {
      console.warn('Redis connection failed, falling back to memory store:', err.message);
      RedisStore = null;
      redisClient = null;
    });

  } catch (error) {
    console.warn('Redis not available, using memory store for rate limiting:', error.message);
    RedisStore = null;
    redisClient = null;
  }
} else {
  console.log('Redis disabled, using memory store for rate limiting');
  RedisStore = null;
  redisClient = null;
}

// Different rate limits for different user tiers and endpoints
const rateLimitConfigs = {
  // Authentication endpoints - prevent brute force
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 attempts per window
    message: {
      error: 'Too many authentication attempts. Please try again in 15 minutes.',
      retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
  },

  // AI Generation - main feature, be generous but prevent abuse
  aiGeneration: {
    free: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 20, // 20 generations per hour for free users
      message: {
        error: 'You\'ve reached the hourly limit for free users. Upgrade for unlimited access or try again in an hour.',
        retryAfter: 60 * 60,
        upgradePrompt: true
      }
    },
    paid: {
      windowMs: 60 * 60 * 1000, // 1 hour  
      max: 200, // 200 generations per hour for paid users
      message: {
        error: 'You\'ve reached the hourly generation limit. Please try again in an hour.',
        retryAfter: 60 * 60
      }
    },
    premium: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 1000, // 1000 generations per hour for premium users
      message: {
        error: 'You\'ve reached the hourly generation limit. Please try again in an hour.',
        retryAfter: 60 * 60
      }
    }
  },

  // General API calls - very generous
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes
    message: {
      error: 'Too many requests. Please slow down a bit.',
      retryAfter: 15 * 60
    }
  },

  // File uploads (OCR) - moderate limits
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 uploads per hour
    message: {
      error: 'Upload limit reached. Please try again in an hour.',
      retryAfter: 60 * 60
    }
  }
};

// Custom key generator that considers user tier
const createKeyGenerator = (prefix) => {
  return (req) => {
    const userId = req.user?.id || req.ip;
    const userTier = req.user?.tier || 'free';
    return `${prefix}:${userTier}:${userId}`;
  };
};

// Custom handler for rate limit exceeded
const createRateLimitHandler = (config) => {
  return (req, res) => {
    const retryAfter = Math.round(config.windowMs / 1000);
    
    res.status(429).json({
      success: false,
      error: config.message.error,
      retryAfter: retryAfter,
      upgradePrompt: config.message.upgradePrompt || false,
      timestamp: new Date().toISOString()
    });
  };
};

// Create rate limiters for different endpoints
const createRateLimiter = (configKey, prefix) => {
  const config = rateLimitConfigs[configKey];

  const rateLimiterConfig = {
    windowMs: config.windowMs,
    max: config.max,
    keyGenerator: createKeyGenerator(prefix),
    handler: createRateLimitHandler(config),
    standardHeaders: true,
    legacyHeaders: false,
    // Skip successful requests in count for some endpoints
    skipSuccessfulRequests: configKey === 'auth',
  };

  // Use Redis store if available, otherwise use default memory store
  if (RedisStore && redisClient) {
    rateLimiterConfig.store = new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
    });
  }

  return rateLimit(rateLimiterConfig);
};

// Smart AI generation rate limiter that adapts to user tier
const createSmartAIRateLimiter = () => {
  return async (req, res, next) => {
    const userTier = req.user?.tier || 'free';
    const config = rateLimitConfigs.aiGeneration[userTier];
    
    if (!config) {
      return next();
    }

    const limiterConfig = {
      windowMs: config.windowMs,
      max: config.max,
      keyGenerator: createKeyGenerator('ai-gen'),
      handler: createRateLimitHandler(config),
      standardHeaders: true,
      legacyHeaders: false,
    };

    // Use Redis store if available
    if (RedisStore && redisClient) {
      limiterConfig.store = new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
      });
    }

    const limiter = rateLimit(limiterConfig);

    return limiter(req, res, next);
  };
};

// Usage tracking middleware
const trackUsage = async (req, res, next) => {
  const startTime = Date.now();
  
  // Track request
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    
    // Log usage data (implement your logging logic)
    logUsageData({
      userId: req.user?.id,
      endpoint: req.path,
      method: req.method,
      duration,
      success: res.statusCode < 400,
      timestamp: new Date(),
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Cost monitoring for AI API calls
const monitorAPICosts = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Track AI API costs if this was an AI generation request
    if (req.path.includes('/generate') && res.statusCode === 200) {
      trackAICost({
        userId: req.user?.id,
        requestType: req.body?.type || 'task',
        estimatedCost: calculateEstimatedCost(req.body),
        timestamp: new Date()
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Helper function to calculate estimated API cost
const calculateEstimatedCost = (requestBody) => {
  // Rough estimation based on token count
  const inputTokens = JSON.stringify(requestBody).length / 4; // rough estimate
  const outputTokens = 500; // average expected output
  
  // Gemini 1.5 Pro pricing (approximate)
  const inputCostPer1K = 0.00125;
  const outputCostPer1K = 0.00375;
  
  return ((inputTokens / 1000) * inputCostPer1K) + ((outputTokens / 1000) * outputCostPer1K);
};

// Usage data logging function
const logUsageData = async (data) => {
  try {
    // Store in database or analytics service
    // For now, just log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Usage Data:', data);
    }
    
    // TODO: Implement proper analytics storage
    // await analyticsService.track(data);
  } catch (error) {
    console.error('Error logging usage data:', error);
  }
};

// AI cost tracking function
const trackAICost = async (data) => {
  try {
    // Store cost data for monitoring
    if (process.env.NODE_ENV === 'development') {
      console.log('AI Cost Data:', data);
    }
    
    // TODO: Implement cost tracking storage
    // await costTrackingService.track(data);
  } catch (error) {
    console.error('Error tracking AI cost:', error);
  }
};

// Burst protection middleware - prevents rapid-fire requests
const createBurstProtection = () => {
  const burstConfig = {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute max
    keyGenerator: createKeyGenerator('burst'),
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        error: 'Too many requests in a short time. Please slow down.',
        retryAfter: 60,
        timestamp: new Date().toISOString()
      });
    },
    standardHeaders: true,
    legacyHeaders: false,
  };

  // Use Redis store if available
  if (RedisStore && redisClient) {
    burstConfig.store = new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
    });
  }

  return rateLimit(burstConfig);
};

// Enhanced AI rate limiter with daily limits
const createEnhancedAIRateLimiter = () => {
  return async (req, res, next) => {
    const userTier = req.user?.tier || 'free';
    const userId = req.user?.id || req.ip;

    // Check hourly limit first
    const hourlyConfig = rateLimitConfigs.aiGeneration[userTier];
    if (hourlyConfig) {
      const hourlyLimiterConfig = {
        windowMs: hourlyConfig.windowMs,
        max: hourlyConfig.max,
        keyGenerator: () => `ai-hourly:${userTier}:${userId}`,
        handler: createRateLimitHandler(hourlyConfig),
        standardHeaders: true,
        legacyHeaders: false,
      };

      // Use Redis store if available
      if (RedisStore && redisClient) {
        hourlyLimiterConfig.store = new RedisStore({
          sendCommand: (...args) => redisClient.sendCommand(args),
        });
      }

      const hourlyLimiter = rateLimit(hourlyLimiterConfig);

      // Apply hourly limit
      await new Promise((resolve, reject) => {
        hourlyLimiter(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    // Check daily limit if hourly passed
    const dailyMax = hourlyConfig?.dailyMax;
    if (dailyMax) {
      const dailyLimiterConfig = {
        windowMs: 24 * 60 * 60 * 1000, // 24 hours
        max: dailyMax,
        keyGenerator: () => `ai-daily:${userTier}:${userId}`,
        handler: (req, res) => {
          res.status(429).json({
            success: false,
            error: `Daily limit of ${dailyMax} AI generations reached. Upgrade your plan or try again tomorrow.`,
            retryAfter: 24 * 60 * 60,
            upgradePrompt: userTier === 'free',
            timestamp: new Date().toISOString()
          });
        },
        standardHeaders: true,
        legacyHeaders: false,
      };

      // Use Redis store if available
      if (RedisStore && redisClient) {
        dailyLimiterConfig.store = new RedisStore({
          sendCommand: (...args) => redisClient.sendCommand(args),
        });
      }

      const dailyLimiter = rateLimit(dailyLimiterConfig);

      await new Promise((resolve, reject) => {
        dailyLimiter(req, res, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }

    next();
  };
};

// Create no-op middleware for when rate limiting is disabled
const createNoOpMiddleware = () => (req, res, next) => next();

// Export rate limiters
module.exports = {
  // Individual rate limiters - use no-op if Redis is not available
  authLimiter: RedisStore ? createRateLimiter('auth', 'auth') : createNoOpMiddleware(),
  generalLimiter: RedisStore ? createRateLimiter('general', 'general') : createNoOpMiddleware(),
  uploadLimiter: RedisStore ? createRateLimiter('upload', 'upload') : createNoOpMiddleware(),
  aiGenerationLimiter: RedisStore ? createEnhancedAIRateLimiter() : createNoOpMiddleware(),
  burstProtection: RedisStore ? createBurstProtection() : createNoOpMiddleware(),

  // Legacy limiter for backward compatibility
  smartAILimiter: RedisStore ? createSmartAIRateLimiter() : createNoOpMiddleware(),

  // Middleware
  trackUsage,
  monitorAPICosts,

  // Utility functions
  calculateEstimatedCost,

  // Redis client for cleanup
  redisClient
};
