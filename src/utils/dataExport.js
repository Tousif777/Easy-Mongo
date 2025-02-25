/**
 * Data Export/Import Utilities for Easy-Mongo
 * Provides functionality to export and import data in various formats
 */

const fs = require('fs');
const path = require('path');
const { Transform } = require('stream');

class DataExportManager {
  constructor(model, options = {}) {
    this.Model = model;
    this.options = options;
  }

  /**
   * Export data to JSON file
   * @param {Object} filter - MongoDB filter
   * @param {string} filePath - Path to save the file
   * @param {Object} options - Export options
   * @returns {Promise<Object>} - Export result
   */
  async exportToJson(filter = {}, filePath, options = {}) {
    const projection = options.projection || {};
    const sort = options.sort || {};
    const limit = options.limit || 0;
    
    // Get data
    const data = await this.Model.find(filter, projection)
      .sort(sort)
      .limit(limit)
      .lean();
    
    // Create directory if it doesn't exist
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write to file
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    
    return {
      success: true,
      count: data.length,
      filePath
    };
  }

  /**
   * Export data to CSV file
   * @param {Object} filter - MongoDB filter
   * @param {string} filePath - Path to save the file
   * @param {Object} options - Export options
   * @returns {Promise<Object>} - Export result
   */
  async exportToCsv(filter = {}, filePath, options = {}) {
    const projection = options.projection || {};
    const sort = options.sort || {};
    const limit = options.limit || 0;
    const fields = options.fields || [];
    
    // Get data
    const data = await this.Model.find(filter, projection)
      .sort(sort)
      .limit(limit)
      .lean();
    
    // Create directory if it doesn't exist
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Determine fields if not provided
    const csvFields = fields.length > 0 
      ? fields 
      : data.length > 0 
        ? Object.keys(data[0]).filter(key => key !== '_id' && key !== '__v') 
        : [];
    
    // Create CSV header
    const header = csvFields.join(',') + '\n';
    
    // Create CSV content
    const rows = data.map(item => {
      return csvFields.map(field => {
        const value = this._getNestedValue(item, field);
        return this._formatCsvValue(value);
      }).join(',');
    }).join('\n');
    
    // Write to file
    fs.writeFileSync(filePath, header + rows);
    
    return {
      success: true,
      count: data.length,
      filePath
    };
  }

  /**
   * Export large dataset to JSON file using streaming
   * @param {Object} filter - MongoDB filter
   * @param {string} filePath - Path to save the file
   * @param {Object} options - Export options
   * @returns {Promise<Object>} - Export result
   */
  async exportLargeDatasetToJson(filter = {}, filePath, options = {}) {
    const projection = options.projection || {};
    const sort = options.sort || {};
    const batchSize = options.batchSize || 1000;
    
    // Create directory if it doesn't exist
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Create write stream
    const writeStream = fs.createWriteStream(filePath);
    
    // Create cursor
    const cursor = this.Model.find(filter, projection)
      .sort(sort)
      .cursor({ batchSize });
    
    // Write opening bracket
    writeStream.write('[\n');
    
    let count = 0;
    let isFirst = true;
    
    // Process documents
    for await (const doc of cursor) {
      const docJson = JSON.stringify(doc.toObject ? doc.toObject() : doc);
      
      // Add comma for all but the first document
      if (!isFirst) {
        writeStream.write(',\n');
      } else {
        isFirst = false;
      }
      
      writeStream.write(docJson);
      count++;
    }
    
    // Write closing bracket
    writeStream.write('\n]');
    
    // Close the stream
    writeStream.end();
    
    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => {
        resolve({
          success: true,
          count,
          filePath
        });
      });
      
      writeStream.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Import data from JSON file
   * @param {string} filePath - Path to the JSON file
   * @param {Object} options - Import options
   * @returns {Promise<Object>} - Import result
   */
  async importFromJson(filePath, options = {}) {
    const replace = options.replace || false;
    const upsert = options.upsert || false;
    const idField = options.idField || '_id';
    
    // Read file
    const fileData = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileData);
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid JSON format. Expected an array of objects.');
    }
    
    let inserted = 0;
    let updated = 0;
    let errors = 0;
    
    // Clear collection if replace is true
    if (replace) {
      await this.Model.deleteMany({});
    }
    
    // Process data
    for (const item of data) {
      try {
        if (upsert && item[idField]) {
          // Try to update existing document
          const filter = { [idField]: item[idField] };
          const result = await this.Model.updateOne(filter, item, { upsert: true });
          
          if (result.upsertedCount > 0) {
            inserted++;
          } else if (result.modifiedCount > 0) {
            updated++;
          }
        } else {
          // Insert new document
          await this.Model.create(item);
          inserted++;
        }
      } catch (err) {
        errors++;
        console.error(`Error importing document: ${err.message}`);
      }
    }
    
    return {
      success: true,
      inserted,
      updated,
      errors,
      total: data.length
    };
  }

  /**
   * Import data from CSV file
   * @param {string} filePath - Path to the CSV file
   * @param {Object} options - Import options
   * @returns {Promise<Object>} - Import result
   */
  async importFromCsv(filePath, options = {}) {
    const replace = options.replace || false;
    const upsert = options.upsert || false;
    const idField = options.idField || '_id';
    const fieldTypes = options.fieldTypes || {};
    
    // Read file
    const fileData = fs.readFileSync(filePath, 'utf8');
    const lines = fileData.split('\n').filter(line => line.trim());
    
    // Parse header
    const header = lines[0].split(',').map(field => field.trim());
    
    // Parse data
    const data = lines.slice(1).map(line => {
      const values = this._parseCsvLine(line);
      const item = {};
      
      header.forEach((field, index) => {
        if (index < values.length) {
          item[field] = this._convertFieldType(values[index], fieldTypes[field]);
        }
      });
      
      return item;
    });
    
    let inserted = 0;
    let updated = 0;
    let errors = 0;
    
    // Clear collection if replace is true
    if (replace) {
      await this.Model.deleteMany({});
    }
    
    // Process data
    for (const item of data) {
      try {
        if (upsert && item[idField]) {
          // Try to update existing document
          const filter = { [idField]: item[idField] };
          const result = await this.Model.updateOne(filter, item, { upsert: true });
          
          if (result.upsertedCount > 0) {
            inserted++;
          } else if (result.modifiedCount > 0) {
            updated++;
          }
        } else {
          // Insert new document
          await this.Model.create(item);
          inserted++;
        }
      } catch (err) {
        errors++;
        console.error(`Error importing document: ${err.message}`);
      }
    }
    
    return {
      success: true,
      inserted,
      updated,
      errors,
      total: data.length
    };
  }

  /**
   * Format a value for CSV
   * @param {any} value - Value to format
   * @returns {string} - Formatted value
   * @private
   */
  _formatCsvValue(value) {
    if (value === null || value === undefined) {
      return '';
    }
    
    if (typeof value === 'object') {
      value = JSON.stringify(value);
    }
    
    value = String(value);
    
    // Escape quotes and wrap in quotes if contains comma, quote or newline
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      value = value.replace(/"/g, '""');
      value = `"${value}"`;
    }
    
    return value;
  }

  /**
   * Parse a CSV line respecting quoted values
   * @param {string} line - CSV line
   * @returns {Array} - Array of values
   * @private
   */
  _parseCsvLine(line) {
    const values = [];
    let currentValue = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          // Escaped quote
          currentValue += '"';
          i++;
        } else {
          // Toggle quotes
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of value
        values.push(currentValue);
        currentValue = '';
      } else {
        // Add character to current value
        currentValue += char;
      }
    }
    
    // Add the last value
    values.push(currentValue);
    
    return values;
  }

  /**
   * Convert field value to the specified type
   * @param {string} value - Value to convert
   * @param {string} type - Type to convert to
   * @returns {any} - Converted value
   * @private
   */
  _convertFieldType(value, type) {
    if (value === '' || value === undefined) {
      return null;
    }
    
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value.toLowerCase() === 'true';
      case 'date':
        return new Date(value);
      case 'object':
        try {
          return JSON.parse(value);
        } catch (e) {
          return value;
        }
      default:
        return value;
    }
  }

  /**
   * Get nested value from an object using dot notation
   * @param {Object} obj - Object to get value from
   * @param {string} path - Path to the value using dot notation
   * @returns {any} - Value at the path
   * @private
   */
  _getNestedValue(obj, path) {
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
      if (value === null || value === undefined || typeof value !== 'object') {
        return undefined;
      }
      
      value = value[key];
    }
    
    return value;
  }
}

module.exports = DataExportManager; 