const { errorHandler } = require('../core/errors');
const { buildTextSearch, buildGeoQuery } = require('../builders/queryBuilder');

const searchWithText = async (Model, {
  searchText,
  fields = [],
  filter = {},
  sort = { score: { $meta: 'textScore' } },
  limit = 10,
  skip = 0
}) => {
  try {
    const textSearchQuery = buildTextSearch(searchText, fields);
    const query = { ...textSearchQuery, ...filter };

    return await Model.find(query)
      .select({ score: { $meta: 'textScore' } })
      .sort(sort)
      .skip(skip)
      .limit(limit);
  } catch (error) {
    console.error('Text search failed', error);
    throw error;
  }
};

const searchNear = async (Model, {
  field,
  coordinates,
  maxDistance,
  minDistance,
  filter = {},
  limit = 10,
  skip = 0
}) => {
  try {
    const geoQuery = buildGeoQuery({
      field,
      coordinates,
      maxDistance,
      minDistance
    });

    const query = { ...geoQuery, ...filter };
    return await Model.find(query)
      .skip(skip)
      .limit(limit);
  } catch (error) {
    console.error('Geo search failed', error);
    throw error;
  }
};

const fuzzySearch = async (Model, {
  fields = [],
  searchTerm,
  filter = {},
  limit = 10,
  skip = 0
}) => {
  try {
    const fuzzyQuery = fields.reduce((acc, field) => {
      acc[field] = {
        $regex: searchTerm.split('').join('.*'),
        $options: 'i'
      };
      return acc;
    }, {});

    const query = {
      $or: Object.entries(fuzzyQuery).map(([field, value]) => ({
        [field]: value
      })),
      ...filter
    };

    return await Model.find(query)
      .skip(skip)
      .limit(limit);
  } catch (error) {
    console.error('Fuzzy search failed', error);
    throw error;
  }
};

const facetedSearch = async (Model, {
  searchText,
  facets = [],
  filter = {},
  limit = 10,
  skip = 0
}) => {
  try {
    const pipeline = [
      { $match: { ...filter } }
    ];

    if (searchText) {
      pipeline.unshift({
        $match: buildTextSearch(searchText)
      });
    }

    const facetStages = facets.reduce((acc, facet) => {
      acc[facet] = [
        { $group: { _id: `$${facet}`, count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ];
      return acc;
    }, {});

    pipeline.push(
      {
        $facet: {
          results: [
            { $skip: skip },
            { $limit: limit }
          ],
          facets: [
            {
              $facet: facetStages
            }
          ],
          total: [
            { $count: 'count' }
          ]
        }
      }
    );

    const [result] = await Model.aggregate(pipeline);
    return result;
  } catch (error) {
    console.error('Faceted search failed', error);
    throw error;
  }
};

module.exports = {
  searchWithText: errorHandler(searchWithText),
  searchNear: errorHandler(searchNear),
  fuzzySearch: errorHandler(fuzzySearch),
  facetedSearch: errorHandler(facetedSearch)
}; 