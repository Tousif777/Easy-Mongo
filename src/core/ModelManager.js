const mongoose = require('mongoose');
const { ValidationError } = require('./errors');

class ModelManager {
    constructor(schema, options = {}) {
        this.schema = this._createSchema(schema);
        this.options = {
            collection: options.collection,
            timestamps: options.timestamps || true,
            strict: options.strict !== undefined ? options.strict : true,
            ...options
        };
    }

    _createSchema(schemaDefinition) {
        if (schemaDefinition instanceof mongoose.Schema) {
            return schemaDefinition;
        }
        return new mongoose.Schema(schemaDefinition, this.options);
    }

    createModel(modelName) {
        try {
            // Check if model already exists
            return mongoose.models[modelName] || 
                   mongoose.model(modelName, this.schema);
        } catch (error) {
            throw new ValidationError(`Failed to create model: ${error.message}`);
        }
    }

    addMethod(name, fn) {
        this.schema.methods[name] = fn;
        return this;
    }

    addStatic(name, fn) {
        this.schema.statics[name] = fn;
        return this;
    }

    addVirtual(name, options) {
        const virtual = this.schema.virtual(name);
        if (options.get) virtual.get(options.get);
        if (options.set) virtual.set(options.set);
        return this;
    }

    addIndex(fields, options = {}) {
        this.schema.index(fields, options);
        return this;
    }

    addValidator(path, validator, message) {
        this.schema.path(path).validate(validator, message);
        return this;
    }

    addMiddleware(type, action, fn) {
        this.schema[type](action, fn);
        return this;
    }

    addPlugin(plugin, options = {}) {
        this.schema.plugin(plugin, options);
        return this;
    }
}

module.exports = ModelManager; 