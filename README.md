# Easy-Mongo

A simple and powerful MongoDB wrapper for Node.js that makes working with MongoDB/Mongoose easier and more intuitive.

## Features

- 🚀 Simple and intuitive API
- 💪 Full TypeScript support
- 🔒 Built-in transaction support
- 🔍 Advanced search capabilities
- 📦 Bulk operations
- 🌳 Deep population
- 🔄 Virtual fields support
- 📍 Geospatial queries
- 🔤 Full text search
- 🔍 Fuzzy search
- 💾 Built-in caching
- 📊 Performance monitoring
- 🚦 Rate limiting
- 📈 Large dataset handling
- 🔄 Change streams support

## Installation

```bash
npm install mongoose-maestro
```

## Quick Start

```javascript
const mongoose = require('mongoose');
const EasyMongo = require('mongoose-maestro');

// Define your mongoose schema
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  age: Number
});

// Create model
const UserModel = mongoose.model('User', userSchema);

// Initialize Easy-Mongo with advanced features
const userDb = new EasyMongo(UserModel, {
  enableCache: true,              // Enable caching
  cacheTTL: 3600,                // Cache TTL in seconds
  enableRateLimit: true,         // Enable rate limiting
  rateLimit: {                   // Rate limit options
    windowMs: 15 * 60 * 1000,    // 15 minutes
    max: 100                     // Limit each IP to 100 requests per windowMs
  },
  enablePerformanceMonitoring: true  // Enable performance monitoring
});

// Connect to MongoDB
await EasyMongo.connect('mongodb://localhost:27017/mydb');
```

## Basic CRUD Operations

```javascript
// Create
const user = await userDb.create({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
});

// Create Multiple
const users = await userDb.createMany([
  { name: 'Alice', age: 25 },
  { name: 'Bob', age: 35 }
]);

// Find by ID
const user = await userDb.findById('user_id');

// Find One
const user = await userDb.findOne({ email: 'john@example.com' });

// Find Many with Options
const users = await userDb.find(
  { age: { $gt: 18 } },  // filter
  {
    select: 'name email',  // fields to select
    sort: { name: 1 },    // sorting
    skip: 0,              // pagination
    limit: 10,            // limit results
    populate: 'posts'     // populate relations
  }
);

// Update
await userDb.update(
  { email: 'john@example.com' },  // filter
  { age: 31 }                     // update data
);

// Update by ID
await userDb.updateById('user_id', { age: 31 });

// Delete
await userDb.delete({ email: 'john@example.com' });

// Delete by ID
await userDb.deleteById('user_id');
```

## Advanced Features

### Query Builder
```javascript
// Chainable Query Builder
const activeUsers = await userDb
  .query()
  .where({ status: 'active' })
  .select('name email')
  .sort('-createdAt')
  .limit(10)
  .execute();

// Large Dataset Query Builder with Streaming
const userStream = await userDb
  .largeDataset()
  .where({ age: { $gt: 18 } })
  .stream()
  .setBatchSize(1000)
  .execute();

userStream.on('data', (user) => {
  // Process each user
});
```

### Caching
```javascript
// Cached find operations
const users = await userDb.find(
  { age: { $gt: 18 } },
  { 
    useCache: true,  // Enable caching for this query
    cacheTTL: 1800   // Custom TTL for this query
  }
);

// Clear specific cache
await userDb.clearCache('cacheKey');

// Clear all cache
await userDb.clearAllCache();
```

### Performance Monitoring
```javascript
// Get performance stats
const stats = userDb.getPerformanceStats();
console.log(stats);
// Output:
// {
//   operations: {
//     find: { count: 100, avgTime: 50, maxTime: 200 },
//     create: { count: 50, avgTime: 30, maxTime: 100 }
//   }
// }
```

### Change Streams
```javascript
// Watch for changes
const changeStream = userDb.watch();
changeStream.on('change', (change) => {
  console.log('Document changed:', change);
});
```

### Aggregation
```javascript
const result = await userDb.aggregate([
  { $match: { age: { $gt: 18 } } },
  { $group: { _id: '$city', count: { $sum: 1 } } }
]);
```

### Estimated Count (Fast)
```javascript
const count = await userDb.estimatedCount();
```

## Configuration Options

```javascript
const options = {
  // Caching
  enableCache: true,
  cacheTTL: 3600,  // seconds

  // Rate Limiting
  enableRateLimit: true,
  rateLimit: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 100  // requests per windowMs
  },

  // Performance Monitoring
  enablePerformanceMonitoring: true
};

const userDb = new EasyMongo(UserModel, options);
```

## Search Operations

```javascript
// Text Search
const results = await userDb.search({
  text: 'john',                    // search text
  fields: ['name', 'email'],       // fields to search
  filter: { age: { $gt: 18 } },    // additional filters
  sort: { score: { $meta: 'textScore' } },
  limit: 10,
  skip: 0
});

// Geo Search
const nearbyUsers = await userDb.searchNearby({
  field: 'location',
  coordinates: [longitude, latitude],
  maxDistance: 1000,  // meters
  minDistance: 0,
  limit: 10
});

// Fuzzy Search
const fuzzyResults = await userDb.fuzzySearch({
  fields: ['name', 'email'],
  searchTerm: 'jon',  // will match 'john'
  limit: 10
});
```

## Transactions

```javascript
// Run operations in a transaction
await userDb.withTransaction(async (session) => {
  await userDb.create({ name: 'Alice' });
  await userDb.update({ name: 'Bob' }, { age: 25 });
  // If any operation fails, all changes will be rolled back
});

// Bulk Write
await userDb.bulkWrite([
  { insertOne: { document: { name: 'John' } } },
  { updateOne: { filter: { name: 'Alice' }, update: { age: 26 } } }
]);
```

## Population

```javascript
// Deep populate
const user = await userDb.findById('user_id');
const populatedUser = await userDb.populate(user, ['posts', 'comments']);

// Populate virtuals
const userWithVirtuals = await userDb.populateVirtuals(user, ['fullName']);
```

## Utility Methods

```javascript
// Count documents
const count = await userDb.count({ age: { $gt: 18 } });

// Get distinct values
const uniqueAges = await userDb.distinct('age', { country: 'USA' });

// Check if exists
const exists = await userDb.exists({ email: 'john@example.com' });
```

## Disconnect

```javascript
await EasyMongo.disconnect();
```

## Features

- 🚀 Simple and intuitive API
- 💪 Full TypeScript support
- 🔒 Built-in transaction support
- 🔍 Advanced search capabilities
- 📦 Bulk operations
- 🌳 Deep population
- 🔄 Virtual fields support
- 📍 Geospatial queries
- 🔤 Full text search
- 🔍 Fuzzy search

## License

MIT

## Documentation

For detailed documentation, please visit our [Wiki](https://github.com/Tousif777/Easy-Mongo/wiki).

### Basic Usage

```javascript
const { findDocuments, updateDocument, deleteDocument } = require('easy-mongo');

// Find documents
const users = await findDocuments('users', { age: { $gt: 18 } });

// Update a document
await updateDocument('users', { _id: userId }, { $set: { status: 'active' } });

// Delete a document
await deleteDocument('users', { _id: userId });
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## Support

- 📫 Report issues on our [Issue Tracker](https://github.com/tousif777/Easy-Mongo/issues)
- 💬 Get help in our [Discussions](https://github.com/tousif777/Easy-Mongo/discussions)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and updates. 