/**
 * Usage Control Configuration for SwiftNotes
 * Centralized configuration for rate limiting, queuing, and monitoring
 */

const usageConfig = {
  // Rate Limiting Configuration
  rateLimits: {
    // Authentication endpoints - prevent brute force (more aggressive)
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per window (reduced from 10)
      skipSuccessfulRequests: true,
      message: 'Too many authentication attempts. Please try again in 15 minutes.'
    },

    // AI Generation limits by user tier (more aggressive)
    aiGeneration: {
      free: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 10, // 10 generations per hour (reduced from 20)
        dailyMax: 25, // 25 generations per day
        message: 'You\'ve reached the hourly limit for free users. Upgrade for unlimited access or try again in an hour.',
        upgradePrompt: true
      },
      paid: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 100, // 100 generations per hour (reduced from 200)
        dailyMax: 500, // 500 generations per day
        message: 'You\'ve reached the hourly generation limit. Please try again in an hour.'
      },
      premium: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 300, // 300 generations per hour (reduced from 1000)
        dailyMax: 2000, // 2000 generations per day
        message: 'You\'ve reached the hourly generation limit. Please try again in an hour.'
      }
    },

    // General API calls - more restrictive
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 500, // 500 requests per 15 minutes (reduced from 1000)
      message: 'Too many requests. Please slow down a bit.'
    },

    // File uploads (OCR) - more restrictive
    upload: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 20, // 20 uploads per hour (reduced from 50)
      dailyMax: 100, // 100 uploads per day
      message: 'Upload limit reached. Please try again in an hour.'
    },

    // Admin endpoints - more restrictive
    admin: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 50, // 50 admin requests per hour (reduced from 100)
      message: 'Admin rate limit exceeded.'
    },

    // New: Burst protection for rapid requests
    burst: {
      windowMs: 60 * 1000, // 1 minute
      max: 30, // 30 requests per minute max
      message: 'Too many requests in a short time. Please slow down.'
    }
  },

  // Smart Queue Configuration (more aggressive)
  queue: {
    maxConcurrent: 6,            // Max concurrent AI API calls (reduced from 10)
    maxQueueSize: 500,           // Max total queue size (reduced from 1000)
    requestTimeout: 45000,       // 45 seconds timeout per request (reduced from 60)
    retryAttempts: 2,            // Max retry attempts (reduced from 3)
    retryDelay: 3000,            // Initial retry delay (ms) (increased from 2000)
    cleanupInterval: 180000,     // 3 minutes cleanup interval (reduced from 5)

    // Priority settings (more strict)
    priorities: {
      urgent: 'high',     // Emergency requests
      premium: 'high',    // Premium user requests
      paid: 'normal',     // Paid user requests
      free: 'low'         // Free user requests
    },

    // Wait time thresholds (more aggressive)
    maxWaitTime: 20000,          // 20 seconds max wait before returning queue status (reduced from 30)
    pollInterval: 1500,          // 1.5 second polling interval (increased from 1)

    // New: Queue limits per user tier
    userQueueLimits: {
      free: 3,            // Max 3 queued requests per free user
      paid: 10,           // Max 10 queued requests per paid user
      premium: 25         // Max 25 queued requests per premium user
    },

    // New: Stricter queue management
    queueTimeouts: {
      free: 60000,        // 1 minute max queue time for free users
      paid: 180000,       // 3 minutes max queue time for paid users
      premium: 300000     // 5 minutes max queue time for premium users
    }
  },

  // Usage Monitoring Configuration (more aggressive)
  monitoring: {
    // Alert thresholds (more aggressive)
    alerts: {
      dailyCostLimit: 50,        // $50 per day (reduced from $100)
      hourlyCostLimit: 10,       // $10 per hour (reduced from $20)
      userDailyLimit: 30,        // 30 generations per user per day (reduced from 50)
      suspiciousActivityThreshold: 50, // requests per minute (reduced from 100)

      // Queue health alerts (more aggressive)
      queueSizeWarning: 200,     // Warn when queue size exceeds this (reduced from 500)
      queueSizeCritical: 350,    // Critical alert when queue size exceeds this (reduced from 800)
      processingTimeWarning: 7000, // Warn when avg processing time > 7s (reduced from 10s)
      errorRateWarning: 0.05,    // Warn when error rate > 5% (reduced from 10%)

      // New: More aggressive monitoring
      userHourlyLimit: 15,       // 15 generations per user per hour
      rapidRequestThreshold: 10, // 10 requests in 30 seconds triggers alert
      failureRateThreshold: 0.15, // 15% failure rate triggers investigation
      costPerRequestThreshold: 0.50, // Alert if cost per request > $0.50
    },
    
    // Data retention
    dataRetention: {
      usageData: 30,             // Keep usage data for 30 days
      queueData: 7,              // Keep queue data for 7 days
      errorLogs: 14,             // Keep error logs for 14 days
    },
    
    // Cleanup intervals
    cleanupIntervals: {
      usageData: 24 * 60 * 60 * 1000,    // Daily cleanup
      queueData: 60 * 60 * 1000,         // Hourly cleanup
      errorLogs: 6 * 60 * 60 * 1000,     // Every 6 hours
    }
  },

  // Cost Calculation Configuration
  costs: {
    // Gemini 1.5 Pro pricing (per 1K tokens)
    gemini: {
      inputCostPer1K: 0.00125,   // $0.00125 per 1K input tokens
      outputCostPer1K: 0.00375,  // $0.00375 per 1K output tokens
    },
    
    // Token estimation ratios
    tokenRatios: {
      inputRatio: 0.7,           // 70% of tokens are typically input
      outputRatio: 0.3,          // 30% of tokens are typically output
      charactersPerToken: 4,     // Rough estimate: 4 characters per token
    },
    
    // Credit system
    credits: {
      taskGeneration: 1,         // 1 credit per task generation
      commentGeneration: 2,      // 2 credits per comment generation
      ocrProcessing: 1,          // 1 credit per OCR processing
    }
  },

  // Feature Flags
  features: {
    enableRateLimiting: true,
    enableSmartQueue: true,
    enableUsageMonitoring: true,
    enableCostTracking: true,
    enableGracefulDegradation: true,
    enableRealTimeAlerts: true,
    enableUsageAnalytics: true,
  },

  // Environment-specific overrides
  environments: {
    development: {
      rateLimits: {
        aiGeneration: {
          free: { max: 20, dailyMax: 50 },      // Still generous but controlled in dev
          paid: { max: 150, dailyMax: 300 },
          premium: { max: 500, dailyMax: 1000 }
        },
        general: { max: 200 },     // Reduced general limit in dev
        upload: { max: 10, dailyMax: 30 }  // Lower upload limits in dev
      },
      queue: {
        maxConcurrent: 3,          // Lower concurrency in dev (reduced from 5)
        maxQueueSize: 50,          // Smaller queue in dev (reduced from 100)
        userQueueLimits: {
          free: 2,                 // Max 2 queued requests per free user in dev
          paid: 5,
          premium: 10
        }
      },
      monitoring: {
        alerts: {
          dailyCostLimit: 5,       // Lower cost limits in dev (reduced from 10)
          hourlyCostLimit: 2,      // Reduced from 5
          userDailyLimit: 15,      // Reduced daily limit in dev
          suspiciousActivityThreshold: 20 // Lower threshold in dev
        }
      }
    },
    
    staging: {
      rateLimits: {
        aiGeneration: {
          free: { max: 50 },       // Moderate limits in staging
          paid: { max: 300 },
          premium: { max: 1500 }
        }
      },
      queue: {
        maxConcurrent: 8,
        maxQueueSize: 500,
      }
    },
    
    production: {
      // Use default values for production
      monitoring: {
        alerts: {
          dailyCostLimit: 200,     // Higher limits in production
          hourlyCostLimit: 50,
        }
      }
    }
  }
};

// Function to get configuration for current environment
const getConfig = (environment = process.env.NODE_ENV || 'development') => {
  const baseConfig = { ...usageConfig };
  const envOverrides = usageConfig.environments[environment] || {};
  
  // Deep merge environment overrides
  return deepMerge(baseConfig, envOverrides);
};

// Deep merge utility function
const deepMerge = (target, source) => {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
};

// Function to update configuration at runtime
const updateConfig = (path, value) => {
  const keys = path.split('.');
  let current = usageConfig;
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {};
    }
    current = current[keys[i]];
  }
  
  current[keys[keys.length - 1]] = value;
};

// Function to get specific configuration value
const getConfigValue = (path, defaultValue = null) => {
  const keys = path.split('.');
  let current = getConfig();
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return defaultValue;
    }
  }
  
  return current;
};

// Validation function for configuration
const validateConfig = (config = getConfig()) => {
  const errors = [];
  
  // Validate rate limits
  if (!config.rateLimits || typeof config.rateLimits !== 'object') {
    errors.push('rateLimits configuration is required');
  }
  
  // Validate queue configuration
  if (!config.queue || typeof config.queue !== 'object') {
    errors.push('queue configuration is required');
  } else {
    if (config.queue.maxConcurrent <= 0) {
      errors.push('queue.maxConcurrent must be greater than 0');
    }
    if (config.queue.maxQueueSize <= 0) {
      errors.push('queue.maxQueueSize must be greater than 0');
    }
  }
  
  // Validate monitoring configuration
  if (!config.monitoring || typeof config.monitoring !== 'object') {
    errors.push('monitoring configuration is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  usageConfig,
  getConfig,
  updateConfig,
  getConfigValue,
  validateConfig,
  deepMerge
};
