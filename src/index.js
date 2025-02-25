const mongoose = require('mongoose');
const CrudManager = require('./core/CrudManager');
const SearchManager = require('./core/SearchManager');
const TransactionManager = require('./core/TransactionManager');
const PopulationManager = require('./core/PopulationManager');
const PaginationManager = require('./core/PaginationManager');
const { QueryBuilder, LargeDatasetQueryBuilder } = require('./builders/queryBuilder');
const SoftDeleteManager = require('./operations/softDelete');
const VersioningManager = require('./operations/versioning');
const DataExportManager = require('./utils/dataExport');
const SchemaValidator = require('./utils/schemaValidator');
const MigrationManager = require('./utils/dataMigration');

class EasyMongo {
  constructor(config) {
    const { connection, model, features = {} } = config;
    
    // Create the schema
    const schema = new mongoose.Schema(model.schema, model.options);
    
    // Create indexes
    schema.index({ searchableText: 'text' });
    schema.index({ 'location.coordinates': '2dsphere' });
    
    // Create the model
    this.Model = mongoose.model(model.name, schema);
    
    // Initialize managers
    this.crud = new CrudManager(this.Model, features);
    this.searchManager = new SearchManager(this.Model, features);
    this.transaction = new TransactionManager(this.Model, features);
    this.population = new PopulationManager(this.Model, features);
    this.paginationManager = new PaginationManager(this.Model, features);
    
    // Initialize new feature managers
    if (features.enableSoftDelete) {
      this.softDelete = new SoftDeleteManager(this.Model, features.softDelete || {});
    }
    
    if (features.enableVersioning) {
      this.versioning = new VersioningManager(this.Model, features.versioning || {});
    }
    
    if (features.enableDataExport) {
      this.dataExport = new DataExportManager(this.Model, features.dataExport || {});
    }
    
    if (features.enableSchemaValidator) {
      this.schemaValidator = new SchemaValidator(features.schemaValidator || {});
    }
    
    if (features.enableMigration) {
      this.migrationManager = new MigrationManager(features.migration || {});
    }
    
    // Store connection config
    this.connectionConfig = connection;
  }

  // Connection Methods
  async connect() {
    await mongoose.connect(this.connectionConfig.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      ...this.connectionConfig.options
    });

    // Ensure indexes are created
    await this.Model.createIndexes();
    return this;
  }

  async disconnect() {
    return mongoose.disconnect();
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
    const result = await this.crud.create(data);
    
    // Track creation in versioning if enabled
    if (this.versioning) {
      await this.versioning.trackCreation(result);
    }
    
    return result;
  }

  async createMany(dataArray) {
    const results = await this.crud.createMany(dataArray);
    
    // Track creation in versioning if enabled
    if (this.versioning) {
      for (const doc of results) {
        await this.versioning.trackCreation(doc);
      }
    }
    
    return results;
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
    // Get documents before update if versioning is enabled
    let oldDocs = [];
    if (this.versioning) {
      oldDocs = await this.Model.find(filter);
    }
    
    const result = await this.crud.update(filter, data);
    
    // Track updates in versioning if enabled
    if (this.versioning && oldDocs.length > 0) {
      const updatedDocs = await this.Model.find(filter);
      
      for (let i = 0; i < oldDocs.length; i++) {
        const oldDoc = oldDocs[i];
        const updatedDoc = updatedDocs.find(doc => doc._id.toString() === oldDoc._id.toString());
        
        if (updatedDoc) {
          await this.versioning.trackUpdate(oldDoc, updatedDoc);
        }
      }
    }
    
    return result;
  }

  async updateById(id, data) {
    // Get document before update if versioning is enabled
    let oldDoc = null;
    if (this.versioning) {
      oldDoc = await this.Model.findById(id);
    }
    
    const result = await this.crud.updateById(id, data);
    
    // Track update in versioning if enabled
    if (this.versioning && oldDoc && result) {
      await this.versioning.trackUpdate(oldDoc, result);
    }
    
    return result;
  }

  async delete(filter) {
    // Get documents before delete if versioning is enabled
    let docsToDelete = [];
    if (this.versioning) {
      docsToDelete = await this.Model.find(filter);
    }
    
    const result = await this.crud.delete(filter);
    
    // Track deletions in versioning if enabled
    if (this.versioning && docsToDelete.length > 0) {
      for (const doc of docsToDelete) {
        await this.versioning.trackDeletion(doc);
      }
    }
    
    return result;
  }

  async deleteById(id) {
    // Get document before delete if versioning is enabled
    let docToDelete = null;
    if (this.versioning) {
      docToDelete = await this.Model.findById(id);
    }
    
    const result = await this.crud.deleteById(id);
    
    // Track deletion in versioning if enabled
    if (this.versioning && docToDelete) {
      await this.versioning.trackDeletion(docToDelete);
    }
    
    return result;
  }

  // Proxy Search methods
  async search(options) {
    return this.searchManager.search(options);
  }

  async searchNearby(options) {
    return this.searchManager.searchNearby(options);
  }

  async fuzzySearch(options) {
    return this.searchManager.fuzzySearch(options);
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

  // Proxy Pagination methods
  async paginate(query, options) {
    return this.paginationManager.paginate(query, options);
  }

  async paginateAggregate(pipeline, options) {
    return this.paginationManager.paginateAggregate(pipeline, options);
  }

  // Soft Delete methods (if enabled)
  async softDeleteById(id) {
    if (!this.softDelete) {
      throw new Error('Soft delete is not enabled');
    }
    return this.softDelete.softDeleteById(id);
  }

  async softDelete(filter) {
    if (!this.softDelete) {
      throw new Error('Soft delete is not enabled');
    }
    return this.softDelete.softDelete(filter);
  }

  async restoreById(id) {
    if (!this.softDelete) {
      throw new Error('Soft delete is not enabled');
    }
    return this.softDelete.restoreById(id);
  }

  async restore(filter) {
    if (!this.softDelete) {
      throw new Error('Soft delete is not enabled');
    }
    return this.softDelete.restore(filter);
  }

  async findWithDeleted(filter, options) {
    if (!this.softDelete) {
      throw new Error('Soft delete is not enabled');
    }
    return this.softDelete.findWithDeleted(filter, options);
  }

  async findOnlyDeleted(filter, options) {
    if (!this.softDelete) {
      throw new Error('Soft delete is not enabled');
    }
    return this.softDelete.findOnlyDeleted(filter, options);
  }

  // Versioning methods (if enabled)
  async getDocumentHistory(documentId, options) {
    if (!this.versioning) {
      throw new Error('Versioning is not enabled');
    }
    return this.versioning.getHistory(documentId, options);
  }

  async getDocumentVersion(documentId, version) {
    if (!this.versioning) {
      throw new Error('Versioning is not enabled');
    }
    return this.versioning.getVersion(documentId, version);
  }

  async revertToVersion(documentId, version, options) {
    if (!this.versioning) {
      throw new Error('Versioning is not enabled');
    }
    return this.versioning.revertToVersion(documentId, version, options);
  }

  // Data Export methods (if enabled)
  async exportToJson(filter, filePath, options) {
    if (!this.dataExport) {
      throw new Error('Data export is not enabled');
    }
    return this.dataExport.exportToJson(filter, filePath, options);
  }

  async exportToCsv(filter, filePath, options) {
    if (!this.dataExport) {
      throw new Error('Data export is not enabled');
    }
    return this.dataExport.exportToCsv(filter, filePath, options);
  }

  async exportLargeDatasetToJson(filter, filePath, options) {
    if (!this.dataExport) {
      throw new Error('Data export is not enabled');
    }
    return this.dataExport.exportLargeDatasetToJson(filter, filePath, options);
  }

  async importFromJson(filePath, options) {
    if (!this.dataExport) {
      throw new Error('Data export is not enabled');
    }
    return this.dataExport.importFromJson(filePath, options);
  }

  async importFromCsv(filePath, options) {
    if (!this.dataExport) {
      throw new Error('Data export is not enabled');
    }
    return this.dataExport.importFromCsv(filePath, options);
  }

  // Schema Validation methods (if enabled)
  defineValidationSchema(schema) {
    if (!this.schemaValidator) {
      throw new Error('Schema validation is not enabled');
    }
    return this.schemaValidator.defineSchema(this.Model.modelName, schema);
  }

  validate(data, options) {
    if (!this.schemaValidator) {
      throw new Error('Schema validation is not enabled');
    }
    return this.schemaValidator.validate(this.Model.modelName, data, options);
  }

  async validateAsync(data, options) {
    if (!this.schemaValidator) {
      throw new Error('Schema validation is not enabled');
    }
    return this.schemaValidator.validateAsync(this.Model.modelName, data, options);
  }

  // Migration methods (if enabled)
  registerMigration(migration) {
    if (!this.migrationManager) {
      throw new Error('Migration manager is not enabled');
    }
    return this.migrationManager.registerMigration(migration);
  }

  async applyMigrations(options) {
    if (!this.migrationManager) {
      throw new Error('Migration manager is not enabled');
    }
    return this.migrationManager.applyMigrations(options);
  }

  async rollbackLastMigration() {
    if (!this.migrationManager) {
      throw new Error('Migration manager is not enabled');
    }
    return this.migrationManager.rollbackLastMigration();
  }

  async getMigrationStatus() {
    if (!this.migrationManager) {
      throw new Error('Migration manager is not enabled');
    }
    return this.migrationManager.getMigrationStatus();
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

module.exports = { EasyMongo }; 