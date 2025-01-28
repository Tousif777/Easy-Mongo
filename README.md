# Easy Mongo ORM

A powerful and elegant MongoDB/Mongoose toolkit that makes database operations a breeze with built-in caching, search, pagination, performance monitoring, and more.

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
  enableCache: true,
  cacheTTL: 3600, // seconds
  enablePerformanceMonitoring: true,
  enableRateLimit: true,
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // requests per windowMs
  }
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [Md.Tousif](https://github.com/tousif777) 