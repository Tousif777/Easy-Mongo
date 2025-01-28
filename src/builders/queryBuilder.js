class QueryBuilder {
  constructor(model) {
    this.Model = model;
    this.query = {};
    this.options = {};
  }

  where(conditions) {
    this.query = { ...this.query, ...conditions };
    return this;
  }

  select(fields) {
    this.options.select = fields;
    return this;
  }

  sort(sortBy) {
    this.options.sort = sortBy;
    return this;
  }

  skip(skip) {
    this.options.skip = skip;
    return this;
  }

  limit(limit) {
    this.options.limit = limit;
    return this;
  }

  async execute() {
    let query = this.Model.find(this.query);

    if (this.options.select) query = query.select(this.options.select);
    if (this.options.sort) query = query.sort(this.options.sort);
    if (this.options.skip) query = query.skip(this.options.skip);
    if (this.options.limit) query = query.limit(this.options.limit);

    return query.exec();
  }
}

class LargeDatasetQueryBuilder extends QueryBuilder {
  constructor(model) {
    super(model);
    this.batchSize = 1000;
  }

  setBatchSize(size) {
    this.batchSize = size;
    return this;
  }

  stream() {
    let query = this.Model.find(this.query);

    if (this.options.select) query = query.select(this.options.select);
    if (this.options.sort) query = query.sort(this.options.sort);

    return query.cursor({ batchSize: this.batchSize });
  }

  async *[Symbol.asyncIterator]() {
    const cursor = this.stream();
    for await (const doc of cursor) {
      yield doc;
    }
  }
}

const buildQuery = ({
  search = {},
  filters = {},
  regex = false,
  caseInsensitive = true
}) => {
  const query = {};

  // Process search fields
  Object.entries(search).forEach(([field, value]) => {
    if (value) {
      if (regex) {
        query[field] = {
          $regex: value,
          $options: caseInsensitive ? 'i' : ''
        };
      } else {
        query[field] = value;
      }
    }
  });

  // Process filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      query[key] = value;
    }
  });

  return query;
};

const buildGeoQuery = ({
  field,
  coordinates,
  maxDistance,
  minDistance = 0,
  spherical = true
}) => {
  return {
    [field]: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance,
        $minDistance: minDistance
      }
    }
  };
};

const buildTextSearch = (searchText, fields = [], language = 'english') => {
  if (!searchText) return {};

  // If fields are specified, create a custom text index
  if (fields.length > 0) {
    const textIndexFields = fields.reduce((acc, field) => {
      acc[field] = 'text';
      return acc;
    }, {});

    return {
      $text: {
        $search: searchText,
        $language: language,
        $caseSensitive: false,
        $diacriticSensitive: false
      },
      $meta: 'textScore'
    };
  }

  // Use default text index
  return {
    $text: {
      $search: searchText,
      $language: language
    }
  };
};

const buildDateRangeQuery = (field, startDate, endDate) => {
  const query = {};

  if (startDate || endDate) {
    query[field] = {};
    if (startDate) {
      query[field].$gte = new Date(startDate);
    }
    if (endDate) {
      query[field].$lte = new Date(endDate);
    }
  }

  return query;
};

const buildArrayQuery = (field, values, operator = '$in') => {
  if (!values || !Array.isArray(values) || values.length === 0) {
    return {};
  }

  return {
    [field]: { [operator]: values }
  };
};

module.exports = {
  QueryBuilder,
  LargeDatasetQueryBuilder,
  buildQuery,
  buildGeoQuery,
  buildTextSearch,
  buildDateRangeQuery,
  buildArrayQuery
}; 