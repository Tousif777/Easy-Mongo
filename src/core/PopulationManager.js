const BaseMongoClient = require('./BaseMongoClient');
const population = require('../utils/population');

class PopulationManager extends BaseMongoClient {
  constructor(model, options = {}) {
    super(model, options);
  }

  async populate(doc, paths = [], maxDepth = 3) {
    return this._executeWithMonitoring('populate', () => 
      population.populateDeep(doc, { paths, maxDepth })
    );
  }

  async populateVirtuals(doc, virtualFields = []) {
    return this._executeWithMonitoring('populateVirtuals', () => 
      population.populateVirtuals(doc, virtualFields)
    );
  }

  async estimatedCount() {
    return this._executeWithMonitoring('estimatedCount', () => 
      this.Model.estimatedDocumentCount()
    );
  }
}

module.exports = PopulationManager; 