class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes by default
    this.max = options.max || 100; // 100 requests per windowMs by default
    this.requests = new Map();
  }

  check() {
    const now = Date.now();
    this.cleanup(now);

    const clientRequests = this.requests.get('client') || [];
    if (clientRequests.length >= this.max) {
      throw new Error('Rate limit exceeded');
    }

    clientRequests.push(now);
    this.requests.set('client', clientRequests);
    return true;
  }

  cleanup(now) {
    const windowStart = now - this.windowMs;
    for (const [client, timestamps] of this.requests.entries()) {
      const validTimestamps = timestamps.filter(timestamp => timestamp > windowStart);
      if (validTimestamps.length === 0) {
        this.requests.delete(client);
      } else {
        this.requests.set(client, validTimestamps);
      }
    }
  }
}

const createRateLimiter = (options) => {
  const limiter = new RateLimiter(options);
  return () => limiter.check();
};

module.exports = {
  rateLimiter: createRateLimiter
}; 