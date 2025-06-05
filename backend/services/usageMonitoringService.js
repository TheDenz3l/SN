/**
 * Usage Monitoring Service for SwiftNotes
 * Tracks usage patterns, costs, and provides alerts
 */

const EventEmitter = require('events');

class UsageMonitoringService extends EventEmitter {
  constructor() {
    super();
    this.dailyCosts = new Map();
    this.userUsagePatterns = new Map();
    this.alertThresholds = {
      dailyCostLimit: 100, // $100 per day
      hourlyCostLimit: 20,  // $20 per hour
      userDailyLimit: 50,   // 50 generations per user per day
      suspiciousActivityThreshold: 100 // requests per minute
    };
  }

  // Track individual API call
  async trackAPICall(data) {
    const {
      userId,
      endpoint,
      cost = 0,
      success = true,
      duration,
      timestamp = new Date()
    } = data;

    try {
      // Update daily cost tracking
      await this.updateDailyCosts(cost, timestamp);
      
      // Update user usage patterns
      await this.updateUserUsage(userId, endpoint, success, timestamp);
      
      // Check for alerts
      await this.checkAlerts(userId, cost, timestamp);
      
      // Emit usage event for real-time monitoring
      this.emit('apiCall', data);
      
    } catch (error) {
      console.error('Error tracking API call:', error);
    }
  }

  // Update daily cost tracking
  async updateDailyCosts(cost, timestamp) {
    const dateKey = timestamp.toISOString().split('T')[0];
    const hourKey = `${dateKey}-${timestamp.getHours()}`;
    
    // Daily costs
    if (!this.dailyCosts.has(dateKey)) {
      this.dailyCosts.set(dateKey, { total: 0, hourly: new Map() });
    }
    
    const dayData = this.dailyCosts.get(dateKey);
    dayData.total += cost;
    
    // Hourly costs
    if (!dayData.hourly.has(hourKey)) {
      dayData.hourly.set(hourKey, 0);
    }
    dayData.hourly.set(hourKey, dayData.hourly.get(hourKey) + cost);
  }

  // Update user usage patterns
  async updateUserUsage(userId, endpoint, success, timestamp) {
    if (!userId) return;
    
    const dateKey = timestamp.toISOString().split('T')[0];
    const minuteKey = `${dateKey}-${timestamp.getHours()}-${timestamp.getMinutes()}`;
    
    if (!this.userUsagePatterns.has(userId)) {
      this.userUsagePatterns.set(userId, {
        daily: new Map(),
        minutely: new Map(),
        totalRequests: 0,
        successfulRequests: 0
      });
    }
    
    const userData = this.userUsagePatterns.get(userId);
    userData.totalRequests++;
    
    if (success) {
      userData.successfulRequests++;
    }
    
    // Daily tracking
    if (!userData.daily.has(dateKey)) {
      userData.daily.set(dateKey, { count: 0, endpoints: new Map() });
    }
    
    const dayData = userData.daily.get(dateKey);
    dayData.count++;
    
    if (!dayData.endpoints.has(endpoint)) {
      dayData.endpoints.set(endpoint, 0);
    }
    dayData.endpoints.set(endpoint, dayData.endpoints.get(endpoint) + 1);
    
    // Minutely tracking for suspicious activity detection
    if (!userData.minutely.has(minuteKey)) {
      userData.minutely.set(minuteKey, 0);
    }
    userData.minutely.set(minuteKey, userData.minutely.get(minuteKey) + 1);
  }

  // Check for various alert conditions
  async checkAlerts(userId, cost, timestamp) {
    const dateKey = timestamp.toISOString().split('T')[0];
    const hourKey = `${dateKey}-${timestamp.getHours()}`;
    const minuteKey = `${dateKey}-${timestamp.getHours()}-${timestamp.getMinutes()}`;
    
    // Check daily cost limit
    const dayData = this.dailyCosts.get(dateKey);
    if (dayData && dayData.total > this.alertThresholds.dailyCostLimit) {
      this.emit('alert', {
        type: 'DAILY_COST_EXCEEDED',
        message: `Daily cost limit exceeded: $${dayData.total.toFixed(2)}`,
        severity: 'HIGH',
        timestamp
      });
    }
    
    // Check hourly cost limit
    if (dayData && dayData.hourly.has(hourKey)) {
      const hourlyCost = dayData.hourly.get(hourKey);
      if (hourlyCost > this.alertThresholds.hourlyCostLimit) {
        this.emit('alert', {
          type: 'HOURLY_COST_EXCEEDED',
          message: `Hourly cost limit exceeded: $${hourlyCost.toFixed(2)}`,
          severity: 'MEDIUM',
          timestamp
        });
      }
    }
    
    // Check user daily limit
    if (userId) {
      const userData = this.userUsagePatterns.get(userId);
      if (userData && userData.daily.has(dateKey)) {
        const userDayData = userData.daily.get(dateKey);
        if (userDayData.count > this.alertThresholds.userDailyLimit) {
          this.emit('alert', {
            type: 'USER_DAILY_LIMIT_EXCEEDED',
            message: `User ${userId} exceeded daily limit: ${userDayData.count} requests`,
            severity: 'MEDIUM',
            userId,
            timestamp
          });
        }
      }
      
      // Check for suspicious activity
      if (userData && userData.minutely.has(minuteKey)) {
        const minuteCount = userData.minutely.get(minuteKey);
        if (minuteCount > this.alertThresholds.suspiciousActivityThreshold) {
          this.emit('alert', {
            type: 'SUSPICIOUS_ACTIVITY',
            message: `Suspicious activity detected for user ${userId}: ${minuteCount} requests per minute`,
            severity: 'HIGH',
            userId,
            timestamp
          });
        }
      }
    }
  }

  // Get usage statistics
  getUsageStats(timeframe = 'daily') {
    const now = new Date();
    const stats = {
      totalCosts: 0,
      totalRequests: 0,
      activeUsers: 0,
      averageResponseTime: 0,
      successRate: 0
    };
    
    if (timeframe === 'daily') {
      const dateKey = now.toISOString().split('T')[0];
      const dayData = this.dailyCosts.get(dateKey);
      
      if (dayData) {
        stats.totalCosts = dayData.total;
      }
      
      // Calculate user stats for today
      let totalRequests = 0;
      let successfulRequests = 0;
      let activeUsers = 0;
      
      for (const [userId, userData] of this.userUsagePatterns) {
        if (userData.daily.has(dateKey)) {
          activeUsers++;
          const userDayData = userData.daily.get(dateKey);
          totalRequests += userDayData.count;
          // Approximate successful requests based on overall success rate
          successfulRequests += userDayData.count * (userData.successfulRequests / userData.totalRequests);
        }
      }
      
      stats.totalRequests = totalRequests;
      stats.activeUsers = activeUsers;
      stats.successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
    }
    
    return stats;
  }

  // Get user-specific usage data
  getUserUsage(userId, days = 7) {
    const userData = this.userUsagePatterns.get(userId);
    if (!userData) {
      return null;
    }
    
    const usage = {
      totalRequests: userData.totalRequests,
      successRate: (userData.successfulRequests / userData.totalRequests) * 100,
      dailyBreakdown: [],
      topEndpoints: []
    };
    
    // Get last N days of data
    const now = new Date();
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      
      if (userData.daily.has(dateKey)) {
        const dayData = userData.daily.get(dateKey);
        usage.dailyBreakdown.push({
          date: dateKey,
          requests: dayData.count,
          endpoints: Object.fromEntries(dayData.endpoints)
        });
      } else {
        usage.dailyBreakdown.push({
          date: dateKey,
          requests: 0,
          endpoints: {}
        });
      }
    }
    
    return usage;
  }

  // Clean up old data (call this periodically)
  cleanup(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffKey = cutoffDate.toISOString().split('T')[0];
    
    // Clean up daily costs
    for (const [dateKey] of this.dailyCosts) {
      if (dateKey < cutoffKey) {
        this.dailyCosts.delete(dateKey);
      }
    }
    
    // Clean up user usage patterns
    for (const [userId, userData] of this.userUsagePatterns) {
      for (const [dateKey] of userData.daily) {
        if (dateKey < cutoffKey) {
          userData.daily.delete(dateKey);
        }
      }
      
      // Clean up minutely data older than 1 day
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);
      const oneDayAgoKey = `${oneDayAgo.toISOString().split('T')[0]}-${oneDayAgo.getHours()}-${oneDayAgo.getMinutes()}`;
      
      for (const [minuteKey] of userData.minutely) {
        if (minuteKey < oneDayAgoKey) {
          userData.minutely.delete(minuteKey);
        }
      }
    }
  }

  // Update alert thresholds
  updateAlertThresholds(newThresholds) {
    this.alertThresholds = { ...this.alertThresholds, ...newThresholds };
  }
}

// Create singleton instance
const usageMonitoringService = new UsageMonitoringService();

// Set up alert handlers
usageMonitoringService.on('alert', (alert) => {
  console.warn(`🚨 USAGE ALERT [${alert.severity}]: ${alert.message}`);
  
  // TODO: Implement alert notifications (email, Slack, etc.)
  // if (alert.severity === 'HIGH') {
  //   notificationService.sendAlert(alert);
  // }
});

// Set up periodic cleanup (run daily)
setInterval(() => {
  usageMonitoringService.cleanup();
}, 24 * 60 * 60 * 1000); // 24 hours

module.exports = usageMonitoringService;
