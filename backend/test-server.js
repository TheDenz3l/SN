console.log('Starting test...');

try {
  console.log('Loading express...');
  const express = require('express');
  console.log('✅ Express loaded');

  console.log('Loading cors...');
  const cors = require('cors');
  console.log('✅ CORS loaded');

  console.log('Loading helmet...');
  const helmet = require('helmet');
  console.log('✅ Helmet loaded');

  console.log('Loading morgan...');
  const morgan = require('morgan');
  console.log('✅ Morgan loaded');

  console.log('Loading dotenv...');
  const dotenv = require('dotenv');
  console.log('✅ Dotenv loaded');

  console.log('Loading supabase...');
  const { createClient } = require('@supabase/supabase-js');
  console.log('✅ Supabase loaded');

  console.log('Configuring dotenv...');
  dotenv.config();
  console.log('✅ Environment configured');

  console.log('Loading config...');
  const { getConfig } = require('./config/usageConfig');
  console.log('✅ Config loaded');

  console.log('Loading rate limiter...');
  const {
    authLimiter,
    generalLimiter,
    uploadLimiter,
    aiGenerationLimiter,
    burstProtection,
    trackUsage,
    monitorAPICosts
  } = require('./middleware/rateLimiter');
  console.log('✅ Rate limiter loaded');

  console.log('Loading usage control...');
  const {
    createUsageControlMiddleware,
    queueStatusMiddleware,
    usageStatsMiddleware,
    userUsageMiddleware,
    healthCheckMiddleware
  } = require('./middleware/usageControl');
  console.log('✅ Usage control loaded');

  console.log('Loading error tracking...');
  const {
    logger,
    requestLogger,
    errorHandler,
    healthCheck,
    metricsEndpoint,
    Sentry
  } = require('./middleware/errorTracking');
  console.log('✅ Error tracking loaded');

  console.log('All middleware imports successful!');

  console.log('Loading routes...');
  const authRoutes = require('./routes/auth');
  console.log('✅ Auth routes loaded');
  const userRoutes = require('./routes/user');
  console.log('✅ User routes loaded');
  const notesRoutes = require('./routes/notes');
  console.log('✅ Notes routes loaded');
  const ispTasksRoutes = require('./routes/ispTasks');
  console.log('✅ ISP tasks routes loaded');
  const aiRoutes = require('./routes/ai');
  console.log('✅ AI routes loaded');

  // Phase 3 route handlers
  const organizationsRoutes = require('./routes/organizations');
  console.log('✅ Organizations routes loaded');
  const templatesRoutes = require('./routes/templates');
  console.log('✅ Templates routes loaded');
  const analyticsRoutes = require('./routes/analytics');
  console.log('✅ Analytics routes loaded');
  const adminRoutes = require('./routes/admin');
  console.log('✅ Admin routes loaded');

  console.log('All routes loaded successfully!');
} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}
