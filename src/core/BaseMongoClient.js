const PerformanceMonitor = require('../monitoring/performanceMonitor');
const { rateLimiter } = require('../monitoring/rateLimiter');

class BaseMongoClient {
  constructor(model, options = {}) {
    if (!model) {
      throw new Error('Model is required');
    }
    
    this.Model = model;
    this.options = this._initializeOptions(options);
    this._setupFeatures();
  }

  _initializeOptions(options) {
    return {
      enableCache: options.enableCache || false,
      cacheTTL: options.cacheTTL || 3600,
      enableRateLimit: options.enableRateLimit || false,
      rateLimit: options.rateLimit || { windowMs: 15 * 60 * 1000, max: 100 },
      enablePerformanceMonitoring: options.enablePerformanceMonitoring || false
    };
  }

  _setupFeatures() {
    if (this.options.enableRateLimit) {
      this.limiter = rateLimiter(this.options.rateLimit);
    }
    if (this.options.enablePerformanceMonitoring) {
      this.performanceMonitor = new PerformanceMonitor();
    }
  }

  startMonitoring(operationType) {
    if (!this.options.enablePerformanceMonitoring) return { end: () => {} };
    
    const startTime = Date.now();
    return {
      end: () => {
        const duration = Date.now() - startTime;
        this.performanceMonitor.trackOperation(operationType, duration);
        this.performanceMonitor.trackQuery(duration);
      }
    };
  }

  getPerformanceStats() {
    if (!this.options.enablePerformanceMonitoring) {
      throw new Error('Performance monitoring is not enabled');
    }
    return this.performanceMonitor.getStats();
  }

  async _executeWithMonitoring(operationType, callback) {
    const monitor = this.startMonitoring(operationType);
    try {
      const result = await callback();
      return result;
    } catch (error) {
      if (this.options.enablePerformanceMonitoring) {
        this.performanceMonitor.trackError(error);
      }
      throw error;
    } finally {
      monitor.end();
    }
  }

  _validateModel() {
    if (!this.Model) {
      throw new Error('Model not initialized');
    }
  }

  _validateData(data) {
    if (!data) {
      throw new Error('Data is required');
    }
  }

  _validateId(id) {
    if (!id) {
      throw new Error('ID is required');
    }
  }
}

module.exports = BaseMongoClient; 