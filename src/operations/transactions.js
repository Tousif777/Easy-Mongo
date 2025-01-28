const mongoose = require('mongoose');
const { errorHandler } = require('../core/errors');

const withTransaction = async (callback) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const bulkWrite = async (Model, operations, options = {}) => {
  try {
    return await Model.bulkWrite(operations, options);
  } catch (error) {
    console.error('Bulk write failed', error);
    throw error;
  }
};

const atomicUpdate = async (Model, filter, update, options = { new: true }) => {
  try {
    return await Model.findOneAndUpdate(
      filter,
      [
        {
          $set: {
            ...update,
            lastModified: '$$NOW'
          }
        }
      ],
      { ...options, runValidators: true }
    );
  } catch (error) {
    console.error('Atomic update failed', error);
    throw error;
  }
};

const findOneAndExecute = async (Model, filter, callback, options = {}) => {
  return withTransaction(async (session) => {
    const doc = await Model.findOne(filter).session(session);
    if (!doc) {
      throw new Error('Document not found');
    }

    const result = await callback(doc, session);
    await doc.save({ session });
    return result;
  });
};

module.exports = {
  withTransaction: errorHandler(withTransaction),
  bulkWrite: errorHandler(bulkWrite),
  atomicUpdate: errorHandler(atomicUpdate),
  findOneAndExecute: errorHandler(findOneAndExecute)
}; 