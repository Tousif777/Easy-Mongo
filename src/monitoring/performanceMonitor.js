class PerformanceMonitor {
    constructor() {
        this.reset();
    }

    reset() {
        this.stats = {
            operations: {},
            totalQueries: 0,
            totalQueryTime: 0,
            averageQueryTime: 0,
            errors: 0,
            startTime: Date.now()
        };
    }

    trackOperation(type, duration) {
        if (!this.stats.operations[type]) {
            this.stats.operations[type] = {
                count: 0,
                totalTime: 0,
                averageTime: 0
            };
        }

        const op = this.stats.operations[type];
        op.count++;
        op.totalTime += duration;
        op.averageTime = op.totalTime / op.count;
    }

    trackQuery(duration) {
        this.stats.totalQueries++;
        this.stats.totalQueryTime += duration;
        this.stats.averageQueryTime = this.stats.totalQueryTime / this.stats.totalQueries;
    }

    trackError(error) {
        this.stats.errors++;
        // You could add more error tracking here if needed
    }

    getStats() {
        return {
            ...this.stats,
            uptime: Date.now() - this.stats.startTime
        };
    }
}

module.exports = PerformanceMonitor; 