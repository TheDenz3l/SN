/**
 * Smart Queue Service for SwiftNotes
 * Handles AI generation requests with intelligent queuing and priority management
 */

const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class SmartQueueService extends EventEmitter {
  constructor() {
    super();
    this.queues = {
      high: [],     // Premium users, urgent requests
      normal: [],   // Paid users
      low: []       // Free users
    };
    
    this.processing = new Map(); // Currently processing requests
    this.completed = new Map();  // Completed requests (temporary storage)
    this.failed = new Map();     // Failed requests for retry
    
    this.config = {
      maxConcurrent: 10,           // Max concurrent AI API calls
      maxQueueSize: 1000,          // Max total queue size
      requestTimeout: 60000,       // 60 seconds timeout
      retryAttempts: 3,            // Max retry attempts
      retryDelay: 2000,            // Initial retry delay (ms)
      cleanupInterval: 300000,     // 5 minutes cleanup interval
    };
    
    this.stats = {
      totalProcessed: 0,
      totalFailed: 0,
      averageProcessingTime: 0,
      currentLoad: 0
    };
    
    // Start processing loop
    this.startProcessing();
    
    // Start cleanup loop
    this.startCleanup();
  }

  // Add request to queue
  async addRequest(request) {
    const {
      userId,
      userTier = 'free',
      type = 'task',
      priority = 'normal',
      data,
      timeout = this.config.requestTimeout
    } = request;

    // Check queue capacity
    const totalQueueSize = this.getTotalQueueSize();
    if (totalQueueSize >= this.config.maxQueueSize) {
      throw new Error('Queue is full. Please try again later.');
    }

    // Create queue item
    const queueItem = {
      id: uuidv4(),
      userId,
      userTier,
      type,
      priority,
      data,
      timeout,
      createdAt: new Date(),
      attempts: 0,
      status: 'queued'
    };

    // Determine queue based on user tier and priority
    const queueName = this.determineQueue(userTier, priority);
    this.queues[queueName].push(queueItem);

    // Emit queue event
    this.emit('requestQueued', {
      requestId: queueItem.id,
      queueName,
      position: this.queues[queueName].length,
      estimatedWaitTime: this.estimateWaitTime(queueName)
    });

    return {
      requestId: queueItem.id,
      queuePosition: this.queues[queueName].length,
      estimatedWaitTime: this.estimateWaitTime(queueName)
    };
  }

  // Determine which queue to use
  determineQueue(userTier, priority) {
    if (userTier === 'premium' || priority === 'urgent') {
      return 'high';
    } else if (userTier === 'paid' || priority === 'high') {
      return 'normal';
    } else {
      return 'low';
    }
  }

  // Get next request from queues (priority order)
  getNextRequest() {
    // Check high priority queue first
    if (this.queues.high.length > 0) {
      return this.queues.high.shift();
    }
    
    // Then normal priority
    if (this.queues.normal.length > 0) {
      return this.queues.normal.shift();
    }
    
    // Finally low priority
    if (this.queues.low.length > 0) {
      return this.queues.low.shift();
    }
    
    return null;
  }

  // Start processing loop
  startProcessing() {
    setInterval(async () => {
      await this.processQueue();
    }, 100); // Check every 100ms
  }

  // Process queue
  async processQueue() {
    // Check if we can process more requests
    if (this.processing.size >= this.config.maxConcurrent) {
      return;
    }

    // Get next request
    const request = this.getNextRequest();
    if (!request) {
      return;
    }

    // Start processing
    this.processing.set(request.id, request);
    request.status = 'processing';
    request.startedAt = new Date();

    this.emit('requestStarted', {
      requestId: request.id,
      userId: request.userId,
      type: request.type
    });

    try {
      // Process the request
      const result = await this.processRequest(request);
      
      // Mark as completed
      request.status = 'completed';
      request.completedAt = new Date();
      request.result = result;
      
      this.processing.delete(request.id);
      this.completed.set(request.id, request);
      
      // Update stats
      this.updateStats(request, true);
      
      this.emit('requestCompleted', {
        requestId: request.id,
        userId: request.userId,
        result,
        processingTime: request.completedAt - request.startedAt
      });
      
    } catch (error) {
      // Handle failure
      await this.handleFailure(request, error);
    }
  }

  // Process individual request
  async processRequest(request) {
    // This would integrate with your AI service
    // For now, simulate processing
    const processingTime = Math.random() * 5000 + 1000; // 1-6 seconds
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, request.timeout);
      
      setTimeout(() => {
        clearTimeout(timeout);
        
        // Simulate occasional failures
        if (Math.random() < 0.05) { // 5% failure rate
          reject(new Error('AI service temporarily unavailable'));
        } else {
          resolve({
            generatedText: `Generated content for ${request.type}`,
            tokensUsed: Math.floor(Math.random() * 1000) + 100,
            processingTime
          });
        }
      }, processingTime);
    });
  }

  // Handle request failure
  async handleFailure(request, error) {
    request.attempts++;
    request.lastError = error.message;
    
    this.processing.delete(request.id);
    
    // Check if we should retry
    if (request.attempts < this.config.retryAttempts) {
      // Calculate retry delay with exponential backoff
      const delay = this.config.retryDelay * Math.pow(2, request.attempts - 1);
      
      setTimeout(() => {
        // Add back to appropriate queue for retry
        const queueName = this.determineQueue(request.userTier, request.priority);
        this.queues[queueName].unshift(request); // Add to front for retry
      }, delay);
      
      this.emit('requestRetry', {
        requestId: request.id,
        attempt: request.attempts,
        delay,
        error: error.message
      });
      
    } else {
      // Max retries reached, mark as failed
      request.status = 'failed';
      request.failedAt = new Date();
      
      this.failed.set(request.id, request);
      this.updateStats(request, false);
      
      this.emit('requestFailed', {
        requestId: request.id,
        userId: request.userId,
        error: error.message,
        attempts: request.attempts
      });
    }
  }

  // Get request status
  getRequestStatus(requestId) {
    // Check if processing
    if (this.processing.has(requestId)) {
      const request = this.processing.get(requestId);
      return {
        status: 'processing',
        startedAt: request.startedAt,
        estimatedCompletion: new Date(request.startedAt.getTime() + this.stats.averageProcessingTime)
      };
    }
    
    // Check if completed
    if (this.completed.has(requestId)) {
      const request = this.completed.get(requestId);
      return {
        status: 'completed',
        result: request.result,
        completedAt: request.completedAt,
        processingTime: request.completedAt - request.startedAt
      };
    }
    
    // Check if failed
    if (this.failed.has(requestId)) {
      const request = this.failed.get(requestId);
      return {
        status: 'failed',
        error: request.lastError,
        attempts: request.attempts,
        failedAt: request.failedAt
      };
    }
    
    // Check if still in queue
    for (const [queueName, queue] of Object.entries(this.queues)) {
      const position = queue.findIndex(item => item.id === requestId);
      if (position !== -1) {
        return {
          status: 'queued',
          queueName,
          position: position + 1,
          estimatedWaitTime: this.estimateWaitTime(queueName, position)
        };
      }
    }
    
    return { status: 'not_found' };
  }

  // Estimate wait time
  estimateWaitTime(queueName, position = null) {
    const queuePosition = position !== null ? position : this.queues[queueName].length;
    const avgProcessingTime = this.stats.averageProcessingTime || 3000; // Default 3 seconds
    const concurrentSlots = this.config.maxConcurrent;
    
    // Simple estimation: (position / concurrent slots) * average processing time
    return Math.ceil((queuePosition / concurrentSlots) * avgProcessingTime);
  }

  // Get total queue size
  getTotalQueueSize() {
    return this.queues.high.length + this.queues.normal.length + this.queues.low.length;
  }

  // Get queue statistics
  getQueueStats() {
    return {
      queues: {
        high: this.queues.high.length,
        normal: this.queues.normal.length,
        low: this.queues.low.length,
        total: this.getTotalQueueSize()
      },
      processing: this.processing.size,
      completed: this.completed.size,
      failed: this.failed.size,
      stats: this.stats,
      currentLoad: (this.processing.size / this.config.maxConcurrent) * 100
    };
  }

  // Update statistics
  updateStats(request, success) {
    this.stats.totalProcessed++;
    
    if (success) {
      const processingTime = request.completedAt - request.startedAt;
      this.stats.averageProcessingTime = 
        (this.stats.averageProcessingTime * (this.stats.totalProcessed - 1) + processingTime) / this.stats.totalProcessed;
    } else {
      this.stats.totalFailed++;
    }
    
    this.stats.currentLoad = (this.processing.size / this.config.maxConcurrent) * 100;
  }

  // Start cleanup process
  startCleanup() {
    setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  // Clean up old completed and failed requests
  cleanup() {
    const cutoffTime = new Date(Date.now() - this.config.cleanupInterval * 2); // Keep for 2 cleanup intervals
    
    // Clean completed requests
    for (const [id, request] of this.completed) {
      if (request.completedAt < cutoffTime) {
        this.completed.delete(id);
      }
    }
    
    // Clean failed requests
    for (const [id, request] of this.failed) {
      if (request.failedAt < cutoffTime) {
        this.failed.delete(id);
      }
    }
  }

  // Update configuration
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }
}

// Create singleton instance
const smartQueueService = new SmartQueueService();

module.exports = smartQueueService;
