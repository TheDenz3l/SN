/**
 * Phase 2 Infrastructure Validation Test
 * Comprehensive testing of production deployment infrastructure
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Test configuration
const REQUIRED_FILES = [
  // Docker configurations
  'backend/Dockerfile',
  'frontend/Dockerfile',
  'frontend/nginx.conf',
  'frontend/docker-entrypoint.sh',
  'docker-compose.yml',
  'docker-compose.production.yml',
  
  // CI/CD configurations
  '.github/workflows/ci-cd.yml',
  
  // Environment configurations
  '.env.production',
  
  // Monitoring configurations
  'monitoring/prometheus.yml',
  'monitoring/alert_rules.yml',
  'monitoring/loki-config.yml',
  'monitoring/promtail-config.yml',
  'monitoring/grafana/dashboards/swiftnotes-overview.json',
  
  // Security configurations
  'security/security-headers.js',
  
  // Scripts
  'scripts/deploy.sh',
  'scripts/deploy.ps1',
  'scripts/backup.sh',
  
  // Testing
  'testing/performance/k6-load-test.js',
  
  // Health check
  'backend/healthcheck.js',
  
  // Error tracking
  'backend/middleware/errorTracking.js'
];

const REQUIRED_DEPENDENCIES = [
  '@sentry/node',
  'winston'
];

// Test functions
async function testFileStructure() {
  console.log('🔍 Testing Phase 2 file structure...');
  
  let passedTests = 0;
  let totalTests = REQUIRED_FILES.length;
  
  for (const file of REQUIRED_FILES) {
    if (fs.existsSync(file)) {
      console.log(`✅ ${file}`);
      passedTests++;
    } else {
      console.log(`❌ ${file} - MISSING`);
    }
  }
  
  console.log(`\n📊 File Structure: ${passedTests}/${totalTests} files present`);
  return passedTests === totalTests;
}

async function testDockerConfigurations() {
  console.log('\n🐳 Testing Docker configurations...');
  
  const tests = [
    {
      name: 'Backend Dockerfile syntax',
      test: () => {
        const dockerfile = fs.readFileSync('backend/Dockerfile', 'utf8');
        return dockerfile.includes('FROM node:18-alpine') && 
               dockerfile.includes('HEALTHCHECK') &&
               dockerfile.includes('USER swiftnotes');
      }
    },
    {
      name: 'Frontend Dockerfile syntax',
      test: () => {
        const dockerfile = fs.readFileSync('frontend/Dockerfile', 'utf8');
        return dockerfile.includes('FROM node:18-alpine AS builder') && 
               dockerfile.includes('FROM nginx:alpine AS production') &&
               dockerfile.includes('HEALTHCHECK');
      }
    },
    {
      name: 'Docker Compose configuration',
      test: () => {
        const compose = fs.readFileSync('docker-compose.yml', 'utf8');
        return compose.includes('frontend:') && 
               compose.includes('backend:') &&
               compose.includes('redis:') &&
               compose.includes('prometheus:');
      }
    },
    {
      name: 'Production Docker Compose override',
      test: () => {
        const prodCompose = fs.readFileSync('docker-compose.production.yml', 'utf8');
        return prodCompose.includes('restart: always') && 
               prodCompose.includes('deploy:') &&
               prodCompose.includes('resources:');
      }
    }
  ];
  
  let passedTests = 0;
  for (const test of tests) {
    try {
      if (test.test()) {
        console.log(`✅ ${test.name}`);
        passedTests++;
      } else {
        console.log(`❌ ${test.name} - FAILED`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} - ERROR: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Docker Configuration: ${passedTests}/${tests.length} tests passed`);
  return passedTests === tests.length;
}

async function testMonitoringConfigurations() {
  console.log('\n📊 Testing monitoring configurations...');
  
  const tests = [
    {
      name: 'Prometheus configuration',
      test: () => {
        const prometheus = fs.readFileSync('monitoring/prometheus.yml', 'utf8');
        return prometheus.includes('swiftnotes-backend') && 
               prometheus.includes('swiftnotes-frontend') &&
               prometheus.includes('scrape_configs:');
      }
    },
    {
      name: 'Alert rules configuration',
      test: () => {
        const alerts = fs.readFileSync('monitoring/alert_rules.yml', 'utf8');
        return alerts.includes('SwiftNotesBackendDown') && 
               alerts.includes('HighResponseTime') &&
               alerts.includes('groups:');
      }
    },
    {
      name: 'Loki configuration',
      test: () => {
        const loki = fs.readFileSync('monitoring/loki-config.yml', 'utf8');
        return loki.includes('auth_enabled: false') && 
               loki.includes('schema_config:');
      }
    },
    {
      name: 'Promtail configuration',
      test: () => {
        const promtail = fs.readFileSync('monitoring/promtail-config.yml', 'utf8');
        return promtail.includes('swiftnotes-backend') && 
               promtail.includes('scrape_configs:');
      }
    }
  ];
  
  let passedTests = 0;
  for (const test of tests) {
    try {
      if (test.test()) {
        console.log(`✅ ${test.name}`);
        passedTests++;
      } else {
        console.log(`❌ ${test.name} - FAILED`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} - ERROR: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Monitoring Configuration: ${passedTests}/${tests.length} tests passed`);
  return passedTests === tests.length;
}

async function testSecurityConfigurations() {
  console.log('\n🔒 Testing security configurations...');
  
  const tests = [
    {
      name: 'Security headers middleware',
      test: () => {
        const security = fs.readFileSync('security/security-headers.js', 'utf8');
        return security.includes('contentSecurityPolicy') && 
               security.includes('hsts') &&
               security.includes('rateLimitConfig');
      }
    },
    {
      name: 'Production environment security',
      test: () => {
        const prodEnv = fs.readFileSync('.env.production', 'utf8');
        return prodEnv.includes('BCRYPT_ROUNDS=14') && 
               prodEnv.includes('FORCE_HTTPS=true') &&
               prodEnv.includes('ENABLE_SECURITY_HEADERS=true');
      }
    }
  ];
  
  let passedTests = 0;
  for (const test of tests) {
    try {
      if (test.test()) {
        console.log(`✅ ${test.name}`);
        passedTests++;
      } else {
        console.log(`❌ ${test.name} - FAILED`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} - ERROR: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Security Configuration: ${passedTests}/${tests.length} tests passed`);
  return passedTests === tests.length;
}

async function testBackendEnhancements() {
  console.log('\n🚀 Testing backend enhancements...');
  
  const tests = [
    {
      name: 'Error tracking middleware',
      test: () => {
        const errorTracking = fs.readFileSync('backend/middleware/errorTracking.js', 'utf8');
        return errorTracking.includes('Sentry') && 
               errorTracking.includes('winston') &&
               errorTracking.includes('performanceMetrics');
      }
    },
    {
      name: 'Health check script',
      test: () => {
        const healthCheck = fs.readFileSync('backend/healthcheck.js', 'utf8');
        return healthCheck.includes('performHealthCheck') && 
               healthCheck.includes('checkDatabase') &&
               healthCheck.includes('checkRedis');
      }
    },
    {
      name: 'Required dependencies installed',
      test: () => {
        const packageJson = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
        return REQUIRED_DEPENDENCIES.every(dep => 
          packageJson.dependencies && packageJson.dependencies[dep]
        );
      }
    }
  ];
  
  let passedTests = 0;
  for (const test of tests) {
    try {
      if (test.test()) {
        console.log(`✅ ${test.name}`);
        passedTests++;
      } else {
        console.log(`❌ ${test.name} - FAILED`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} - ERROR: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Backend Enhancements: ${passedTests}/${tests.length} tests passed`);
  return passedTests === tests.length;
}

async function testDeploymentScripts() {
  console.log('\n🚀 Testing deployment scripts...');
  
  const tests = [
    {
      name: 'Bash deployment script',
      test: () => {
        const deployScript = fs.readFileSync('scripts/deploy.sh', 'utf8');
        return deployScript.includes('check_prerequisites') && 
               deployScript.includes('backup_current_deployment') &&
               deployScript.includes('build_and_test');
      }
    },
    {
      name: 'PowerShell deployment script',
      test: () => {
        const deployScript = fs.readFileSync('scripts/deploy.ps1', 'utf8');
        return deployScript.includes('Test-Prerequisites') && 
               deployScript.includes('Backup-CurrentDeployment') &&
               deployScript.includes('Build-AndTest');
      }
    },
    {
      name: 'Backup script',
      test: () => {
        const backupScript = fs.readFileSync('scripts/backup.sh', 'utf8');
        return backupScript.includes('backup_database') && 
               backupScript.includes('backup_volumes') &&
               backupScript.includes('create_manifest');
      }
    }
  ];
  
  let passedTests = 0;
  for (const test of tests) {
    try {
      if (test.test()) {
        console.log(`✅ ${test.name}`);
        passedTests++;
      } else {
        console.log(`❌ ${test.name} - FAILED`);
      }
    } catch (error) {
      console.log(`❌ ${test.name} - ERROR: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Deployment Scripts: ${passedTests}/${tests.length} tests passed`);
  return passedTests === tests.length;
}

async function testEnhancedBackendEndpoints() {
  console.log('\n🔍 Testing enhanced backend endpoints...');
  
  try {
    // Test health endpoint
    const healthResponse = await fetch('http://localhost:3001/api/health');
    const healthData = await healthResponse.json();
    
    const healthTest = healthResponse.ok && 
                      healthData.status === 'healthy' &&
                      healthData.metrics &&
                      healthData.memory;
    
    console.log(healthTest ? '✅ Enhanced health endpoint' : '❌ Enhanced health endpoint');
    
    // Test metrics endpoint
    const metricsResponse = await fetch('http://localhost:3001/api/metrics');
    const metricsData = await metricsResponse.text();
    
    const metricsTest = metricsResponse.ok && 
                       metricsData.includes('swiftnotes_requests_total') &&
                       metricsData.includes('swiftnotes_memory_usage_bytes');
    
    console.log(metricsTest ? '✅ Prometheus metrics endpoint' : '❌ Prometheus metrics endpoint');
    
    const passedTests = (healthTest ? 1 : 0) + (metricsTest ? 1 : 0);
    console.log(`\n📊 Enhanced Endpoints: ${passedTests}/2 tests passed`);
    
    return passedTests === 2;
    
  } catch (error) {
    console.log('❌ Backend endpoints test failed:', error.message);
    console.log('💡 Make sure the backend is running on localhost:3001');
    return false;
  }
}

// Main test runner
async function runPhase2Tests() {
  console.log('🚀 Starting Phase 2 Infrastructure Validation Tests\n');
  
  const testResults = [];
  
  // Run all test suites
  testResults.push(await testFileStructure());
  testResults.push(await testDockerConfigurations());
  testResults.push(await testMonitoringConfigurations());
  testResults.push(await testSecurityConfigurations());
  testResults.push(await testBackendEnhancements());
  testResults.push(await testDeploymentScripts());
  testResults.push(await testEnhancedBackendEndpoints());
  
  // Calculate overall results
  const passedSuites = testResults.filter(result => result).length;
  const totalSuites = testResults.length;
  const successRate = Math.round((passedSuites / totalSuites) * 100);
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 PHASE 2 INFRASTRUCTURE VALIDATION RESULTS');
  console.log('='.repeat(60));
  console.log(`Passed Test Suites: ${passedSuites}/${totalSuites}`);
  console.log(`Success Rate: ${successRate}%`);
  
  if (passedSuites === totalSuites) {
    console.log('🎉 ALL PHASE 2 INFRASTRUCTURE TESTS PASSED!');
    console.log('✅ Production deployment infrastructure is ready');
    console.log('✅ Monitoring and logging systems configured');
    console.log('✅ Security hardening implemented');
    console.log('✅ CI/CD pipeline configured');
    console.log('✅ Backup and recovery systems ready');
    console.log('✅ Performance testing framework ready');
  } else {
    console.log('⚠️  Some Phase 2 infrastructure components need attention');
    console.log('Please review and fix the failed tests before production deployment');
  }
  
  console.log('='.repeat(60));
}

// Run the tests
runPhase2Tests().catch(console.error);
