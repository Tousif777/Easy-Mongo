class PerformanceMonitor {
    constructor() {
        this.metrics = {
            operations: {
                read: { count: 0, totalTime: 0 },
                write: { count: 0, totalTime: 0 },
                delete: { count: 0, totalTime: 0 },
                update: { count: 0, totalTime: 0 }
            },
            queryTimes: [],
            lastReset: Date.now(),
            errors: {
                count: 0,
                lastError: null
            }
        };
    }

    trackOperation(type, duration) {
        if (this.metrics.operations[type]) {
            this.metrics.operations[type].count++;
            this.metrics.operations[type].totalTime += duration;
        }
    }

    trackQuery(duration) {
        this.metrics.queryTimes.push({
            timestamp: Date.now(),
            duration
        });

        // Keep only last 100 queries
        if (this.metrics.queryTimes.length > 100) {
            this.metrics.queryTimes.shift();
        }
    }

    trackError(error) {
        this.metrics.errors.count++;
        this.metrics.errors.lastError = {
            message: error.message,
            timestamp: Date.now()
        };
    }

    getStats() {
        const stats = {
            uptime: Date.now() - this.metrics.lastReset,
            operations: {},
            averageQueryTime: 0,
            errorRate: 0
        };

        // Calculate averages for operations
        for (const [type, data] of Object.entries(this.metrics.operations)) {
            stats.operations[type] = {
                count: data.count,
                averageTime: data.count > 0 ? data.totalTime / data.count : 0
            };
        }

        // Calculate average query time
        if (this.metrics.queryTimes.length > 0) {
            const totalTime = this.metrics.queryTimes.reduce((sum, query) => sum + query.duration, 0);
            stats.averageQueryTime = totalTime / this.metrics.queryTimes.length;
        }

        // Calculate error rate (errors per minute)
        const minutesElapsed = (Date.now() - this.metrics.lastReset) / (1000 * 60);
        stats.errorRate = minutesElapsed > 0 ? this.metrics.errors.count / minutesElapsed : 0;

        return stats;
    }

    reset() {
        this.metrics = {
            operations: {
                read: { count: 0, totalTime: 0 },
                write: { count: 0, totalTime: 0 },
                delete: { count: 0, totalTime: 0 },
                update: { count: 0, totalTime: 0 }
            },
            queryTimes: [],
            lastReset: Date.now(),
            errors: {
                count: 0,
                lastError: null
            }
        };
    }
}

module.exports = PerformanceMonitor; 