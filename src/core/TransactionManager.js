const BaseMongoClient = require('./BaseMongoClient');
const transactions = require('../operations/transactions');

class TransactionManager extends BaseMongoClient {
  constructor(model, options = {}) {
    super(model, options);
  }

  async withTransaction(callback) {
    return this._executeWithMonitoring('transaction', () => 
      transactions.withTransaction(callback)
    );
  }

  async bulkWrite(operations, options = {}) {
    return this._executeWithMonitoring('bulkWrite', () => 
      transactions.bulkWrite(this.Model, operations, options)
    );
  }

  async aggregate(pipeline) {
    return this._executeWithMonitoring('aggregate', () => 
      this.Model.aggregate(pipeline)
    );
  }

  watch(pipeline = [], options = {}) {
    return this.Model.watch(pipeline, options);
  }
}

module.exports = TransactionManager; 