const BaseMongoClient = require('./BaseMongoClient');
const search = require('../operations/search');

class SearchManager extends BaseMongoClient {
  constructor(model, options = {}) {
    super(model, options);
  }

  async search({ text, fields = [] }) {
    try {
      const searchQuery = {};
      if (fields && fields.length > 0) {
        searchQuery.$text = { $search: text };
        return this.Model.find(searchQuery).sort({ score: { $meta: 'textScore' } });
      } else {
        searchQuery.searchableText = { $regex: text, $options: 'i' };
        return this.Model.find(searchQuery);
      }
    } catch (error) {
      console.error('Text search failed:', error);
      throw error;
    }
  }

  async searchNearby({ coordinates, maxDistance = 10000 }) {
    try {
      return this.Model.find({
        'location.coordinates': {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: coordinates
            },
            $maxDistance: maxDistance
          }
        }
      });
    } catch (error) {
      console.error('Geospatial search failed:', error);
      throw error;
    }
  }

  async fuzzySearch({ field, query }) {
    try {
      // Create a case-insensitive regex pattern with flexible matching
      const regex = new RegExp(query.split('').join('.*'), 'i');
      const searchQuery = {};
      searchQuery[field] = regex;
      return this.Model.find(searchQuery);
    } catch (error) {
      console.error('Fuzzy search failed:', error);
      throw error;
    }
  }
}

module.exports = SearchManager; 