class PaginationManager {
    constructor(model, options = {}) {
        this.Model = model;
        this.defaultOptions = {
            page: 1,
            limit: 10,
            sort: { createdAt: -1 },
            lean: true,
            ...options
        };
    }

    async paginate(query = {}, options = {}) {
        const { page = this.defaultOptions.page, limit = this.defaultOptions.limit, sort = this.defaultOptions.sort } = options;
        
        try {
            const skip = (page - 1) * limit;
            const [data, total] = await Promise.all([
                this.Model.find(query)
                    .sort(sort)
                    .skip(skip)
                    .limit(limit),
                this.Model.countDocuments(query)
            ]);

            return {
                data,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit),
                    hasNextPage: page * limit < total,
                    hasPrevPage: page > 1
                }
            };
        } catch (error) {
            console.error('Pagination failed:', error);
            throw error;
        }
    }

    async paginateAggregate(pipeline = [], options = {}) {
        const { page = this.defaultOptions.page, limit = this.defaultOptions.limit } = options;
        
        try {
            const skip = (page - 1) * limit;

            // Add pagination stages to the pipeline
            const paginatedPipeline = [
                ...pipeline,
                { $skip: skip },
                { $limit: limit }
            ];

            // Get total count using the original pipeline
            const countPipeline = [
                ...pipeline,
                { $count: 'total' }
            ];

            const [data, countResult] = await Promise.all([
                this.Model.aggregate(paginatedPipeline),
                this.Model.aggregate(countPipeline)
            ]);

            const total = countResult[0]?.total || 0;

            return {
                data,
                pagination: {
                    total,
                    page,
                    limit,
                    pages: Math.ceil(total / limit),
                    hasNextPage: page * limit < total,
                    hasPrevPage: page > 1
                }
            };
        } catch (error) {
            console.error('Aggregate pagination failed:', error);
            throw error;
        }
    }
}

module.exports = PaginationManager; 