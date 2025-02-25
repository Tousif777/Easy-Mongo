/**
 * Data Migration Utilities for Easy-Mongo
 * Provides tools for schema migrations and data transformations
 */

const mongoose = require('mongoose');

class MigrationManager {
  constructor(options = {}) {
    this.options = options;
    this.migrations = [];
    
    // Create migration tracking collection if it doesn't exist
    this._createMigrationModel();
  }

  /**
   * Create migration model for tracking applied migrations
   * @private
   */
  _createMigrationModel() {
    const migrationSchema = new mongoose.Schema({
      name: { type: String, required: true, unique: true },
      appliedAt: { type: Date, default: Date.now },
      version: { type: Number, required: true },
      description: { type: String },
      duration: { type: Number } // in milliseconds
    });
    
    // Check if model already exists
    if (mongoose.models.Migration) {
      this.MigrationModel = mongoose.model('Migration');
    } else {
      this.MigrationModel = mongoose.model('Migration', migrationSchema);
    }
  }

  /**
   * Register a migration
   * @param {Object} migration - Migration object
   * @param {string} migration.name - Unique name for the migration
   * @param {number} migration.version - Migration version number
   * @param {string} migration.description - Description of what the migration does
   * @param {Function} migration.up - Function to apply the migration
   * @param {Function} migration.down - Function to revert the migration
   */
  registerMigration(migration) {
    if (!migration.name || !migration.version || !migration.up) {
      throw new Error('Migration must have a name, version, and up function');
    }
    
    // Check for duplicate names
    const existingMigration = this.migrations.find(m => m.name === migration.name);
    if (existingMigration) {
      throw new Error(`Migration with name "${migration.name}" already exists`);
    }
    
    this.migrations.push(migration);
  }

  /**
   * Apply all pending migrations
   * @param {Object} options - Migration options
   * @returns {Promise<Array>} - Applied migrations
   */
  async applyMigrations(options = {}) {
    const appliedMigrations = await this.MigrationModel.find().sort({ version: 1 });
    const appliedNames = appliedMigrations.map(m => m.name);
    
    // Get pending migrations
    const pendingMigrations = this.migrations
      .filter(m => !appliedNames.includes(m.name))
      .sort((a, b) => a.version - b.version);
    
    if (pendingMigrations.length === 0) {
      return { applied: 0, message: 'No pending migrations' };
    }
    
    const results = [];
    
    // Apply each migration
    for (const migration of pendingMigrations) {
      const startTime = Date.now();
      
      try {
        // Apply migration
        await migration.up();
        
        // Record migration
        const duration = Date.now() - startTime;
        await this.MigrationModel.create({
          name: migration.name,
          version: migration.version,
          description: migration.description,
          appliedAt: new Date(),
          duration
        });
        
        results.push({
          name: migration.name,
          version: migration.version,
          success: true,
          duration
        });
      } catch (error) {
        results.push({
          name: migration.name,
          version: migration.version,
          success: false,
          error: error.message
        });
        
        if (!options.continueOnError) {
          throw new Error(`Migration "${migration.name}" failed: ${error.message}`);
        }
      }
    }
    
    return {
      applied: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results
    };
  }

  /**
   * Rollback the last applied migration
   * @returns {Promise<Object>} - Rollback result
   */
  async rollbackLastMigration() {
    // Get the last applied migration
    const lastApplied = await this.MigrationModel.findOne().sort({ appliedAt: -1 });
    
    if (!lastApplied) {
      return { rolled_back: 0, message: 'No migrations to rollback' };
    }
    
    // Find the migration in our registered migrations
    const migration = this.migrations.find(m => m.name === lastApplied.name);
    
    if (!migration) {
      throw new Error(`Migration "${lastApplied.name}" not found in registered migrations`);
    }
    
    if (!migration.down) {
      throw new Error(`Migration "${lastApplied.name}" does not have a down function`);
    }
    
    const startTime = Date.now();
    
    try {
      // Apply rollback
      await migration.down();
      
      // Remove migration record
      await this.MigrationModel.deleteOne({ name: lastApplied.name });
      
      const duration = Date.now() - startTime;
      
      return {
        rolled_back: 1,
        name: migration.name,
        version: migration.version,
        duration
      };
    } catch (error) {
      throw new Error(`Rollback of "${migration.name}" failed: ${error.message}`);
    }
  }

  /**
   * Rollback to a specific version
   * @param {number} targetVersion - Version to rollback to
   * @returns {Promise<Object>} - Rollback result
   */
  async rollbackToVersion(targetVersion) {
    // Get all applied migrations with version greater than target
    const migrationsToRollback = await this.MigrationModel.find({ 
      version: { $gt: targetVersion } 
    }).sort({ version: -1 });
    
    if (migrationsToRollback.length === 0) {
      return { rolled_back: 0, message: 'No migrations to rollback' };
    }
    
    const results = [];
    
    // Rollback each migration
    for (const appliedMigration of migrationsToRollback) {
      // Find the migration in our registered migrations
      const migration = this.migrations.find(m => m.name === appliedMigration.name);
      
      if (!migration) {
        throw new Error(`Migration "${appliedMigration.name}" not found in registered migrations`);
      }
      
      if (!migration.down) {
        throw new Error(`Migration "${appliedMigration.name}" does not have a down function`);
      }
      
      const startTime = Date.now();
      
      try {
        // Apply rollback
        await migration.down();
        
        // Remove migration record
        await this.MigrationModel.deleteOne({ name: appliedMigration.name });
        
        const duration = Date.now() - startTime;
        
        results.push({
          name: migration.name,
          version: migration.version,
          success: true,
          duration
        });
      } catch (error) {
        results.push({
          name: migration.name,
          version: migration.version,
          success: false,
          error: error.message
        });
        
        throw new Error(`Rollback of "${migration.name}" failed: ${error.message}`);
      }
    }
    
    return {
      rolled_back: results.length,
      results
    };
  }

  /**
   * Get migration status
   * @returns {Promise<Object>} - Migration status
   */
  async getMigrationStatus() {
    const appliedMigrations = await this.MigrationModel.find().sort({ version: 1 });
    const appliedNames = appliedMigrations.map(m => m.name);
    
    // Get pending migrations
    const pendingMigrations = this.migrations
      .filter(m => !appliedNames.includes(m.name))
      .sort((a, b) => a.version - b.version);
    
    return {
      applied: appliedMigrations.map(m => ({
        name: m.name,
        version: m.version,
        appliedAt: m.appliedAt,
        description: m.description,
        duration: m.duration
      })),
      pending: pendingMigrations.map(m => ({
        name: m.name,
        version: m.version,
        description: m.description
      }))
    };
  }

  /**
   * Create a migration helper for common schema changes
   * @param {Object} model - Mongoose model
   * @returns {Object} - Migration helper
   */
  createMigrationHelper(model) {
    return {
      /**
       * Add a field to all documents
       * @param {string} field - Field name
       * @param {any} defaultValue - Default value for the field
       * @returns {Promise<Object>} - Update result
       */
      addField: async (field, defaultValue) => {
        const updateQuery = { $set: { [field]: defaultValue } };
        return model.updateMany({}, updateQuery);
      },
      
      /**
       * Remove a field from all documents
       * @param {string} field - Field name
       * @returns {Promise<Object>} - Update result
       */
      removeField: async (field) => {
        const updateQuery = { $unset: { [field]: 1 } };
        return model.updateMany({}, updateQuery);
      },
      
      /**
       * Rename a field in all documents
       * @param {string} oldName - Old field name
       * @param {string} newName - New field name
       * @returns {Promise<Object>} - Update result
       */
      renameField: async (oldName, newName) => {
        const updateQuery = { $rename: { [oldName]: newName } };
        return model.updateMany({}, updateQuery);
      },
      
      /**
       * Transform a field in all documents
       * @param {string} field - Field name
       * @param {Function} transformFn - Function to transform the field value
       * @returns {Promise<Object>} - Update result
       */
      transformField: async (field, transformFn) => {
        const documents = await model.find({});
        const bulkOps = [];
        
        for (const doc of documents) {
          if (doc[field] !== undefined) {
            const newValue = transformFn(doc[field], doc);
            bulkOps.push({
              updateOne: {
                filter: { _id: doc._id },
                update: { $set: { [field]: newValue } }
              }
            });
          }
        }
        
        if (bulkOps.length === 0) {
          return { modifiedCount: 0 };
        }
        
        return model.bulkWrite(bulkOps);
      },
      
      /**
       * Copy data from one field to another
       * @param {string} sourceField - Source field name
       * @param {string} targetField - Target field name
       * @returns {Promise<Object>} - Update result
       */
      copyField: async (sourceField, targetField) => {
        const aggregation = [
          {
            $addFields: {
              [targetField]: `$${sourceField}`
            }
          },
          { $merge: { into: model.collection.name, whenMatched: 'merge' } }
        ];
        
        return model.aggregate(aggregation);
      }
    };
  }
}

module.exports = MigrationManager; 