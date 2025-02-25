/**
 * Document Versioning and Audit Trail for Easy-Mongo
 * Tracks changes to documents over time
 */

class VersioningManager {
  constructor(model, options = {}) {
    this.Model = model;
    this.options = options;
    
    // Get the model name to create a history collection
    this.modelName = this.Model.modelName;
    this.historyCollectionName = options.historyCollectionName || `${this.modelName}History`;
    
    // Create history schema and model if it doesn't exist
    this._createHistoryModel();
  }

  /**
   * Create a history model for storing document versions
   * @private
   */
  _createHistoryModel() {
    const mongoose = require('mongoose');
    
    // Check if model already exists
    if (mongoose.models[this.historyCollectionName]) {
      this.HistoryModel = mongoose.model(this.historyCollectionName);
      return;
    }
    
    // Create a schema for the history collection
    const historySchema = new mongoose.Schema({
      documentId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
      version: { type: Number, required: true },
      data: { type: mongoose.Schema.Types.Mixed, required: true },
      operation: { type: String, enum: ['create', 'update', 'delete'], required: true },
      changedBy: { type: String },
      changedAt: { type: Date, default: Date.now },
      changes: { type: mongoose.Schema.Types.Mixed }
    });
    
    // Create a compound index for documentId and version
    historySchema.index({ documentId: 1, version: 1 }, { unique: true });
    
    // Create the history model
    this.HistoryModel = mongoose.model(this.historyCollectionName, historySchema);
  }

  /**
   * Track document creation
   * @param {Object} document - The created document
   * @param {Object} options - Options including user info
   * @returns {Promise<Object>} - The history entry
   */
  async trackCreation(document, options = {}) {
    const historyEntry = new this.HistoryModel({
      documentId: document._id,
      version: 1,
      data: this._cleanDocument(document),
      operation: 'create',
      changedBy: options.user || 'system',
      changedAt: new Date(),
      changes: null // No changes for creation
    });
    
    return historyEntry.save();
  }

  /**
   * Track document update
   * @param {Object} oldDocument - Document before update
   * @param {Object} newDocument - Document after update
   * @param {Object} options - Options including user info
   * @returns {Promise<Object>} - The history entry
   */
  async trackUpdate(oldDocument, newDocument, options = {}) {
    // Get the latest version
    const latestVersion = await this._getLatestVersion(newDocument._id);
    const changes = this._detectChanges(oldDocument, newDocument);
    
    const historyEntry = new this.HistoryModel({
      documentId: newDocument._id,
      version: latestVersion + 1,
      data: this._cleanDocument(newDocument),
      operation: 'update',
      changedBy: options.user || 'system',
      changedAt: new Date(),
      changes
    });
    
    return historyEntry.save();
  }

  /**
   * Track document deletion
   * @param {Object} document - The deleted document
   * @param {Object} options - Options including user info
   * @returns {Promise<Object>} - The history entry
   */
  async trackDeletion(document, options = {}) {
    // Get the latest version
    const latestVersion = await this._getLatestVersion(document._id);
    
    const historyEntry = new this.HistoryModel({
      documentId: document._id,
      version: latestVersion + 1,
      data: this._cleanDocument(document),
      operation: 'delete',
      changedBy: options.user || 'system',
      changedAt: new Date(),
      changes: null // No changes for deletion
    });
    
    return historyEntry.save();
  }

  /**
   * Get document history
   * @param {string} documentId - Document ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} - History entries
   */
  async getHistory(documentId, options = {}) {
    const query = { documentId };
    const sort = options.sort || { version: -1 };
    const limit = options.limit || 0;
    
    return this.HistoryModel.find(query)
      .sort(sort)
      .limit(limit);
  }

  /**
   * Get a specific version of a document
   * @param {string} documentId - Document ID
   * @param {number} version - Version number
   * @returns {Promise<Object>} - Document at specified version
   */
  async getVersion(documentId, version) {
    const historyEntry = await this.HistoryModel.findOne({
      documentId,
      version
    });
    
    return historyEntry ? historyEntry.data : null;
  }

  /**
   * Revert document to a specific version
   * @param {string} documentId - Document ID
   * @param {number} version - Version to revert to
   * @param {Object} options - Options including user info
   * @returns {Promise<Object>} - Updated document
   */
  async revertToVersion(documentId, version, options = {}) {
    // Get the version to revert to
    const historyEntry = await this.HistoryModel.findOne({
      documentId,
      version
    });
    
    if (!historyEntry) {
      throw new Error(`Version ${version} not found for document ${documentId}`);
    }
    
    // Get the current document
    const currentDoc = await this.Model.findById(documentId);
    if (!currentDoc) {
      throw new Error(`Document ${documentId} not found`);
    }
    
    // Update the document with the historical data
    const versionData = historyEntry.data;
    
    // Remove MongoDB specific fields
    delete versionData._id;
    delete versionData.__v;
    
    // Update the document
    const updatedDoc = await this.Model.findByIdAndUpdate(
      documentId,
      versionData,
      { new: true }
    );
    
    // Track this reversion as an update
    await this.trackUpdate(currentDoc, updatedDoc, {
      ...options,
      user: options.user || 'system (revert)'
    });
    
    return updatedDoc;
  }

  /**
   * Get the latest version number for a document
   * @param {string} documentId - Document ID
   * @returns {Promise<number>} - Latest version number
   * @private
   */
  async _getLatestVersion(documentId) {
    const latest = await this.HistoryModel.findOne(
      { documentId },
      { version: 1 },
      { sort: { version: -1 } }
    );
    
    return latest ? latest.version : 0;
  }

  /**
   * Clean document for storage (remove mongoose internals)
   * @param {Object} doc - Document to clean
   * @returns {Object} - Cleaned document
   * @private
   */
  _cleanDocument(doc) {
    const cleanDoc = doc.toObject ? doc.toObject() : { ...doc };
    return cleanDoc;
  }

  /**
   * Detect changes between two document versions
   * @param {Object} oldDoc - Old document
   * @param {Object} newDoc - New document
   * @returns {Object} - Object containing changed fields
   * @private
   */
  _detectChanges(oldDoc, newDoc) {
    const changes = {};
    const oldObj = oldDoc.toObject ? oldDoc.toObject() : { ...oldDoc };
    const newObj = newDoc.toObject ? newDoc.toObject() : { ...newDoc };
    
    // Compare fields
    for (const key in newObj) {
      // Skip MongoDB internal fields
      if (key === '_id' || key === '__v') continue;
      
      // Check if value changed
      if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
        changes[key] = {
          from: oldObj[key],
          to: newObj[key]
        };
      }
    }
    
    // Check for deleted fields
    for (const key in oldObj) {
      if (key === '_id' || key === '__v') continue;
      
      if (newObj[key] === undefined) {
        changes[key] = {
          from: oldObj[key],
          to: undefined
        };
      }
    }
    
    return changes;
  }
}

module.exports = VersioningManager; 