const mongoose = require('mongoose');

const connectDB = async (uri, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      console.log('MongoDB connected successfully');
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${i + 1} failed`, err);
      if (i === retries - 1) {
        process.exit(1);
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
};

module.exports = { connectDB }; 