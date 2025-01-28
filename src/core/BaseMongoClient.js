const { performanceMonitor } = require('../monitoring/performance');
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
  }

  startMonitoring(operationName) {
    if (!this.options.enablePerformanceMonitoring) return () => {};
    return performanceMonitor.start(operationName);
  }

  getPerformanceStats() {
    if (!this.options.enablePerformanceMonitoring) return {};
    return performanceMonitor.getStats();
  }

  async _executeWithMonitoring(operationName, callback) {
    const end = this.startMonitoring(operationName);
    try {
      const result = await callback();
      return result;
    } finally {
      end();
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