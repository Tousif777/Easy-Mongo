class QueryBuilder {
  constructor(Model) {
    this.Model = Model;
    this.query = this.Model.find();
  }

  where(conditions) {
    this.query = this.query.where(conditions);
    return this;
  }

  select(fields) {
    this.query = this.query.select(fields);
    return this;
  }

  sort(sortBy) {
    this.query = this.query.sort(sortBy);
    return this;
  }

  limit(num) {
    this.query = this.query.limit(num);
    return this;
  }

  skip(num) {
    this.query = this.query.skip(num);
    return this;
  }

  async execute() {
    return await this.query.exec();
  }
}

class LargeDatasetQueryBuilder extends QueryBuilder {
  constructor(Model) {
    super(Model);
    this.useStream = false;
    this.batchSize = 1000;
  }

  stream() {
    this.useStream = true;
    return this;
  }

  setBatchSize(size) {
    this.batchSize = size;
    return this;
  }

  async execute() {
    if (this.useStream) {
      return this.Model.find(this.query).cursor({ batchSize: this.batchSize });
    }
    return super.execute();
  }
}

module.exports = {
  QueryBuilder,
  LargeDatasetQueryBuilder
}; 