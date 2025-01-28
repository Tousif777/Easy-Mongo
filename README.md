# Easy-Mongo

A simplified MongoDB/Mongoose helper library with advanced features that makes working with MongoDB in Node.js applications easier and more intuitive.

## Features

- 🚀 Simplified CRUD operations
- 🛡️ Built-in data sanitization
- 📦 Bulk operations with validation
- 📊 Aggregation helpers
- 🔄 Sharding support
- 📝 Activity logging

## Installation

```bash
# Using npm
npm install easy-mongo

# Using yarn
yarn add easy-mongo

# Using pnpm
pnpm add easy-mongo
```

## Quick Start

```javascript
const { connect, createDocument } = require('easy-mongo');

// Connect to MongoDB
await connect('mongodb://localhost:27017/your-database');

// Create a document
const user = await createDocument('users', {
  name: 'John Doe',
  email: 'john@example.com'
});
```

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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 📫 Report issues on our [Issue Tracker](https://github.com/yourusername/easy-mongo/issues)
- 💬 Get help in our [Discussions](https://github.com/yourusername/easy-mongo/discussions)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and updates. 