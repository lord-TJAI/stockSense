'use strict';

const Warehouse = require('../models/Warehouse');
const BaseRepository = require('./BaseRepository');

class WarehouseRepository extends BaseRepository {
  constructor(organizationId) {
    super(Warehouse, organizationId);
  }

  async findActive(filter = {}) {
    return this.find({ ...filter, isActive: true });
  }

  async findByCode(code) {
    return this.findOne({ code: code.toUpperCase() });
  }

  async deactivate(id) {
    return this.findOneAndUpdate({ _id: id }, { $set: { isActive: false } });
  }

  async list({ skip = 0, limit = 50, search } = {}) {
    this._requireTenantContext();
    const filter = this._scope({ isActive: true });
    if (search) filter.name = { $regex: search, $options: 'i' };
    const [warehouses, total] = await Promise.all([
      Warehouse.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      Warehouse.countDocuments(filter),
    ]);
    return { warehouses, total };
  }
}

module.exports = WarehouseRepository;
