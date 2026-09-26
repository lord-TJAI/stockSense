'use strict';

const Location = require('../models/Location');
const BaseRepository = require('./BaseRepository');

class LocationRepository extends BaseRepository {
  constructor(organizationId) {
    super(Location, organizationId);
  }

  async findByWarehouse(warehouseId) {
    return this.find({ warehouseId, isActive: true });
  }

  async deactivate(id) {
    return this.findOneAndUpdate({ _id: id }, { $set: { isActive: false } });
  }

  async listForWarehouse(warehouseId, { skip = 0, limit = 100 } = {}) {
    this._requireTenantContext();
    const filter = this._scope({ warehouseId, isActive: true });
    const [locations, total] = await Promise.all([
      Location.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
      Location.countDocuments(filter),
    ]);
    return { locations, total };
  }
}

module.exports = LocationRepository;
