/**
 * SwiftNotes K6 Load Testing Script
 * Comprehensive performance testing for production readiness
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');
const authSuccessRate = new Rate('auth_success_rate');
const aiGenerationTime = new Trend('ai_generation_time');
const requestCounter = new Counter('total_requests');

// Test configuration
export const options = {
  stages: [
    // Ramp-up
    { duration: '2m', target: 10 }, // Ramp up to 10 users over 2 minutes
    { duration: '5m', target: 10 }, // Stay at 10 users for 5 minutes
    { duration: '2m', target: 20 }, // Ramp up to 20 users over 2 minutes
    { duration: '5m', target: 20 }, // Stay at 20 users for 5 minutes
    { duration: '2m', target: 50 }, // Ramp up to 50 users over 2 minutes
    { duration: '5m', target: 50 }, // Stay at 50 users for 5 minutes
    { duration: '2m', target: 0 },  // Ramp down to 0 users over 2 minutes
  ],
  thresholds: {
    // Performance thresholds
    http_req_duration: ['p(95)<2000'], // 95% of requests should be below 2s
    http_req_failed: ['rate<0.05'],    // Error rate should be below 5%
    error_rate: ['rate<0.05'],         // Custom error rate should be below 5%
    auth_success_rate: ['rate>0.95'],  // Auth success rate should be above 95%
    ai_generation_time: ['p(95)<30000'], // 95% of AI generations should be below 30s
  },
};

// Test data
const testUsers = [
  { email: 'loadtest1@swiftnotes.app', password: 'LoadTest123!' },
  { email: 'loadtest2@swiftnotes.app', password: 'LoadTest123!' },
  { email: 'loadtest3@swiftnotes.app', password: 'LoadTest123!' },
  { email: 'loadtest4@swiftnotes.app', password: 'LoadTest123!' },
  { email: 'loadtest5@swiftnotes.app', password: 'LoadTest123!' },
];

const testNoteData = {
  title: 'Load Test Progress Note',
  sections: [
    {
      prompt: 'Client demonstrated significant progress in communication goals during today\'s session.',
      type: 'comment'
    },
    {
      prompt: 'The participant successfully completed verbal requests and showed improved social interaction.',
      type: 'comment'
    }
  ]
};

// Base URL configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const API_URL = `${BASE_URL}/api`;

// Helper functions
function getRandomUser() {
  return testUsers[Math.floor(Math.random() * testUsers.length)];
}

function authenticateUser() {
  const user = getRandomUser();
  
  const loginResponse = http.post(`${API_URL}/auth/login`, JSON.stringify({
    email: user.email,
    password: user.password
  }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  requestCounter.add(1);
  
  const loginSuccess = check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'login response has token': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success && body.session && body.session.access_token;
      } catch (e) {
        return false;
      }
    },
  });

  authSuccessRate.add(loginSuccess);
  errorRate.add(!loginSuccess);

  if (loginSuccess) {
    const body = JSON.parse(loginResponse.body);
    return body.session.access_token;
  }
  
  return null;
}

function testHealthCheck() {
  const response = http.get(`${API_URL}/health`);
  requestCounter.add(1);
  
  const success = check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  responseTime.add(response.timings.duration);
  errorRate.add(!success);
}

function testUserProfile(token) {
  const response = http.get(`${API_URL}/user/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  requestCounter.add(1);
  
  const success = check(response, {
    'profile status is 200': (r) => r.status === 200,
    'profile response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  responseTime.add(response.timings.duration);
  errorRate.add(!success);
}

function testISPTasks(token) {
  const response = http.get(`${API_URL}/isp-tasks`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  requestCounter.add(1);
  
  const success = check(response, {
    'ISP tasks status is 200': (r) => r.status === 200,
    'ISP tasks response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  responseTime.add(response.timings.duration);
  errorRate.add(!success);
  
  return success ? JSON.parse(response.body) : null;
}

function testAIGeneration(token) {
  const startTime = Date.now();
  
  const response = http.post(`${API_URL}/ai/generate`, JSON.stringify(testNoteData), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    timeout: '60s', // AI generation can take longer
  });

  requestCounter.add(1);
  const duration = Date.now() - startTime;
  
  const success = check(response, {
    'AI generation status is 200': (r) => r.status === 200,
    'AI generation response time < 45000ms': (r) => r.timings.duration < 45000,
    'AI generation has content': (r) => {
      try {
        const body = JSON.parse(r.body);
        return body.success && body.note && body.note.content;
      } catch (e) {
        return false;
      }
    },
  });

  aiGenerationTime.add(duration);
  responseTime.add(response.timings.duration);
  errorRate.add(!success);
}

function testMetricsEndpoint() {
  const response = http.get(`${API_URL}/metrics`);
  requestCounter.add(1);
  
  const success = check(response, {
    'metrics status is 200': (r) => r.status === 200,
    'metrics response time < 1000ms': (r) => r.timings.duration < 1000,
    'metrics has prometheus format': (r) => r.body.includes('swiftnotes_'),
  });

  responseTime.add(response.timings.duration);
  errorRate.add(!success);
}

// Main test function
export default function() {
  // Test health check (no auth required)
  testHealthCheck();
  
  // Test metrics endpoint (no auth required)
  if (Math.random() < 0.1) { // 10% chance to test metrics
    testMetricsEndpoint();
  }
  
  // Authenticate user
  const token = authenticateUser();
  
  if (token) {
    // Test authenticated endpoints
    testUserProfile(token);
    
    const ispTasksData = testISPTasks(token);
    
    // Test AI generation (less frequently due to cost and time)
    if (Math.random() < 0.2) { // 20% chance to test AI generation
      testAIGeneration(token);
    }
  }
  
  // Random sleep between 1-3 seconds to simulate real user behavior
  sleep(Math.random() * 2 + 1);
}

// Setup function (runs once at the beginning)
export function setup() {
  console.log('Starting SwiftNotes load test...');
  console.log(`Target URL: ${BASE_URL}`);
  console.log(`Test users: ${testUsers.length}`);
  
  // Verify the application is running
  const healthResponse = http.get(`${API_URL}/health`);
  if (healthResponse.status !== 200) {
    throw new Error(`Application health check failed: ${healthResponse.status}`);
  }
  
  console.log('Application health check passed');
  return { baseUrl: BASE_URL };
}

// Teardown function (runs once at the end)
export function teardown(data) {
  console.log('Load test completed');
  console.log(`Base URL: ${data.baseUrl}`);
}

// Handle different test scenarios
export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
    stdout: `
    ========================================
    SwiftNotes Load Test Results Summary
    ========================================
    
    Total Requests: ${data.metrics.total_requests.values.count}
    Failed Requests: ${data.metrics.http_req_failed.values.rate * 100}%
    Average Response Time: ${data.metrics.http_req_duration.values.avg}ms
    95th Percentile Response Time: ${data.metrics.http_req_duration.values['p(95)']}ms
    
    Auth Success Rate: ${data.metrics.auth_success_rate ? (data.metrics.auth_success_rate.values.rate * 100) : 'N/A'}%
    AI Generation 95th Percentile: ${data.metrics.ai_generation_time ? data.metrics.ai_generation_time.values['p(95)'] : 'N/A'}ms
    
    Test Duration: ${data.state.testRunDurationMs}ms
    Virtual Users: ${data.options.stages ? data.options.stages.map(s => s.target).join(' -> ') : 'N/A'}
    
    ========================================
    `,
  };
}
