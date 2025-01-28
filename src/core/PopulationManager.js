const BaseMongoClient = require('./BaseMongoClient');
const population = require('../utils/population');

class PopulationManager {
  constructor(model, options = {}) {
    this.Model = model;
  }

  async populate(doc, paths, maxDepth = 2) {
    if (!doc) return null;
    
    const populateOptions = Array.isArray(paths) ? paths : [paths];
    const options = populateOptions.map(path => ({
      path,
      options: { maxDepth }
    }));

    return this.Model.populate(doc, options);
  }

  async populateVirtuals(doc, virtualFields) {
    if (!doc) return null;
    
    const fields = Array.isArray(virtualFields) ? virtualFields : [virtualFields];
    return this.Model.populate(doc, fields);
  }

  async estimatedCount() {
    return this.Model.estimatedDocumentCount();
  }
}

module.exports = PopulationManager; 