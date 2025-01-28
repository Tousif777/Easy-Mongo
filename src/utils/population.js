const { errorHandler } = require('../core/errors');

const populateDeep = async (doc, {
  paths = [],
  maxDepth = 3,
  currentDepth = 0
}) => {
  if (!doc || currentDepth >= maxDepth) return doc;

  const populated = await doc.populate(paths);
  
  for (const path of paths) {
    const populatedData = populated.get(path);
    if (!populatedData) continue;

    if (Array.isArray(populatedData)) {
      for (const item of populatedData) {
        await populateDeep(item, {
          paths,
          maxDepth,
          currentDepth: currentDepth + 1
        });
      }
    } else {
      await populateDeep(populatedData, {
        paths,
        maxDepth,
        currentDepth: currentDepth + 1
      });
    }
  }

  return populated;
};

const populateVirtuals = async (doc, virtualFields = []) => {
  if (!doc) return doc;

  const populated = await virtualFields.reduce(async (accPromise, field) => {
    const acc = await accPromise;
    return acc.populate({
      path: field,
      options: { virtuals: true }
    });
  }, Promise.resolve(doc));

  return populated;
};

const populateWithGraphLookup = async (Model, {
  startWith,
  connectFromField,
  connectToField,
  as,
  maxDepth = 3,
  filter = {}
}) => {
  try {
    const pipeline = [
      {
        $match: filter
      },
      {
        $graphLookup: {
          from: Model.collection.name,
          startWith: startWith,
          connectFromField: connectFromField,
          connectToField: connectToField,
          as: as,
          maxDepth: maxDepth
        }
      }
    ];

    return await Model.aggregate(pipeline);
  } catch (error) {
    console.error('Graph lookup population failed', error);
    throw error;
  }
};

const populateWithLean = async (Model, query = {}, populateOptions = []) => {
  try {
    return await Model.find(query)
      .populate(populateOptions)
      .lean({ virtuals: true });
  } catch (error) {
    console.error('Lean population failed', error);
    throw error;
  }
};

module.exports = {
  populateDeep: errorHandler(populateDeep),
  populateVirtuals: errorHandler(populateVirtuals),
  populateWithGraphLookup: errorHandler(populateWithGraphLookup),
  populateWithLean: errorHandler(populateWithLean)
}; 