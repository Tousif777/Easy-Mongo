/**
 * Enhanced Schema Validation for Easy-Mongo
 * Provides advanced validation beyond Mongoose's built-in validation
 */

const Joi = require('joi');

class SchemaValidator {
  constructor(options = {}) {
    this.options = options;
    this.schemas = new Map();
  }

  /**
   * Define a validation schema for a model
   * @param {string} modelName - Name of the model
   * @param {Object} schema - Joi schema object
   */
  defineSchema(modelName, schema) {
    if (!Joi.isSchema(schema)) {
      throw new Error('Schema must be a valid Joi schema');
    }
    
    this.schemas.set(modelName, schema);
  }

  /**
   * Validate data against a schema
   * @param {string} modelName - Name of the model
   * @param {Object} data - Data to validate
   * @param {Object} options - Validation options
   * @returns {Object} - Validated data
   */
  validate(modelName, data, options = {}) {
    const schema = this.schemas.get(modelName);
    
    if (!schema) {
      throw new Error(`No schema defined for model: ${modelName}`);
    }
    
    const validationOptions = {
      abortEarly: false,
      stripUnknown: true,
      ...this.options,
      ...options
    };
    
    const { error, value } = schema.validate(data, validationOptions);
    
    if (error) {
      const formattedError = this._formatValidationError(error);
      throw formattedError;
    }
    
    return value;
  }

  /**
   * Validate data against a schema asynchronously
   * @param {string} modelName - Name of the model
   * @param {Object} data - Data to validate
   * @param {Object} options - Validation options
   * @returns {Promise<Object>} - Validated data
   */
  async validateAsync(modelName, data, options = {}) {
    const schema = this.schemas.get(modelName);
    
    if (!schema) {
      throw new Error(`No schema defined for model: ${modelName}`);
    }
    
    const validationOptions = {
      abortEarly: false,
      stripUnknown: true,
      ...this.options,
      ...options
    };
    
    try {
      const value = await schema.validateAsync(data, validationOptions);
      return value;
    } catch (error) {
      const formattedError = this._formatValidationError(error);
      throw formattedError;
    }
  }

  /**
   * Create a middleware for Express to validate request body
   * @param {string} modelName - Name of the model
   * @param {Object} options - Validation options
   * @returns {Function} - Express middleware
   */
  createMiddleware(modelName, options = {}) {
    return async (req, res, next) => {
      try {
        const validated = await this.validateAsync(modelName, req.body, options);
        req.body = validated;
        next();
      } catch (error) {
        res.status(400).json({
          error: 'Validation Error',
          details: error.details
        });
      }
    };
  }

  /**
   * Format validation error for better readability
   * @param {Object} error - Joi validation error
   * @returns {Object} - Formatted error
   * @private
   */
  _formatValidationError(error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      type: detail.type
    }));
    
    const formattedError = new Error('Validation Error');
    formattedError.details = details;
    formattedError.name = 'ValidationError';
    
    return formattedError;
  }

  /**
   * Create common validation schemas
   * @returns {Object} - Object containing common schemas
   */
  static createCommonSchemas() {
    return {
      objectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
      email: Joi.string().email(),
      password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/),
      phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
      url: Joi.string().uri(),
      date: Joi.date(),
      boolean: Joi.boolean(),
      number: Joi.number(),
      positiveNumber: Joi.number().positive(),
      integer: Joi.number().integer(),
      array: Joi.array(),
      nonEmptyArray: Joi.array().min(1),
      object: Joi.object(),
      nonEmptyString: Joi.string().min(1),
      uuid: Joi.string().uuid(),
      coordinates: Joi.object({
        lat: Joi.number().min(-90).max(90).required(),
        lng: Joi.number().min(-180).max(180).required()
      })
    };
  }
}

module.exports = SchemaValidator; 