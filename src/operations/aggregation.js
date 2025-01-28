const efficientAggregation = async (Model, pipeline, options = {}) => {
  const {
    allowDiskUse = true,
    batchSize = 1000,
    maxTimeMS = 60000
  } = options;

  return Model.aggregate(pipeline)
    .allowDiskUse(allowDiskUse)
    .option({ maxTimeMS })
    .option({ cursor: { batchSize } });
};

const groupBy = (field) => ({
  $group: {
    _id: `$${field}`,
    count: { $sum: 1 },
  },
});

const matchCondition = (condition) => ({
  $match: condition,
});

const sortByField = (field, direction = 1) => ({
  $sort: { [field]: direction },
});

module.exports = {
  efficientAggregation,
  groupBy,
  matchCondition,
  sortByField
}; 