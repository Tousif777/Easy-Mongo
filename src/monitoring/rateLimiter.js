class RateLimiter {
  constructor(maxRequests = 1000, timeWindow = 60000) {
    this.requests = new Map();
    this.maxRequests = maxRequests;
    this.timeWindow = timeWindow;
  }

  async checkLimit(key) {
    const now = Date.now();
    const windowStart = now - this.timeWindow;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, [now]);
      return true;
    }

    const requests = this.requests.get(key).filter(time => time > windowStart);
    if (requests.length >= this.maxRequests) {
      return false;
    }

    requests.push(now);
    this.requests.set(key, requests);
    return true;
  }
}

module.exports = {
  rateLimiter: new RateLimiter()
}; 