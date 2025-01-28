const { connectDB } = require('./core/connection');
const { MongoError, errorHandler } = require('./core/errors');
const crud = require('./operations/crud');
const bulk = require('./operations/bulk');
const aggregation = require('./operations/aggregation');
const { QueryBuilder } = require('./builders/queryBuilder');
const { performanceMonitor } = require('./monitoring/performance');
const { cacheRead, clearCache } = require('./utils/cache');

// Wrap operations with error handling and monitoring
const wrapOperation = (operation) => {
  return errorHandler(async (...args) => {
    const end = performanceMonitor.start(operation.name);
    const result = await operation(...args);
    end();
    return result;
  });
};

module.exports = {
  connectDB,
  MongoError,
  ...crud,
  ...bulk,
  ...aggregation,
  QueryBuilder,
  cacheRead,
  clearCache,
  // Wrapped core operations
  create: wrapOperation(crud.create),
  read: wrapOperation(crud.read),
  update: wrapOperation(crud.update),
  remove: wrapOperation(crud.remove),
}; 