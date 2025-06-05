/**
 * SwiftNotes Security Headers Middleware
 * Comprehensive security hardening for production deployment
 */

const helmet = require('helmet');

// Security configuration for production
const securityConfig = {
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Required for React development
        "https://cdn.jsdelivr.net", // For CDN resources
        "https://unpkg.com" // For CDN resources
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for styled-components
        "https://fonts.googleapis.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:"
      ],
      connectSrc: [
        "'self'",
        "https://ppavdpzulvosmmkzqtgy.supabase.co",
        "https://generativelanguage.googleapis.com",
        "wss://ppavdpzulvosmmkzqtgy.supabase.co"
      ],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    },
    reportOnly: false
  },

  // HTTP Strict Transport Security
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },

  // X-Frame-Options
  frameguard: {
    action: 'deny'
  },

  // X-Content-Type-Options
  noSniff: true,

  // X-XSS-Protection
  xssFilter: true,

  // Referrer Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },

  // Permissions Policy
  permissionsPolicy: {
    features: {
      camera: [],
      microphone: [],
      geolocation: [],
      payment: [],
      usb: [],
      magnetometer: [],
      gyroscope: [],
      accelerometer: [],
      ambient_light_sensor: [],
      autoplay: ['self'],
      encrypted_media: ['self'],
      fullscreen: ['self'],
      picture_in_picture: ['self']
    }
  },

  // Cross-Origin Embedder Policy
  crossOriginEmbedderPolicy: false, // Disabled for compatibility

  // Cross-Origin Opener Policy
  crossOriginOpenerPolicy: {
    policy: 'same-origin'
  },

  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: {
    policy: 'cross-origin'
  },

  // Hide X-Powered-By header
  hidePoweredBy: true,

  // Expect-CT
  expectCt: {
    maxAge: 86400,
    enforce: true
  }
};

// Additional security middleware
const additionalSecurityMiddleware = (req, res, next) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');

  // Add custom security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), ' +
    'magnetometer=(), gyroscope=(), accelerometer=(), ambient-light-sensor=(), ' +
    'autoplay=(self), encrypted-media=(self), fullscreen=(self), picture-in-picture=(self)'
  );

  // Cross-Origin policies
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  // Cache control for sensitive endpoints
  if (req.path.includes('/api/auth') || req.path.includes('/api/user')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }

  next();
};

// Rate limiting configuration
const rateLimitConfig = {
  // Global rate limit
  global: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // Limit each IP to 1000 requests per windowMs
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/api/health' || req.path === '/health';
    }
  },

  // Authentication endpoints
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 auth requests per windowMs
    message: {
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: '15 minutes'
    },
    skipSuccessfulRequests: true
  },

  // API endpoints
  api: {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 API requests per minute
    message: {
      error: 'API rate limit exceeded, please slow down.',
      retryAfter: '1 minute'
    }
  },

  // AI generation endpoints
  ai: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // Limit each IP to 50 AI requests per hour
    message: {
      error: 'AI generation rate limit exceeded, please try again later.',
      retryAfter: '1 hour'
    }
  }
};

// Input validation and sanitization
const inputValidation = {
  // Maximum request body size
  maxBodySize: '10mb',

  // File upload restrictions
  fileUpload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedMimeTypes: [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain'
    ],
    maxFiles: 5
  },

  // String length limits
  stringLimits: {
    shortText: 255,
    mediumText: 1000,
    longText: 10000,
    email: 254,
    password: 128
  }
};

// Security monitoring configuration
const securityMonitoring = {
  // Suspicious activity patterns
  suspiciousPatterns: [
    /\b(union|select|insert|delete|update|drop|create|alter)\b/i, // SQL injection
    /<script[^>]*>.*?<\/script>/gi, // XSS attempts
    /javascript:/gi, // JavaScript protocol
    /on\w+\s*=/gi, // Event handlers
    /\.\.\//g, // Path traversal
    /%2e%2e%2f/gi, // Encoded path traversal
    /\beval\s*\(/gi, // Code execution
    /\bexec\s*\(/gi, // Code execution
    /\bsystem\s*\(/gi // System commands
  ],

  // Rate limiting thresholds for alerts
  alertThresholds: {
    requestsPerMinute: 1000,
    errorsPerMinute: 100,
    authFailuresPerMinute: 10,
    suspiciousRequestsPerMinute: 5
  }
};

module.exports = {
  securityConfig,
  additionalSecurityMiddleware,
  rateLimitConfig,
  inputValidation,
  securityMonitoring,
  
  // Helper function to apply all security middleware
  applySecurityMiddleware: (app) => {
    // Apply Helmet with custom configuration
    app.use(helmet(securityConfig));
    
    // Apply additional security middleware
    app.use(additionalSecurityMiddleware);
    
    return app;
  }
};
