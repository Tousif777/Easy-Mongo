class QueryBuilder {
  constructor(Model) {
    this.Model = Model;
    this.query = this.Model.find();
  }

  where(conditions) {
    this.query = this.query.where(conditions);
    return this;
  }

  select(fields) {
    this.query = this.query.select(fields);
    return this;
  }

  sort(sortBy) {
    this.query = this.query.sort(sortBy);
    return this;
  }

  limit(num) {
    this.query = this.query.limit(num);
    return this;
  }

  skip(num) {
    this.query = this.query.skip(num);
    return this;
  }

  async execute() {
    return await this.query.exec();
  }
}

class LargeDatasetQueryBuilder extends QueryBuilder {
  constructor(Model) {
    super(Model);
    this.useStream = false;
    this.batchSize = 1000;
  }

  stream() {
    this.useStream = true;
    return this;
  }

  setBatchSize(size) {
    this.batchSize = size;
    return this;
  }

  async execute() {
    if (this.useStream) {
      return this.Model.find(this.query).cursor({ batchSize: this.batchSize });
    }
    return super.execute();
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