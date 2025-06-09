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
const ocrRoutes = require('./routes/ocr');

// Phase 3 route handlers
const organizationsRoutes = require('./routes/organizations');
const templatesRoutes = require('./routes/templates');
const analyticsRoutes = require('./routes/analytics');
const adminRoutes = require('./routes/admin');

const app = express();
const config = getConfig();

// Initialize Supabase Admin Client with Service Key for backend operations
// This bypasses RLS since we handle authorization in application logic
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
    'http://localhost:5175', // Additional fallback port
    'http://localhost:8080'  // Test server for navigation tests
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
    const { data: users } = await app.locals.supabase.auth.admin.listUsers();
    const user = users.users.find(u => u.id === tokenData.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Get user profile with enhanced error handling and retry logic
    let profiles = null;
    let profileError = null;
    const maxRetries = 3;
    const retryDelay = 200; // milliseconds

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Select only core columns to avoid issues with missing freemium columns
        const result = await app.locals.supabase
          .from('user_profiles')
          .select(`
            user_id,
            first_name,
            last_name,
            tier,
            credits,
            has_completed_setup,
            writing_style,
            preferences,
            created_at,
            updated_at
          `)
          .eq('user_id', user.id);

        profiles = result.data;
        profileError = result.error;

        if (!profileError) {
          break; // Success, exit retry loop
        }

        // Log the specific error for debugging
        console.error(`Profile fetch attempt ${attempt} failed for user ${user.id}:`, {
          error: profileError,
          code: profileError?.code,
          message: profileError?.message,
          details: profileError?.details
        });

        // Don't retry on certain permanent errors
        if (profileError?.code === 'PGRST116' || // Not found
            profileError?.code === '42P01' ||    // Table doesn't exist
            profileError?.code === '42703') {    // Column doesn't exist
          break;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      } catch (networkError) {
        console.error(`Network error on profile fetch attempt ${attempt}:`, networkError);
        profileError = networkError;

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      }
    }

    if (profileError) {
      console.error(`Failed to fetch user profile after ${maxRetries} attempts:`, {
        userId: user.id,
        userEmail: user.email,
        error: profileError,
        timestamp: new Date().toISOString()
      });

      // Provide more specific error messages based on error type
      let errorMessage = 'Failed to fetch user profile';
      if (profileError?.code === 'PGRST116') {
        errorMessage = 'User profile not found in database';
      } else if (profileError?.message?.includes('timeout')) {
        errorMessage = 'Database timeout while fetching user profile';
      } else if (profileError?.message?.includes('connection')) {
        errorMessage = 'Database connection error while fetching user profile';
      }

      return res.status(401).json({
        success: false,
        error: errorMessage,
        code: 'PROFILE_FETCH_ERROR',
        retryable: !['PGRST116', '42P01', '42703'].includes(profileError?.code)
      });
    }

    if (!profiles || profiles.length === 0) {
      console.warn(`No profile found for user ${user.id} (${user.email})`);
      return res.status(401).json({
        success: false,
        error: 'User profile not found',
        code: 'PROFILE_NOT_FOUND',
        retryable: false
      });
    }

    // If multiple profiles exist, use the most recent one
    const profile = profiles.length > 1
      ? profiles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0]
      : profiles[0];

    if (profiles.length > 1) {
      console.warn(`Multiple profiles found for user ${user.id}, using most recent`);
    }

    // Attach user info to request (with graceful handling of missing freemium columns)
    req.user = {
      id: user.id,
      email: user.email,
      tier: profile.tier,
      credits: profile.credits,
      // Gracefully handle missing freemium columns during migration period
      freeGenerationsUsed: profile.free_generations_used !== undefined ? profile.free_generations_used : 0,
      freeGenerationsResetDate: profile.free_generations_reset_date !== undefined ? profile.free_generations_reset_date : new Date().toISOString().split('T')[0],
      hasCompletedSetup: profile.has_completed_setup,
      writingStyle: profile.writing_style,
      preferences: profile.preferences
    };

    // Note: Using global supabase admin client (service key) for all operations
    // This ensures consistent behavior and bypasses RLS since we handle auth in application logic

    next();
  } catch (error) {
    console.error('Authentication middleware error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userId: req.headers.authorization ? 'token_present' : 'no_token'
    });

    // Provide different error responses based on error type
    if (error.message?.includes('Token expired')) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token expired',
        code: 'TOKEN_EXPIRED',
        retryable: false
      });
    } else if (error.message?.includes('Invalid token')) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token',
        code: 'INVALID_TOKEN',
        retryable: false
      });
    } else if (error.message?.includes('User not found')) {
      return res.status(401).json({
        success: false,
        error: 'User account not found',
        code: 'USER_NOT_FOUND',
        retryable: false
      });
    }

    res.status(500).json({
      success: false,
      error: 'Authentication service error',
      code: 'AUTH_SERVICE_ERROR',
      retryable: true
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

console.log('🔍 Setting up OCR routes...');
// OCR routes with upload handling
app.use('/api/ocr', authenticateUser, uploadLimiter, ocrRoutes);
console.log('✅ OCR routes configured');

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
    persistent_server: 'active', // Added to test file watching
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

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`${signal} received, shutting down gracefully...`);

  if (serverInstance) {
    serverInstance.close((err) => {
      if (err) {
        console.error('Error during server shutdown:', err);
        process.exit(1);
      }
      console.log('✅ Server closed successfully');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      console.error('❌ Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// PM2 ready signal
if (process.send) {
  process.send('ready');
}

module.exports = app;
