class MongoError extends Error {
  constructor(message, code, details = {}) {
    super(message);
    this.name = 'MongoError';
    this.code = code;
    this.details = details;
  }
}

const errorHandler = (operation) => async (...args) => {
  try {
    return await operation(...args);
  } catch (error) {
    // Add stack trace and more details
    console.error(`Operation ${operation.name} failed:`, {
      error: error.message,
      stack: error.stack,
      args: JSON.stringify(args)
    });
    
    throw new MongoError(
      error.message,
      error.code || 'OPERATION_FAILED',
      { operation: operation.name, args }
    );
  }
};

module.exports = {
  MongoError,
  errorHandler
}; 