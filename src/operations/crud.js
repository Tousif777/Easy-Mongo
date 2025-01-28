const { errorHandler } = require('../core/errors');
const { validateSchema } = require('../helpers/validation');

const create = async (Model, data, schema) => {
  try {
    if (schema) validateSchema(data, schema);
    const document = new Model(data);
    await document.save();
    return document;
  } catch (err) {
    console.error('Create failed', err);
    throw err;
  }
};

const read = async (Model, filter = {}, projection = {}, options = {}) => {
  try {
    return await Model.find(filter, projection, options);
  } catch (err) {
    console.error('Read failed', err);
    throw err;
  }
};

const findOne = async (Model, filter = {}, projection = {}, options = {}) => {
  try {
    return await Model.findOne(filter, projection, options);
  } catch (err) {
    console.error('FindOne failed', err);
    throw err;
  }
};

const findById = async (Model, id, projection = {}, options = {}) => {
  try {
    return await Model.findById(id, projection, options);
  } catch (err) {
    console.error('FindById failed', err);
    throw err;
  }
};

const update = async (Model, filter, updateData, options = { new: true }) => {
  try {
    return await Model.findOneAndUpdate(filter, updateData, options);
  } catch (err) {
    console.error('Update failed', err);
    throw err;
  }
};

const updateById = async (Model, id, updateData, options = { new: true }) => {
  try {
    return await Model.findByIdAndUpdate(id, updateData, options);
  } catch (err) {
    console.error('UpdateById failed', err);
    throw err;
  }
};

const remove = async (Model, filter) => {
  try {
    return await Model.deleteOne(filter);
  } catch (err) {
    console.error('Delete failed', err);
    throw err;
  }
};

const removeById = async (Model, id) => {
  try {
    return await Model.findByIdAndDelete(id);
  } catch (err) {
    console.error('DeleteById failed', err);
    throw err;
  }
};

const createMany = async (Model, dataArray, schema) => {
  try {
    if (schema) {
      dataArray.forEach(data => validateSchema(data, schema));
    }
    return await Model.insertMany(dataArray);
  } catch (err) {
    console.error('Batch create failed', err);
    throw err;
  }
};

const upsert = async (Model, filter, data, options = { new: true, upsert: true }) => {
  try {
    return await Model.findOneAndUpdate(filter, data, options);
  } catch (err) {
    console.error('Upsert failed', err);
    throw err;
  }
};

const distinct = async (Model, field, filter = {}) => {
  try {
    return await Model.distinct(field, filter);
  } catch (err) {
    console.error('Distinct operation failed', err);
    throw err;
  }
};

const count = async (Model, filter = {}) => {
  try {
    return await Model.countDocuments(filter);
  } catch (err) {
    console.error('Count operation failed', err);
    throw err;
  }
};

const exists = async (Model, filter) => {
  try {
    return await Model.exists(filter);
  } catch (err) {
    console.error('Exists check failed', err);
    throw err;
  }
};

const findWithPagination = async (Model, {
  filter = {},
  projection = {},
  page = 1,
  limit = 10,
  sort = { _id: -1 }
}) => {
  try {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Model.find(filter, projection)
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Model.countDocuments(filter)
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (err) {
    console.error('Paginated find failed', err);
    throw err;
  }
};

const updateMany = async (Model, filter, updateData, options = {}) => {
  try {
    return await Model.updateMany(filter, updateData, options);
  } catch (err) {
    console.error('Batch update failed', err);
    throw err;
  }
};

const removeMany = async (Model, filter) => {
  try {
    return await Model.deleteMany(filter);
  } catch (err) {
    console.error('Batch delete failed', err);
    throw err;
  }
};

module.exports = {
  create: errorHandler(create),
  read: errorHandler(read),
  findOne: errorHandler(findOne),
  findById: errorHandler(findById),
  update: errorHandler(update),
  updateById: errorHandler(updateById),
  remove: errorHandler(remove),
  removeById: errorHandler(removeById),
  createMany: errorHandler(createMany),
  upsert: errorHandler(upsert),
  distinct: errorHandler(distinct),
  count: errorHandler(count),
  exists: errorHandler(exists),
  findWithPagination: errorHandler(findWithPagination),
  updateMany: errorHandler(updateMany),
  removeMany: errorHandler(removeMany)
}; 