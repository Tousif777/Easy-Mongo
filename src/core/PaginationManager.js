class PaginationManager {
    constructor(model, options = {}) {
        this.model = model;
        this.defaultOptions = {
            page: 1,
            limit: 10,
            sort: { _id: -1 },
            lean: true,
            ...options
        };
    }

    async paginate(query = {}, options = {}) {
        const paginateOptions = { ...this.defaultOptions, ...options };
        const { page, limit, sort, lean, select, populate } = paginateOptions;

        const skip = (page - 1) * limit;
        
        try {
            // Build the base query
            let queryBuilder = this.model.find(query);

            // Apply sorting
            if (sort) {
                queryBuilder = queryBuilder.sort(sort);
            }

            // Apply field selection
            if (select) {
                queryBuilder = queryBuilder.select(select);
            }

            // Apply population
            if (populate) {
                if (Array.isArray(populate)) {
                    populate.forEach(field => {
                        queryBuilder = queryBuilder.populate(field);
                    });
                } else {
                    queryBuilder = queryBuilder.populate(populate);
                }
            }

            // Execute queries in parallel
            const [results, total] = await Promise.all([
                queryBuilder
                    .skip(skip)
                    .limit(limit)
                    .lean(lean)
                    .exec(),
                this.model.countDocuments(query)
            ]);

            // Calculate pagination metadata
            const totalPages = Math.ceil(total / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;

            return {
                docs: results,
                total,
                limit,
                page,
                totalPages,
                hasNextPage,
                hasPrevPage,
                nextPage: hasNextPage ? page + 1 : null,
                prevPage: hasPrevPage ? page - 1 : null,
                pagingCounter: (page - 1) * limit + 1
            };
        } catch (error) {
            throw new Error(`Pagination failed: ${error.message}`);
        }
    }

    async paginateAggregate(pipeline = [], options = {}) {
        const paginateOptions = { ...this.defaultOptions, ...options };
        const { page, limit } = paginateOptions;
        const skip = (page - 1) * limit;

        try {
            // Add pagination stages to the pipeline
            const countPipeline = [...pipeline, { $count: 'total' }];
            const dataPipeline = [
                ...pipeline,
                { $skip: skip },
                { $limit: limit }
            ];

            // Execute queries in parallel
            const [countResult, results] = await Promise.all([
                this.model.aggregate(countPipeline),
                this.model.aggregate(dataPipeline)
            ]);

            const total = countResult[0]?.total || 0;
            const totalPages = Math.ceil(total / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;

            return {
                docs: results,
                total,
                limit,
                page,
                totalPages,
                hasNextPage,
                hasPrevPage,
                nextPage: hasNextPage ? page + 1 : null,
                prevPage: hasPrevPage ? page - 1 : null,
                pagingCounter: (page - 1) * limit + 1
            };
        } catch (error) {
            throw new Error(`Aggregate pagination failed: ${error.message}`);
        }
    }
}

module.exports = PaginationManager; 