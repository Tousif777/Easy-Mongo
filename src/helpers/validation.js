const Joi = require('joi');

const validateSchema = (data, schema) => {
  if (!schema) return data;
  
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    throw new Error(`Validation error: ${error.details.map(x => x.message).join(', ')}`);
  }

  return value;
};

// Common schema validators
const commonSchemas = {
  objectId: Joi.string().pattern(/^[0-9a-fA-F]{24}$/),
  email: Joi.string().email(),
  password: Joi.string().min(6),
  timestamp: Joi.date(),
};

module.exports = {
  validateSchema,
  commonSchemas,
}; 