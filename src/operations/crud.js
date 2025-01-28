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

// ... other CRUD operations

module.exports = {
  create: errorHandler(create),
  read: errorHandler(read),
  // ... export other operations
}; 