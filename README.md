# Easy Mongo ORM

A powerful and elegant MongoDB/Mongoose toolkit that makes database operations a breeze with built-in caching, search, pagination, performance monitoring, soft delete, versioning, data export/import, schema validation, and migration utilities.

## Features

- 🚀 **Easy to Use**: Simple and intuitive API
- 🔍 **Advanced Search**: Text, Geospatial, and Fuzzy search built-in
- 📄 **Smart Pagination**: Both regular and aggregation pagination support
- 💾 **Caching**: Built-in caching system for better performance
- 📊 **Performance Monitoring**: Track operation times and query performance
- 🔒 **Rate Limiting**: Protect your database from overload
- 🔄 **Transactions**: Easy-to-use transaction support
- 🔗 **Population**: Simple document population with depth control
- 🏗️ **Query Builder**: Fluent query building interface
- 📦 **Bulk Operations**: Efficient bulk create, update, and delete
- 🗑️ **Soft Delete**: Mark documents as deleted without removing them
- 📜 **Versioning & Audit Trail**: Track document changes over time
- 📤 **Data Export/Import**: Export and import data in JSON and CSV formats
- ✅ **Schema Validation**: Enhanced validation beyond Mongoose's built-in validation
- 🔄 **Data Migration**: Tools for schema migrations and data transformations

## Installation

```bash
npm install easy-mongo-orm mongoose
```

## Quick Start

```javascript
const { EasyMongo } = require('easy-mongo-orm');

// Initialize with your model configuration
const userDb = new EasyMongo({
  connection: {
    uri: 'mongodb://localhost:27017/mydb'
  },
  model: {
    name: 'User',
    schema: {
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      age: Number,
      tags: [String]
    },
    options: {
      timestamps: true
    }
  },
  features: {
    enableCache: true,
    enablePerformanceMonitoring: true
  }
});

// Connect to database
await userDb.connect();

// CRUD Operations
const user = await userDb.create({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  tags: ['developer']
});

// Search Operations
const results = await userDb.search({
  text: 'John',
  fields: ['name']
});

// Pagination
const { data, pagination } = await userDb.paginate(
  { age: { $gt: 25 } },
  { page: 1, limit: 10 }
);

// Performance Stats
const stats = userDb.getPerformanceStats();
```

## Advanced Features

### Text Search
```javascript
const results = await userDb.search({
  text: 'developer',
  fields: ['tags', 'bio']
});
```

### Geospatial Search
```javascript
const nearbyUsers = await userDb.searchNearby({
  coordinates: [-73.935242, 40.730610],
  maxDistance: 1000 // meters
});
```

### Fuzzy Search
```javascript
const results = await userDb.fuzzySearch({
  field: 'name',
  query: 'jhon' // will match "John"
});
```

### Query Builder
```javascript
const users = await userDb
  .query()
  .where({ age: { $gt: 25 } })
  .select('name email')
  .sort('-createdAt')
  .limit(10)
  .execute();
```

### Large Dataset Handling
```javascript
const stream = userDb
  .largeDataset()
  .where({ status: 'active' })
  .stream();

for await (const doc of stream) {
  // Process each document
}
```

### Transactions
```javascript
await userDb.withTransaction(async (session) => {
  const user = await userDb.create({
    name: 'Alice',
    email: 'alice@example.com'
  }, { session });
  
  await userDb.create({
    name: 'Bob',
    email: 'bob@example.com'
  }, { session });
});
```

### Caching
```javascript
// First call hits database
const user1 = await userDb.findOne({ email: 'john@example.com' });

// Second call uses cache
const user2 = await userDb.findOne({ email: 'john@example.com' });

// Clear specific cache
await userDb.clearCache('email:john@example.com');

// Clear all cache
await userDb.clearAllCache();
```

### Performance Monitoring
```javascript
const stats = userDb.getPerformanceStats();
console.log(stats);
// {
//   operations: {
//     create: { count: 10, totalTime: 150, averageTime: 15 },
//     find: { count: 20, totalTime: 180, averageTime: 9 }
//   },
//   totalQueries: 30,
//   averageQueryTime: 11,
//   errors: 0
// }
```

### Soft Delete
```javascript
// Enable soft delete in features
const userDb = new EasyMongo({
  // ... other config
  features: {
    enableSoftDelete: true,
    softDelete: {
      deletedField: 'isDeleted',  // default
      deletedAtField: 'deletedAt' // default
    }
  }
});

// Soft delete a document
await userDb.softDeleteById('60d21b4667d0d8992e610c85');

// Soft delete multiple documents
await userDb.softDelete({ status: 'inactive' });

// Restore a soft-deleted document
await userDb.restoreById('60d21b4667d0d8992e610c85');

// Restore multiple soft-deleted documents
await userDb.restore({ status: 'inactive' });

// Find including soft-deleted documents
const allUsers = await userDb.findWithDeleted({});

// Find only soft-deleted documents
const deletedUsers = await userDb.findOnlyDeleted({});
```

### Document Versioning & Audit Trail
```javascript
// Enable versioning in features
const userDb = new EasyMongo({
  // ... other config
  features: {
    enableVersioning: true,
    versioning: {
      historyCollectionName: 'UserHistory' // default is modelName + 'History'
    }
  }
});

// Create, update, and delete operations automatically track changes

// Get document history
const history = await userDb.getDocumentHistory('60d21b4667d0d8992e610c85');
// Returns array of versions with changes

// Get specific version
const v2 = await userDb.getDocumentVersion('60d21b4667d0d8992e610c85', 2);

// Revert to a previous version
await userDb.revertToVersion('60d21b4667d0d8992e610c85', 2, {
  user: 'admin@example.com' // optional user info for audit trail
});
```

### Data Export/Import
```javascript
// Enable data export in features
const userDb = new EasyMongo({
  // ... other config
  features: {
    enableDataExport: true
  }
});

// Export to JSON
await userDb.exportToJson(
  { status: 'active' }, // filter
  './exports/active-users.json', // file path
  { 
    projection: { password: 0 }, // exclude fields
    sort: { createdAt: -1 }
  }
);

// Export to CSV
await userDb.exportToCsv(
  { status: 'active' },
  './exports/active-users.csv',
  { 
    fields: ['name', 'email', 'createdAt'] // specify fields to export
  }
);

// Export large dataset with streaming
await userDb.exportLargeDatasetToJson(
  { status: 'active' },
  './exports/all-active-users.json',
  { batchSize: 1000 }
);

// Import from JSON
await userDb.importFromJson(
  './imports/users.json',
  {
    replace: false, // don't clear collection before import
    upsert: true,   // update existing documents
    idField: '_id'  // field to use for matching existing documents
  }
);

// Import from CSV
await userDb.importFromCsv(
  './imports/users.csv',
  {
    fieldTypes: {
      age: 'number',
      isActive: 'boolean',
      joinDate: 'date'
    }
  }
);
```

### Enhanced Schema Validation
```javascript
// Enable schema validation in features
const userDb = new EasyMongo({
  // ... other config
  features: {
    enableSchemaValidator: true
  }
});

// Get common validation schemas
const Joi = require('joi');
const commonSchemas = SchemaValidator.createCommonSchemas();

// Define a validation schema
userDb.defineValidationSchema(Joi.object({
  name: Joi.string().required(),
  email: commonSchemas.email.required(),
  password: commonSchemas.password,
  age: Joi.number().min(18).max(100),
  role: Joi.string().valid('user', 'admin', 'editor')
}));

// Validate data
try {
  const validatedData = userDb.validate({
    name: 'John Doe',
    email: 'invalid-email',
    age: 15
  });
} catch (error) {
  console.log(error.details);
  // [
  //   { field: 'email', message: 'must be a valid email', type: 'string.email' },
  //   { field: 'age', message: 'must be at least 18', type: 'number.min' }
  // ]
}

// Async validation
const validatedData = await userDb.validateAsync(data);
```

### Data Migration
```javascript
// Enable migration in features
const userDb = new EasyMongo({
  // ... other config
  features: {
    enableMigration: true
  }
});

// Register a migration
userDb.registerMigration({
  name: 'add-status-field',
  version: 1,
  description: 'Add status field to all users',
  up: async () => {
    // Create a migration helper
    const helper = userDb.migrationManager.createMigrationHelper(userDb.Model);
    
    // Add a field to all documents
    await helper.addField('status', 'active');
  },
  down: async () => {
    const helper = userDb.migrationManager.createMigrationHelper(userDb.Model);
    await helper.removeField('status');
  }
});

// Register another migration
userDb.registerMigration({
  name: 'rename-bio-to-description',
  version: 2,
  description: 'Rename bio field to description',
  up: async () => {
    const helper = userDb.migrationManager.createMigrationHelper(userDb.Model);
    await helper.renameField('bio', 'description');
  },
  down: async () => {
    const helper = userDb.migrationManager.createMigrationHelper(userDb.Model);
    await helper.renameField('description', 'bio');
  }
});

// Apply all pending migrations
const result = await userDb.applyMigrations();
console.log(`Applied ${result.applied} migrations`);

// Get migration status
const status = await userDb.getMigrationStatus();
console.log(`Applied migrations: ${status.applied.length}`);
console.log(`Pending migrations: ${status.pending.length}`);

// Rollback the last migration
await userDb.rollbackLastMigration();
```

## Configuration Options

### Connection Options
```javascript
{
  uri: 'mongodb://localhost:27017/mydb',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true
    // ... other mongoose connection options
  }
}
```

### Feature Options
```javascript
{
  // Core features
  enableCache: true,
  cacheTTL: 3600, // seconds
  enablePerformanceMonitoring: true,
  enableRateLimit: true,
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // requests per windowMs
  },
  
  // New features
  enableSoftDelete: true,
  softDelete: {
    deletedField: 'isDeleted',
    deletedAtField: 'deletedAt'
  },
  
  enableVersioning: true,
  versioning: {
    historyCollectionName: 'CustomHistoryCollection'
  },
  
  enableDataExport: true,
  dataExport: {
    // export options
  },
  
  enableSchemaValidator: true,
  schemaValidator: {
    // validation options
  },
  
  enableMigration: true,
  migration: {
    // migration options
  }
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [Md.Tousif](https://github.com/tousif777) 