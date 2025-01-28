const { cacheRead, clearCache } = require('../utils/cache');

class CacheManager {
  constructor(modelName, options = {}) {
    this.modelName = modelName;
    this.cache = new Map();
    this.enabled = options.enableCache || false;
    this.ttl = options.cacheTTL || 3600; // Default 1 hour
  }

  isEnabled() {
    return this.enabled;
  }

  async read(key, fetchFunction) {
    if (!this.enabled) {
      return fetchFunction();
    }

    const cacheKey = `${this.modelName}:${key}`;
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }

    const data = await fetchFunction();
    this.cache.set(cacheKey, {
      data,
      expiry: Date.now() + (this.ttl * 1000)
    });

    return data;
  }

  async clear(key) {
    if (!this.enabled) return;

    if (key) {
      const cacheKey = `${this.modelName}:${key}`;
      this.cache.delete(cacheKey);
    } else {
      this.cache.clear();
    }
  }
}

module.exports = CacheManager; 