# SwiftNotes Usage Control System

A comprehensive, user-friendly usage control system that provides rate limiting, smart queuing, and usage monitoring without being overly aggressive.

## 🎯 **Key Features**

### ✅ **User-Friendly Rate Limiting**
- **Generous limits** that don't interfere with normal usage
- **Tier-based limits** (Free, Paid, Premium users)
- **Graceful degradation** instead of hard blocks
- **Clear error messages** with helpful guidance

### 🚀 **Smart Queue System**
- **Intelligent prioritization** based on user tier
- **Real-time status updates** for queued requests
- **Automatic retry** with exponential backoff
- **Load balancing** to prevent API overload

### 📊 **Usage Monitoring & Analytics**
- **Real-time cost tracking** for AI API calls
- **Usage pattern analysis** and anomaly detection
- **Automated alerts** for unusual activity
- **Detailed analytics** for optimization

## 📋 **Rate Limits (More Aggressive Configuration)**

### Free Users
- **AI Generations**: 10 per hour, 25 per day
- **File Uploads**: 20 per hour, 100 per day
- **General API**: 500 per 15 minutes
- **Authentication**: 5 attempts per 15 minutes
- **Burst Protection**: 30 requests per minute

### Paid Users
- **AI Generations**: 100 per hour, 500 per day
- **File Uploads**: 20 per hour, 100 per day
- **General API**: 500 per 15 minutes
- **Burst Protection**: 30 requests per minute

### Premium Users
- **AI Generations**: 300 per hour, 2000 per day
- **File Uploads**: 20 per hour, 100 per day
- **General API**: 500 per 15 minutes
- **Burst Protection**: 30 requests per minute

> **Note**: These limits are more protective against abuse while still allowing reasonable usage for legitimate users.

## 🚀 **Quick Setup**

### 1. Install Dependencies
```bash
npm install express-rate-limit rate-limit-redis redis uuid
```

### 2. Set Up Redis (Required for distributed rate limiting)
```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Or install locally
# macOS: brew install redis
# Ubuntu: sudo apt-get install redis-server
```

### 3. Environment Variables
```env
REDIS_URL=redis://localhost:6379
NODE_ENV=development
APP_VERSION=1.0.0
```

### 4. Basic Integration
```javascript
const express = require('express');
const { createUsageControlMiddleware } = require('./middleware/usageControl');

const app = express();

// Apply usage control to AI endpoints
const usageControl = createUsageControlMiddleware({
  enableQueue: true,
  enableMonitoring: true,
  gracefulDegradation: true
});

app.use('/ai', usageControl);

app.post('/ai/generate', (req, res) => {
  // Your AI generation logic here
  res.json({ success: true, result: 'Generated content' });
});
```

## 🔧 **Configuration**

### Adjusting Rate Limits
```javascript
const { updateConfig } = require('./config/usageConfig');

// Increase free user limit
updateConfig('rateLimits.aiGeneration.free.max', 30);

// Adjust queue size
updateConfig('queue.maxQueueSize', 2000);
```

### Environment-Specific Settings
The system automatically applies different settings based on `NODE_ENV`:

- **Development**: More generous limits, lower concurrency
- **Staging**: Moderate limits for testing
- **Production**: Full production limits

## 📊 **Monitoring & Analytics**

### Real-Time Health Check
```bash
GET /health
```
```json
{
  "status": "healthy",
  "timestamp": "2025-01-27T10:30:00Z",
  "queue": {
    "totalQueued": 5,
    "processing": 3,
    "currentLoad": 30
  },
  "usage": {
    "totalCosts": 12.50,
    "activeUsers": 25,
    "successRate": 98.5
  }
}
```

### User Usage Statistics
```bash
GET /user/usage?days=7
```
```json
{
  "success": true,
  "usage": {
    "totalRequests": 45,
    "successRate": 97.8,
    "dailyBreakdown": [
      {
        "date": "2025-01-27",
        "requests": 12,
        "endpoints": {
          "/ai/generate/task": 8,
          "/ai/generate/comment": 4
        }
      }
    ]
  }
}
```

### Admin Analytics
```bash
GET /admin/usage-stats
```
```json
{
  "success": true,
  "usage": {
    "totalCosts": 125.75,
    "totalRequests": 1250,
    "activeUsers": 89,
    "successRate": 96.2
  },
  "queue": {
    "queues": {
      "high": 2,
      "normal": 8,
      "low": 15,
      "total": 25
    },
    "processing": 7,
    "currentLoad": 70
  }
}
```

## 🔄 **Queue System Usage**

### Immediate Processing
For requests that can be processed immediately:
```json
{
  "success": true,
  "result": {
    "generatedText": "Your generated content...",
    "tokensUsed": 245,
    "processingTime": 2340
  }
}
```

### Queued Requests
For requests that need to be queued:
```json
{
  "success": true,
  "queued": true,
  "requestId": "uuid-here",
  "queuePosition": 5,
  "estimatedWaitTime": 15000,
  "message": "Request queued due to high demand..."
}
```

### Checking Queue Status
```bash
GET /ai/status/{requestId}
```
```json
{
  "success": true,
  "status": "processing",
  "startedAt": "2025-01-27T10:30:00Z",
  "estimatedCompletion": "2025-01-27T10:30:15Z"
}
```

## 🚨 **Alert System**

The system automatically monitors for:

- **High API costs** (daily/hourly limits)
- **Unusual user activity** (suspicious patterns)
- **Queue overload** (too many pending requests)
- **High error rates** (system health issues)

### Alert Types
- **INFO**: Normal operational alerts
- **MEDIUM**: Attention needed but not critical
- **HIGH**: Immediate attention required

## 🛠 **Customization Examples**

### Custom Rate Limits for Specific Users
```javascript
// In your middleware
app.use('/ai', (req, res, next) => {
  if (req.user?.id === 'special-user-id') {
    req.user.tier = 'premium'; // Override tier
  }
  next();
});
```

### Custom Cost Calculation
```javascript
const { calculateEstimatedCost } = require('./middleware/rateLimiter');

// Override cost calculation
const customCost = (requestBody) => {
  // Your custom logic here
  return calculateEstimatedCost(requestBody) * 1.2; // 20% markup
};
```

### Custom Queue Priorities
```javascript
// Add urgent priority for specific conditions
app.post('/ai/generate/urgent', (req, res, next) => {
  req.body.priority = 'urgent';
  next();
});
```

## 🔍 **Troubleshooting**

### Common Issues

1. **Redis Connection Errors**
   ```bash
   Error: Redis connection failed
   ```
   **Solution**: Ensure Redis is running and `REDIS_URL` is correct

2. **Queue Not Processing**
   ```bash
   Requests stuck in queue
   ```
   **Solution**: Check `maxConcurrent` setting and AI API availability

3. **Rate Limit Too Aggressive**
   ```bash
   Users hitting limits frequently
   ```
   **Solution**: Adjust limits in `usageConfig.js` or use environment overrides

### Debug Mode
```javascript
// Enable detailed logging
process.env.DEBUG_USAGE_CONTROL = 'true';
```

## 📈 **Performance Considerations**

- **Redis Memory**: Monitor Redis memory usage for large user bases
- **Queue Size**: Adjust `maxQueueSize` based on your server capacity
- **Cleanup Intervals**: Tune cleanup frequencies for optimal performance
- **Monitoring Overhead**: Disable detailed monitoring in high-traffic scenarios if needed

## 🔒 **Security Features**

- **IP-based rate limiting** for unauthenticated requests
- **User-based rate limiting** for authenticated requests
- **Suspicious activity detection** with automatic alerts
- **Request validation** and sanitization
- **Secure error handling** (no sensitive data exposure)

## 📚 **API Reference**

### Middleware Functions
- `createUsageControlMiddleware(options)` - Main usage control middleware
- `queueStatusMiddleware` - Check queue status
- `usageStatsMiddleware` - Get usage statistics
- `userUsageMiddleware` - Get user-specific usage
- `healthCheckMiddleware` - System health check

### Configuration Functions
- `getConfig(environment)` - Get environment-specific config
- `updateConfig(path, value)` - Update configuration at runtime
- `getConfigValue(path, defaultValue)` - Get specific config value
- `validateConfig(config)` - Validate configuration

This system is designed to be **user-friendly first** while providing robust protection against abuse. The generous default limits ensure normal users never hit restrictions while the smart queue system handles peak loads gracefully.
