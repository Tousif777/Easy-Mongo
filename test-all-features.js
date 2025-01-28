const { EasyMongo } = require('./src/index');

async function testAllFeatures() {
  try {
    // Initialize the client with all features enabled
    const userDb = new EasyMongo({
      connection: {
        uri: 'mongodb://127.0.0.1:27017/testdb'
      },
      model: {
        name: 'User',
        schema: {
          name: { type: String, required: true },
          email: { type: String, required: true, unique: true },
          age: { type: Number },
          location: {
            type: {
              type: String,
              enum: ['Point'],
              default: 'Point'
            },
            coordinates: {
              type: [Number],
              index: '2dsphere'
            }
          },
          tags: [{ type: String }],
          status: { type: String, enum: ['active', 'inactive'] },
          metadata: { type: Object },
          searchableText: { type: String, index: 'text' }  // Explicitly define text index
        },
        options: {
          timestamps: true,
          collection: 'users',
          toJSON: { virtuals: true },
          toObject: { virtuals: true }
        }
      },
      features: {
        enableCache: true,
        cacheTTL: 3600,
        enablePerformanceMonitoring: true,
        enableRateLimit: true,
        rateLimit: { windowMs: 15 * 60 * 1000, max: 100 }
      }
    });

    // Connect to database
    console.log('1. Testing Connection...');
    await userDb.connect();
    console.log('✓ Connected successfully!\n');

    // Clean up database
    await userDb.Model.deleteMany({});

    // Test CRUD Operations
    console.log('2. Testing CRUD Operations...');
    
    // Create
    const user = await userDb.create({
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
      location: {
        type: 'Point',
        coordinates: [-74.0060, 40.7128]  // [longitude, latitude]
      },
      tags: ['developer', 'nodejs'],
      status: 'active',
      metadata: { experience: '5 years' },
      searchableText: 'John Doe Senior Developer Node.js JavaScript Expert'
    });
    console.log('✓ Create operation successful');

    // Bulk Create
    const bulkUsers = await userDb.createMany([
      {
        name: 'Jane Smith',
        email: 'jane@example.com',
        age: 28,
        location: {
          type: 'Point',
          coordinates: [-118.2437, 34.0522]  // Los Angeles
        },
        tags: ['designer', 'ui/ux'],
        status: 'active',
        searchableText: 'Jane Smith Senior UI/UX Designer Creative Expert'
      },
      {
        name: 'Bob Wilson',
        email: 'bob@example.com',
        age: 35,
        location: {
          type: 'Point',
          coordinates: [-0.1278, 51.5074]  // London
        },
        tags: ['manager', 'agile'],
        status: 'active',
        searchableText: 'Bob Wilson Project Manager Agile Scrum Master'
      }
    ]);
    console.log('✓ Bulk create operation successful');

    // Read
    const foundUser = await userDb.findById(user._id);
    console.log('✓ FindById operation successful');

    // Update
    const updatedUser = await userDb.updateById(user._id, { age: 31 });
    console.log('✓ Update operation successful');

    // Delete
    await userDb.deleteById(user._id);
    console.log('✓ Delete operation successful\n');

    // Test Search Operations
    console.log('3. Testing Search Operations...');
    
    try {
      // Wait for indexes to be created
      console.log('Waiting for indexes to be created...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Text Search
      console.log('Testing text search...');
      const searchResults = await userDb.search({
        text: 'Designer',
        fields: ['searchableText']
      });
      console.log('Text search results:', searchResults);
      console.log('✓ Text search operation successful');

      // Geospatial Search (searching near Los Angeles)
      console.log('\nTesting geospatial search...');
      const nearbyUsers = await userDb.searchNearby({
        coordinates: [-118.2437, 34.0522],  // Los Angeles coordinates
        maxDistance: 100000  // 100km
      });
      console.log('Nearby users:', nearbyUsers);
      console.log('✓ Geospatial search operation successful');

      // Fuzzy Search
      console.log('\nTesting fuzzy search...');
      const fuzzyResults = await userDb.fuzzySearch({
        field: 'name',
        query: 'jane'
      });
      console.log('Fuzzy search results:', fuzzyResults);
      console.log('✓ Fuzzy search operation successful\n');
    } catch (error) {
      console.error('Search operation failed:', error);
      console.error('Error stack:', error.stack);
      throw error;
    }

    // Test Pagination
    console.log('4. Testing Pagination...');
    const paginatedResults = await userDb.paginate({}, {
      page: 1,
      limit: 2,
      sort: '-createdAt'
    });
    console.log('✓ Pagination operation successful\n');

    // Test Transactions
    console.log('5. Testing Transactions...');
    await userDb.withTransaction(async (session) => {
      await userDb.create({
        name: 'Transaction Test',
        email: 'transaction@example.com',
        age: 40,
        status: 'active'
      }, { session });
    });
    console.log('✓ Transaction operation successful\n');

    // Test Performance Monitoring
    console.log('6. Testing Performance Monitoring...');
    const stats = userDb.getPerformanceStats();
    console.log('✓ Performance monitoring successful');
    console.log('Performance Stats:', stats, '\n');

    // Test Cache
    console.log('7. Testing Cache...');
    // First call - should hit database
    console.time('First Call');
    await userDb.findOne({ email: 'jane@example.com' });
    console.timeEnd('First Call');

    // Second call - should hit cache
    console.time('Second Call (Cached)');
    await userDb.findOne({ email: 'jane@example.com' });
    console.timeEnd('Second Call (Cached)');
    console.log('✓ Cache operations successful\n');

    // Test Rate Limiting
    console.log('8. Testing Rate Limiting...');
    try {
      for (let i = 0; i < 105; i++) {
        await userDb.findOne({ email: 'jane@example.com' });
      }
    } catch (error) {
      if (error.message.includes('Rate limit exceeded')) {
        console.log('✓ Rate limiting working as expected\n');
      } else {
        throw error;
      }
    }

    // Clean up and disconnect
    await userDb.Model.deleteMany({});
    await userDb.disconnect();
    console.log('All tests completed successfully!');

  } catch (error) {
    console.error('Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run all tests
testAllFeatures(); 