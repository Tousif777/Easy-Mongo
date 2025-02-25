/**
 * Advanced Features Example
 * This example demonstrates the new features added in v1.1.0
 */

const { EasyMongo } = require('easy-mongo-orm');
const Joi = require('joi');

async function main() {
  // Initialize with all new features enabled
  const userDb = new EasyMongo({
    connection: {
      uri: 'mongodb://localhost:27017/example_db'
    },
    model: {
      name: 'User',
      schema: {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        age: Number,
        role: { type: String, default: 'user' },
        location: {
          type: { type: String, default: 'Point' },
          coordinates: [Number]
        },
        searchableText: String
      },
      options: {
        timestamps: true
      }
    },
    features: {
      // Core features
      enableCache: true,
      cacheTTL: 3600,
      enablePerformanceMonitoring: true,
      
      // New features
      enableSoftDelete: true,
      enableVersioning: true,
      enableDataExport: true,
      enableSchemaValidator: true,
      enableMigration: true
    }
  });

  try {
    // Connect to database
    await userDb.connect();
    console.log('Connected to MongoDB');

    // 1. Create some test users
    console.log('\n--- Creating test users ---');
    const user1 = await userDb.create({
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
      role: 'admin',
      location: {
        coordinates: [-73.935242, 40.730610]
      },
      searchableText: 'John Doe Senior Developer JavaScript React'
    });
    console.log(`Created user: ${user1.name} (${user1._id})`);

    const user2 = await userDb.create({
      name: 'Jane Smith',
      email: 'jane@example.com',
      age: 28,
      role: 'editor',
      location: {
        coordinates: [-73.935242, 40.730610]
      },
      searchableText: 'Jane Smith Senior UI/UX Designer Creative Expert'
    });
    console.log(`Created user: ${user2.name} (${user2._id})`);

    // 2. Demonstrate Soft Delete
    console.log('\n--- Soft Delete Demo ---');
    await userDb.softDeleteById(user1._id);
    console.log(`Soft deleted user: ${user1.name}`);
    
    // Find only non-deleted users
    const activeUsers = await userDb.find({});
    console.log(`Active users count: ${activeUsers.length}`);
    
    // Find including soft-deleted users
    const allUsers = await userDb.findWithDeleted({});
    console.log(`All users count (including deleted): ${allUsers.length}`);
    
    // Find only soft-deleted users
    const deletedUsers = await userDb.findOnlyDeleted({});
    console.log(`Deleted users count: ${deletedUsers.length}`);
    
    // Restore user
    await userDb.restoreById(user1._id);
    console.log(`Restored user: ${user1.name}`);

    // 3. Demonstrate Versioning
    console.log('\n--- Versioning Demo ---');
    // Update a user to create a new version
    await userDb.updateById(user2._id, { age: 29, role: 'admin' });
    console.log(`Updated user: ${user2.name}`);
    
    // Get document history
    const history = await userDb.getDocumentHistory(user2._id);
    console.log(`Version history for ${user2.name}: ${history.length} versions`);
    console.log(`Latest changes:`, history[0].changes);
    
    // Revert to previous version
    await userDb.revertToVersion(user2._id, 1, { user: 'admin@example.com' });
    console.log(`Reverted ${user2.name} to version 1`);

    // 4. Demonstrate Data Export/Import
    console.log('\n--- Data Export/Import Demo ---');
    // Export to JSON
    const jsonExport = await userDb.exportToJson(
      {}, // all users
      './exports/users.json',
      { projection: { __v: 0 } }
    );
    console.log(`Exported ${jsonExport.count} users to JSON`);
    
    // Export to CSV
    const csvExport = await userDb.exportToCsv(
      {}, // all users
      './exports/users.csv',
      { fields: ['name', 'email', 'age', 'role'] }
    );
    console.log(`Exported ${csvExport.count} users to CSV`);
    
    // Import from JSON (for demo purposes, we'll import the same data)
    const importResult = await userDb.importFromJson(
      './exports/users.json',
      { upsert: true, idField: '_id' }
    );
    console.log(`Import result: ${importResult.inserted} inserted, ${importResult.updated} updated`);

    // 5. Demonstrate Schema Validation
    console.log('\n--- Schema Validation Demo ---');
    // Define a validation schema
    userDb.defineValidationSchema(Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      age: Joi.number().min(18).max(100),
      role: Joi.string().valid('user', 'admin', 'editor')
    }));
    
    // Validate valid data
    try {
      const validData = userDb.validate({
        name: 'Alice Johnson',
        email: 'alice@example.com',
        age: 25,
        role: 'user'
      });
      console.log('Validation passed for valid data');
    } catch (error) {
      console.error('Validation error:', error.details);
    }
    
    // Validate invalid data
    try {
      const invalidData = userDb.validate({
        name: 'Bob',
        email: 'invalid-email',
        age: 15,
        role: 'superadmin'
      });
    } catch (error) {
      console.log('Validation failed as expected for invalid data:');
      console.log(error.details);
    }

    // 6. Demonstrate Data Migration
    console.log('\n--- Data Migration Demo ---');
    // Register a migration
    userDb.registerMigration({
      name: 'add-status-field',
      version: 1,
      description: 'Add status field to all users',
      up: async () => {
        const helper = userDb.migrationManager.createMigrationHelper(userDb.Model);
        await helper.addField('status', 'active');
        console.log('Migration up: Added status field');
      },
      down: async () => {
        const helper = userDb.migrationManager.createMigrationHelper(userDb.Model);
        await helper.removeField('status');
        console.log('Migration down: Removed status field');
      }
    });
    
    // Apply migrations
    const migrationResult = await userDb.applyMigrations();
    console.log(`Applied ${migrationResult.applied} migrations`);
    
    // Check migration status
    const migrationStatus = await userDb.getMigrationStatus();
    console.log(`Migration status: ${migrationStatus.applied.length} applied, ${migrationStatus.pending.length} pending`);
    
    // Rollback migration
    await userDb.rollbackLastMigration();
    console.log('Rolled back the last migration');

    // 7. Performance Stats
    console.log('\n--- Performance Stats ---');
    const stats = userDb.getPerformanceStats();
    console.log('Performance stats:', stats);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Disconnect from database
    await userDb.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the example
main().catch(console.error); 