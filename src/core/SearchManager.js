const BaseMongoClient = require('./BaseMongoClient');
const search = require('../operations/search');

class SearchManager extends BaseMongoClient {
  constructor(model, options = {}) {
    super(model, options);
  }

  async search(options = {}) {
    return this._executeWithMonitoring('search', () => {
      const { text, fields, filter, sort, limit, skip } = options;
      return search.searchWithText(this.Model, {
        searchText: text,
        fields,
        filter,
        sort,
        limit,
        skip
      });
    });
  }

  async searchNearby(options = {}) {
    return this._executeWithMonitoring('searchNearby', () => {
      const { field, coordinates, maxDistance, minDistance, filter, limit, skip } = options;
      return search.searchNear(this.Model, {
        field,
        coordinates,
        maxDistance,
        minDistance,
        filter,
        limit,
        skip
      });
    });
  }

  async fuzzySearch(options = {}) {
    return this._executeWithMonitoring('fuzzySearch', () => {
      const { fields, searchTerm, filter, limit, skip } = options;
      return search.fuzzySearch(this.Model, {
        fields,
        searchTerm,
        filter,
        limit,
        skip
      });
    });
  }
}

module.exports = SearchManager; 