class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }

  start(operation) {
    const startTime = process.hrtime();
    return () => {
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const duration = seconds * 1000 + nanoseconds / 1e6;
      
      if (!this.metrics.has(operation)) {
        this.metrics.set(operation, { count: 0, totalTime: 0, avgTime: 0 });
      }
      
      const metric = this.metrics.get(operation);
      metric.count++;
      metric.totalTime += duration;
      metric.avgTime = metric.totalTime / metric.count;
    };
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }
}

module.exports = {
  performanceMonitor: new PerformanceMonitor()
}; 