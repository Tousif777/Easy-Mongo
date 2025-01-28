const mongoose = require('mongoose');

class TransactionManager {
  constructor(model, options = {}) {
    this.Model = model;
  }

  async withTransaction(callback) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const result = await callback(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async bulkWrite(operations, options = {}) {
    return this.Model.bulkWrite(operations, options);
  }

  async aggregate(pipeline) {
    return this.Model.aggregate(pipeline);
  }

  watch(pipeline, options) {
    return this.Model.watch(pipeline, options);
  }
}

module.exports = TransactionManager; 