'use strict';

const Category = require('../models/Category');
const BaseRepository = require('./BaseRepository');

class CategoryRepository extends BaseRepository {
  constructor(organizationId) {
    super(Category, organizationId);
  }

  async list({ skip = 0, limit = 100, search } = {}) {
    this._requireTenantContext();
    const filter = this._scope({ isActive: true });
    if (search) filter.name = { $regex: search, $options: 'i' };
    const [categories, total] = await Promise.all([
      Category.find(filter)
        .populate('parentCategory', 'name')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      Category.countDocuments(filter),
    ]);
    return { categories, total };
  }

  async deactivate(id) {
    return this.findOneAndUpdate({ _id: id }, { $set: { isActive: false } });
  }
}

module.exports = CategoryRepository;
