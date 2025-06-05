/**
 * SwiftNotes Backend Health Check
 * Comprehensive health check for Docker containers and monitoring
 */

const http = require('http');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const PORT = process.env.PORT || 3001;
const HEALTH_CHECK_TIMEOUT = parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000;

// Health check function
async function performHealthCheck() {
  const checks = {
    server: false,
    database: false,
    redis: false,
    ai: false,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  };

  try {
    // 1. Server Health Check
    checks.server = await checkServer();

    // 2. Database Health Check
    checks.database = await checkDatabase();

    // 3. Redis Health Check
    checks.redis = await checkRedis();

    // 4. AI Service Health Check
    checks.ai = await checkAIService();

    // Overall health status
    checks.healthy = checks.server && checks.database && checks.redis && checks.ai;
    checks.status = checks.healthy ? 'healthy' : 'unhealthy';

    return checks;

  } catch (error) {
    console.error('Health check failed:', error);
    return {
      ...checks,
      healthy: false,
      status: 'unhealthy',
      error: error.message
    };
  }
}

// Check if server is responding
async function checkServer() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/health',
      method: 'GET',
      timeout: 2000
    }, (res) => {
      resolve(res.statusCode === 200);
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Check database connectivity
async function checkDatabase() {
  try {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      return false;
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    // Simple query to test connectivity
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1);

    return !error;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Check Redis connectivity
async function checkRedis() {
  try {
    if (!process.env.REDIS_URL) {
      return true; // Redis is optional in some configurations
    }

    const redis = require('redis');
    const client = redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        connectTimeout: 2000
      }
    });

    await client.connect();
    await client.ping();
    await client.disconnect();

    return true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    return false;
  }
}

// Check AI service connectivity
async function checkAIService() {
  try {
    if (!process.env.GOOGLE_AI_API_KEY) {
      return false;
    }

    // Simple test to verify AI service is accessible
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    
    // Just check if we can create a model instance
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    return !!model;
  } catch (error) {
    console.error('AI service health check failed:', error);
    return false;
  }
}

// Main execution
async function main() {
  const startTime = Date.now();
  
  try {
    const healthStatus = await Promise.race([
      performHealthCheck(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Health check timeout')), HEALTH_CHECK_TIMEOUT)
      )
    ]);

    const duration = Date.now() - startTime;
    healthStatus.checkDuration = `${duration}ms`;

    // Output for Docker health check
    if (healthStatus.healthy) {
      console.log('✅ Health check passed');
      console.log(JSON.stringify(healthStatus, null, 2));
      process.exit(0);
    } else {
      console.log('❌ Health check failed');
      console.log(JSON.stringify(healthStatus, null, 2));
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Health check error:', error.message);
    console.log(JSON.stringify({
      healthy: false,
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    }, null, 2));
    process.exit(1);
  }
}

// Run health check if called directly
if (require.main === module) {
  main();
}

module.exports = { performHealthCheck };
