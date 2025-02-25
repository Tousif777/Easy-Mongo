/**
 * Soft Delete operations for Easy-Mongo
 * Allows marking documents as deleted without actually removing them from the database
 */

class SoftDeleteManager {
  constructor(model, options = {}) {
    this.Model = model;
    this.options = options;
    this.deletedField = options.deletedField || 'isDeleted';
    this.deletedAtField = options.deletedAtField || 'deletedAt';
  }

  /**
   * Soft delete a document by ID
   * @param {string} id - Document ID
   * @returns {Promise<Object>} - Updated document
   */
  async softDeleteById(id) {
    const updateData = {
      [this.deletedField]: true,
      [this.deletedAtField]: new Date()
    };
    
    return this.Model.findByIdAndUpdate(
      id, 
      updateData,
      { new: true }
    );
  }

  /**
   * Soft delete documents matching a filter
   * @param {Object} filter - MongoDB filter
   * @returns {Promise<Object>} - Update result
   */
  async softDelete(filter) {
    const updateData = {
      [this.deletedField]: true,
      [this.deletedAtField]: new Date()
    };
    
    return this.Model.updateMany(filter, updateData);
  }

  /**
   * Restore a soft-deleted document by ID
   * @param {string} id - Document ID
   * @returns {Promise<Object>} - Updated document
   */
  async restoreById(id) {
    const updateData = {
      [this.deletedField]: false,
      [this.deletedAtField]: null
    };
    
    return this.Model.findByIdAndUpdate(
      id, 
      updateData,
      { new: true }
    );
  }

  /**
   * Restore soft-deleted documents matching a filter
   * @param {Object} filter - MongoDB filter
   * @returns {Promise<Object>} - Update result
   */
  async restore(filter) {
    const updateData = {
      [this.deletedField]: false,
      [this.deletedAtField]: null
    };
    
    return this.Model.updateMany(filter, updateData);
  }

  /**
   * Find documents including soft-deleted ones
   * @param {Object} filter - MongoDB filter
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Documents
   */
  async findWithDeleted(filter = {}, options = {}) {
    return this.Model.find(filter, options);
  }

  /**
   * Find only soft-deleted documents
   * @param {Object} filter - MongoDB filter
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - Deleted documents
   */
  async findOnlyDeleted(filter = {}, options = {}) {
    const deletedFilter = {
      ...filter,
      [this.deletedField]: true
    };
    
    return this.Model.find(deletedFilter, options);
  }
}

module.exports = SoftDeleteManager; 