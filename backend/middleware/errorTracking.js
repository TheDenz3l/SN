/**
 * Advanced Error Tracking and Monitoring Middleware
 * Integrates with Sentry, custom logging, and performance monitoring
 */

const winston = require('winston');
const Sentry = require('@sentry/node');

// Initialize Sentry for production error tracking (without profiling)
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  const integrations = [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app: require('express')() }),
  ];

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    release: process.env.npm_package_version || '1.0.0',
    integrations,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event, hint) {
      // Filter out sensitive information
      if (event.request) {
        delete event.request.headers?.authorization;
        delete event.request.headers?.cookie;
      }
      
      // Filter out known non-critical errors
      if (event.exception) {
        const error = hint.originalException;
        if (error?.code === 'ECONNRESET' || error?.code === 'EPIPE') {
          return null; // Don't send connection reset errors
        }
      }
      
      return event;
    },
  });
}

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
      return JSON.stringify({
        timestamp,
        level,
        message,
        stack,
        ...meta,
        service: 'swiftnotes-backend',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      });
    })
  ),
  defaultMeta: {
    service: 'swiftnotes-backend',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: process.env.LOG_FILE || 'logs/swiftnotes.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Separate file for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 10485760,
      maxFiles: 5,
      tailable: true
    })
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ]
});

// Performance monitoring
const performanceMetrics = {
  requests: new Map(),
  errors: new Map(),
  responseTime: [],
  
  recordRequest(req) {
    const key = `${req.method} ${req.route?.path || req.path}`;
    this.requests.set(key, (this.requests.get(key) || 0) + 1);
  },
  
  recordError(req, error) {
    const key = `${req.method} ${req.route?.path || req.path}`;
    this.errors.set(key, (this.errors.get(key) || 0) + 1);
  },
  
  recordResponseTime(time) {
    this.responseTime.push(time);
    // Keep only last 1000 entries
    if (this.responseTime.length > 1000) {
      this.responseTime = this.responseTime.slice(-1000);
    }
  },
  
  getMetrics() {
    const avgResponseTime = this.responseTime.length > 0 
      ? this.responseTime.reduce((a, b) => a + b, 0) / this.responseTime.length 
      : 0;
      
    return {
      totalRequests: Array.from(this.requests.values()).reduce((a, b) => a + b, 0),
      totalErrors: Array.from(this.errors.values()).reduce((a, b) => a + b, 0),
      averageResponseTime: Math.round(avgResponseTime),
      requestsByEndpoint: Object.fromEntries(this.requests),
      errorsByEndpoint: Object.fromEntries(this.errors)
    };
  }
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Generate request ID
  req.requestId = require('crypto').randomUUID();
  
  // Log request start
  logger.info('Request started', {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    userId: req.user?.id
  });
  
  // Record metrics
  performanceMetrics.recordRequest(req);
  
  // Override res.end to log response
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    performanceMetrics.recordResponseTime(responseTime);
    
    logger.info('Request completed', {
      requestId: req.requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userId: req.user?.id
    });
    
    originalEnd.apply(this, args);
  };
  
  next();
};

// Error handling middleware
const errorHandler = (error, req, res, next) => {
  const errorId = require('crypto').randomUUID();
  
  // Record error metrics
  performanceMetrics.recordError(req, error);
  
  // Determine error severity and status code
  let statusCode = error.statusCode || error.status || 500;
  let severity = 'error';
  
  if (statusCode < 500) {
    severity = 'warn';
  }
  
  // Log error details
  logger[severity]('Request error', {
    errorId,
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    statusCode,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    },
    userId: req.user?.id,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  // Send to Sentry for production errors
  if (process.env.NODE_ENV === 'production' && statusCode >= 500) {
    Sentry.withScope((scope) => {
      scope.setTag('errorId', errorId);
      scope.setTag('requestId', req.requestId);
      scope.setUser({
        id: req.user?.id,
        ip_address: req.ip
      });
      scope.setContext('request', {
        method: req.method,
        url: req.url,
        headers: req.headers
      });
      Sentry.captureException(error);
    });
  }
  
  // Send error response
  const errorResponse = {
    error: true,
    errorId,
    message: statusCode >= 500 ? 'Internal server error' : error.message,
    statusCode
  };
  
  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
  }
  
  res.status(statusCode).json(errorResponse);
};

// Health check endpoint with metrics
const healthCheck = (req, res) => {
  const metrics = performanceMetrics.getMetrics();
  const memoryUsage = process.memoryUsage();
  
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    metrics,
    memory: {
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
      external: Math.round(memoryUsage.external / 1024 / 1024) + 'MB'
    }
  };
  
  res.json(healthData);
};

// Metrics endpoint for Prometheus
const metricsEndpoint = (req, res) => {
  const metrics = performanceMetrics.getMetrics();
  const memoryUsage = process.memoryUsage();
  
  let prometheusMetrics = '';
  
  // Request metrics
  prometheusMetrics += `# HELP swiftnotes_requests_total Total number of requests\n`;
  prometheusMetrics += `# TYPE swiftnotes_requests_total counter\n`;
  prometheusMetrics += `swiftnotes_requests_total ${metrics.totalRequests}\n\n`;
  
  // Error metrics
  prometheusMetrics += `# HELP swiftnotes_errors_total Total number of errors\n`;
  prometheusMetrics += `# TYPE swiftnotes_errors_total counter\n`;
  prometheusMetrics += `swiftnotes_errors_total ${metrics.totalErrors}\n\n`;
  
  // Response time
  prometheusMetrics += `# HELP swiftnotes_response_time_ms Average response time in milliseconds\n`;
  prometheusMetrics += `# TYPE swiftnotes_response_time_ms gauge\n`;
  prometheusMetrics += `swiftnotes_response_time_ms ${metrics.averageResponseTime}\n\n`;
  
  // Memory metrics
  prometheusMetrics += `# HELP swiftnotes_memory_usage_bytes Memory usage in bytes\n`;
  prometheusMetrics += `# TYPE swiftnotes_memory_usage_bytes gauge\n`;
  prometheusMetrics += `swiftnotes_memory_usage_bytes{type="rss"} ${memoryUsage.rss}\n`;
  prometheusMetrics += `swiftnotes_memory_usage_bytes{type="heap_total"} ${memoryUsage.heapTotal}\n`;
  prometheusMetrics += `swiftnotes_memory_usage_bytes{type="heap_used"} ${memoryUsage.heapUsed}\n\n`;
  
  res.set('Content-Type', 'text/plain');
  res.send(prometheusMetrics);
};

module.exports = {
  logger,
  requestLogger,
  errorHandler,
  healthCheck,
  metricsEndpoint,
  performanceMetrics,
  Sentry
};
