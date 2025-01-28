const { cacheRead, clearCache } = require('../utils/cache');

class CacheManager {
  constructor(modelName, options = {}) {
    this.modelName = modelName;
    this.enabled = options.enableCache || false;
    this.ttl = options.cacheTTL || 3600;
  }

  async read(key, callback) {
    if (!this.enabled) {
      return callback();
    }

    const cacheKey = this._buildKey(key);
    return cacheRead(cacheKey, callback, this.ttl);
  }

  async clear(key) {
    if (!this.enabled) return;
    
    if (key) {
      await clearCache(this._buildKey(key));
    } else {
      await clearCache();
    }
  }

  _buildKey(key) {
    return `${this.modelName}:${key}`;
  }

  isEnabled() {
    return this.enabled;
  }
}

module.exports = CacheManager; 