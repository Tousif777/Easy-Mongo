const { errorHandler } = require('../core/errors');

const bulkCreate = async (Model, dataArray) => {
  try {
    return await Model.insertMany(dataArray);
  } catch (err) {
    console.error('Bulk create failed', err);
    throw err;
  }
};

const bulkUpdate = async (Model, filter, updateDataArray) => {
  try {
    const bulkOps = updateDataArray.map((updateData) => ({
      updateOne: {
        filter,
        update: updateData,
        upsert: false,
      },
    }));
    return await Model.bulkWrite(bulkOps);
  } catch (err) {
    console.error('Bulk update failed', err);
    throw err;
  }
};

module.exports = {
  bulkCreate: errorHandler(bulkCreate),
  bulkUpdate: errorHandler(bulkUpdate)
}; 