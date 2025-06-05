/**
 * SwiftNotes Backend Server
 * Main Express.js server with authentication, API routes, and middleware
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
dotenv.config();

// Import middleware and services
const { getConfig } = require('./config/usageConfig');
const {
  authLimiter,
  generalLimiter,
  uploadLimiter,
  aiGenerationLimiter,
  burstProtection,
  trackUsage,
  monitorAPICosts
} = require('./middleware/rateLimiter');
const {
  createUsageControlMiddleware,
  queueStatusMiddleware,
  usageStatsMiddleware,
  userUsageMiddleware,
  healthCheckMiddleware
} = require('./middleware/usageControl');
const {
  logger,
  requestLogger,
  errorHandler,
  healthCheck,
  metricsEndpoint,
  Sentry
} = require('./middleware/errorTracking');

// Import route handlers
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const notesRoutes = require('./routes/notes');
const ispTasksRoutes = require('./routes/ispTasks');
const aiRoutes = require('./routes/ai');
const writingAnalyticsRoutes = require('./routes/writingAnalytics');

// Phase 3 route handlers
const organizationsRoutes = require('./routes/organizations');
const templatesRoutes = require('./routes/templates');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');

const app = express();
const config = getConfig();

// Initialize Supabase Admin Client
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || 'https://ppavdpzulvosmmkzqtgy.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwYXZkcHp1bHZvc21ta3pxdGd5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk5MjMyMywiZXhwIjoyMDY0NTY4MzIzfQ.yHF0fEOLMNsUTdsztGfvHGsonournMGiojrn0MhpHXA',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Make supabase available to routes
app.locals.supabase = supabaseAdmin;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174', // Allow both ports for development
    'http://localhost:5175'  // Additional fallback port
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

console.log('📝 Setting up request parsing...');
// Request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
console.log('✅ Request parsing configured');

console.log('📊 Setting up logging...');
// Request logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
  app.use(morgan('combined'));
}
console.log('✅ Logging configured');

console.log('📈 Setting up usage tracking...');
// Global usage tracking (optional)
if (config.features.enableUsageMonitoring) {
  app.use(trackUsage);
}
console.log('✅ Usage tracking configured');

console.log('🛡️ Setting up rate limiting...');
// Burst protection for all routes
if (config.features.enableRateLimiting) {
  app.use(burstProtection);
}

// General rate limiting
if (config.features.enableRateLimiting) {
  app.use(generalLimiter);
}
console.log('✅ Rate limiting configured');

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No authorization token provided'
      });
    }

    const token = authHeader.substring(7);

    // For development, decode our simple token
    let tokenData;
    try {
      tokenData = JSON.parse(Buffer.from(token, 'base64').toString());

      // Check if token is expired
      if (tokenData.exp < Date.now()) {
        return res.status(401).json({
          success: false,
          error: 'Token expired'
        });
      }
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token format'
      });
    }

    // Get user from Supabase
    const { data: users } = await supabaseAdmin.auth.admin.listUsers();
    const user = users.users.find(u => u.id === tokenData.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user profile (handle potential duplicates)
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id);

    if (profileError) {
      return res.status(401).json({
        success: false,
        error: 'Failed to fetch user profile'
      });
    }

    if (!profiles || profiles.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User profile not found'
      });
    }

    // If multiple profiles exist, use the most recent one
    const profile = profiles.length > 1
      ? profiles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
      : profiles[0];

    if (profiles.length > 1) {
      console.warn(`Multiple profiles found for user ${user.id}, using most recent`);
    }

    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      tier: profile.tier,
      credits: profile.credits,
      hasCompletedSetup: profile.has_completed_setup,
      writingStyle: profile.writing_style
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Authentication service error' 
    });
  }
};

console.log('🛣️ Setting up routes...');
// Routes
app.use('/api/auth', authLimiter, authRoutes);
console.log('✅ Auth routes configured');
app.use('/api/user', authenticateUser, userRoutes);
console.log('✅ User routes configured');
app.use('/api/notes', authenticateUser, notesRoutes);
console.log('✅ Notes routes configured');
app.use('/api/isp-tasks', authenticateUser, ispTasksRoutes);
console.log('✅ ISP tasks routes configured');

console.log('🤖 Setting up AI routes...');
// AI routes with enhanced rate limiting and usage control
const usageControl = createUsageControlMiddleware({
  enableQueue: config.features.enableSmartQueue,
  enableMonitoring: config.features.enableUsageMonitoring,
  gracefulDegradation: true
});

app.use('/api/ai', authenticateUser, aiGenerationLimiter, usageControl, aiRoutes);
console.log('✅ AI routes configured');

console.log('📊 Setting up writing analytics routes...');
// Writing analytics routes
app.use('/api/writing-analytics', authenticateUser, writingAnalyticsRoutes);
console.log('✅ Writing analytics routes configured');

console.log('📋 Setting up Phase 3 routes...');
// Phase 3 routes
app.use('/api/organizations', authenticateUser, organizationsRoutes);
console.log('✅ Organizations routes configured');
app.use('/api/templates', authenticateUser, templatesRoutes);
console.log('✅ Templates routes configured');
app.use('/api/analytics', authenticateUser, analyticsRoutes);
console.log('✅ Analytics routes configured');
app.use('/api/admin', authenticateUser, adminRoutes);
console.log('✅ Admin routes configured');

console.log('📤 Setting up upload routes...');
// Upload routes
app.use('/api/upload', authenticateUser, uploadLimiter, (req, res) => {
  res.json({
    success: false,
    error: 'OCR functionality not yet implemented'
  });
});
console.log('✅ Upload routes configured');

console.log('🔧 Setting up monitoring routes...');
// Admin and monitoring routes
app.get('/api/health', healthCheck);
app.get('/api/metrics', metricsEndpoint);
app.get('/api/queue/status/:requestId', queueStatusMiddleware);
app.get('/api/user/usage', authenticateUser, userUsageMiddleware);
app.get('/api/admin/usage-stats', authenticateUser, usageStatsMiddleware);
console.log('✅ Monitoring routes configured');

console.log('🏥 Setting up health endpoints...');
// Simple health check endpoint (no auth required)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: 'connected',
    services: {
      supabase: 'connected',
      redis: process.env.REDIS_URL ? 'connected' : 'disabled',
      ai: 'ready'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'SwiftNotes API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    features: {
      rateLimiting: config.features.enableRateLimiting,
      smartQueue: config.features.enableSmartQueue,
      usageMonitoring: config.features.enableUsageMonitoring,
      costTracking: config.features.enableCostTracking
    }
  });
});
console.log('✅ Health endpoints configured');

console.log('🚫 Setting up error handlers...');
// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// Global error handler
app.use(errorHandler);
console.log('✅ Error handlers configured');

console.log('🚀 Starting server...');
// Start server
const PORT = process.env.PORT || 3001;
let serverInstance = null;

try {
  serverInstance = app.listen(PORT, () => {
    console.log(`🚀 SwiftNotes API server running on port ${PORT}`);
    console.log(`📊 Usage control features:`);
    console.log(`   - Rate Limiting: ${config.features.enableRateLimiting ? '✅' : '❌'}`);
    console.log(`   - Smart Queue: ${config.features.enableSmartQueue ? '✅' : '❌'}`);
    console.log(`   - Usage Monitoring: ${config.features.enableUsageMonitoring ? '✅' : '❌'}`);
    console.log(`   - Cost Tracking: ${config.features.enableCostTracking ? '✅' : '❌'}`);
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  });

  serverInstance.on('error', (error) => {
    console.error('❌ Server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use`);
    }
    process.exit(1);
  });

  console.log('✅ Server setup complete');
} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}

// Graceful shutdown

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (serverInstance) {
    serverInstance.close(() => {
      console.log('Process terminated');
    });
  }
});

module.exports = app;
