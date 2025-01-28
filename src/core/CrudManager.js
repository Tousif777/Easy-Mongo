const BaseMongoClient = require('./BaseMongoClient');
const CacheManager = require('./CacheManager');
const crud = require('../operations/crud');

class CrudManager extends BaseMongoClient {
  constructor(model, options = {}) {
    super(model, options);
    this.cacheManager = new CacheManager(model.modelName, options);
  }

  async create(data) {
    this._validateData(data);
    return this._executeWithMonitoring('create', () => crud.create(this.Model, data));
  }

  async createMany(dataArray) {
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      throw new Error('Data array is required and must not be empty');
    }
    return this._executeWithMonitoring('createMany', () => crud.createMany(this.Model, dataArray));
  }

  async findById(id, options = {}) {
    this._validateId(id);
    return this.cacheManager.read(
      `id:${id}`,
      () => this._executeWithMonitoring('findById', () => crud.findById(this.Model, id))
    );
  }

  async findOne(filter = {}, options = {}) {
    return this.cacheManager.read(
      `one:${JSON.stringify(filter)}`,
      () => this._executeWithMonitoring('findOne', () => crud.findOne(this.Model, filter))
    );
  }

  async find(filter = {}, options = {}) {
    const { 
      select, 
      sort, 
      skip, 
      limit,
      populate,
      useCache = this.cacheManager.isEnabled()
    } = options;

    const queryExecutor = async () => {
      let query = crud.read(this.Model, filter);
      if (select) query = query.select(select);
      if (sort) query = query.sort(sort);
      if (skip) query = query.skip(skip);
      if (limit) query = query.limit(limit);
      if (populate) query = query.populate(populate);
      return query;
    };

    if (useCache) {
      return this.cacheManager.read(
        `many:${JSON.stringify({filter, select, sort, skip, limit})}`,
        () => this._executeWithMonitoring('find', queryExecutor)
      );
    }

    return this._executeWithMonitoring('find', queryExecutor);
  }

  async update(filter, data) {
    this._validateData(data);
    const result = await this._executeWithMonitoring('update', 
      () => crud.update(this.Model, filter, data)
    );
    await this.cacheManager.clear();
    return result;
  }

  async updateById(id, data) {
    this._validateId(id);
    this._validateData(data);
    const result = await this._executeWithMonitoring('updateById', 
      () => crud.updateById(this.Model, id, data)
    );
    await this.cacheManager.clear(`id:${id}`);
    return result;
  }

  async delete(filter) {
    const result = await this._executeWithMonitoring('delete', 
      () => crud.remove(this.Model, filter)
    );
    await this.cacheManager.clear();
    return result;
  }

  async deleteById(id) {
    this._validateId(id);
    const result = await this._executeWithMonitoring('deleteById', 
      () => crud.removeById(this.Model, id)
    );
    await this.cacheManager.clear(`id:${id}`);
    return result;
  }
}

module.exports = CrudManager; 