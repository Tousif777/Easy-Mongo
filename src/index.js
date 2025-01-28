const mongoose = require('mongoose');
const CrudManager = require('./core/CrudManager');
const SearchManager = require('./core/SearchManager');
const TransactionManager = require('./core/TransactionManager');
const PopulationManager = require('./core/PopulationManager');
const { QueryBuilder, LargeDatasetQueryBuilder } = require('./builders/queryBuilder');

class EasyMongo {
  constructor(model, options = {}) {
    this.crud = new CrudManager(model, options);
    this.search = new SearchManager(model, options);
    this.transaction = new TransactionManager(model, options);
    this.population = new PopulationManager(model, options);
    this.Model = model;
  }

  // Query Builder Methods
  query() {
    return new QueryBuilder(this.Model);
  }

  largeDataset() {
    return new LargeDatasetQueryBuilder(this.Model);
  }

  // Proxy CRUD methods
  async create(data) {
    return this.crud.create(data);
  }

  async createMany(dataArray) {
    return this.crud.createMany(dataArray);
  }

  async findById(id, options) {
    return this.crud.findById(id, options);
  }

  async findOne(filter, options) {
    return this.crud.findOne(filter, options);
  }

  async find(filter, options) {
    return this.crud.find(filter, options);
  }

  async update(filter, data) {
    return this.crud.update(filter, data);
  }

  async updateById(id, data) {
    return this.crud.updateById(id, data);
  }

  async delete(filter) {
    return this.crud.delete(filter);
  }

  async deleteById(id) {
    return this.crud.deleteById(id);
  }

  // Proxy Search methods
  async search(options) {
    return this.search.search(options);
  }

  async searchNearby(options) {
    return this.search.searchNearby(options);
  }

  async fuzzySearch(options) {
    return this.search.fuzzySearch(options);
  }

  // Proxy Transaction methods
  async withTransaction(callback) {
    return this.transaction.withTransaction(callback);
  }

  async bulkWrite(operations, options) {
    return this.transaction.bulkWrite(operations, options);
  }

  async aggregate(pipeline) {
    return this.transaction.aggregate(pipeline);
  }

  watch(pipeline, options) {
    return this.transaction.watch(pipeline, options);
  }

  // Proxy Population methods
  async populate(doc, paths, maxDepth) {
    return this.population.populate(doc, paths, maxDepth);
  }

  async populateVirtuals(doc, virtualFields) {
    return this.population.populateVirtuals(doc, virtualFields);
  }

  async estimatedCount() {
    return this.population.estimatedCount();
  }

  // Cache Management
  async clearCache(key) {
    await this.crud.cacheManager.clear(key);
  }

  async clearAllCache() {
    await this.crud.cacheManager.clear();
  }

  // Performance Monitoring
  getPerformanceStats() {
    return this.crud.getPerformanceStats();
  }

  // Static Methods
  static async connect(uri, options = {}) {
    return mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      ...options
    });
  }

  static disconnect() {
    return mongoose.disconnect();
  }
}

// Example usage with all features
/*
const userDb = new EasyMongo(UserModel, {
  enableCache: true,
  cacheTTL: 3600,
  enableRateLimit: true,
  rateLimit: { windowMs: 15 * 60 * 1000, max: 100 },
  enablePerformanceMonitoring: true
});

// Using Query Builder
const activeUsers = await userDb
  .query()
  .where({ status: 'active' })
  .select('name email')
  .sort('-createdAt')
  .limit(10)
  .execute();

// Using Large Dataset Query Builder with streaming
const userStream = await userDb
  .largeDataset()
  .where({ age: { $gt: 18 } })
  .stream()
  .setBatchSize(1000)
  .execute();

// Get performance stats
const stats = userDb.getPerformanceStats();
*/

module.exports = EasyMongo; 