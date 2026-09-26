'use strict';

const Product = require('../models/Product');
const StockLevel = require('../models/StockLevel');
const BaseRepository = require('./BaseRepository');

class ProductRepository extends BaseRepository {
  constructor(organizationId) {
    super(Product, organizationId);
  }

  async list({ skip = 0, limit = 20, search, categoryId, isActive = true } = {}) {
    this._requireTenantContext();
    const filter = this._scope({ isDeleted: false });
    if (isActive !== undefined) filter.isActive = isActive;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }
    if (categoryId) filter.categoryId = categoryId;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('categoryId', 'name')
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);
    return { products, total };
  }

  async findBySku(sku) {
    return this.findOne({ sku: sku.toUpperCase(), isDeleted: false });
  }

  async softDelete(id) {
    return this.findOneAndUpdate(
      { _id: id },
      { $set: { isDeleted: true, isActive: false, deletedAt: new Date() } }
    );
  }

  async getStockSummary(productId) {
    this._requireTenantContext();
    return StockLevel.find({ organizationId: this.organizationId, productId })
      .populate('locationId', 'name code')
      .populate({ path: 'locationId', populate: { path: 'warehouseId', select: 'name code' } });
  }

  async totalStock(productId) {
    this._requireTenantContext();
    const result = await StockLevel.aggregate([
      { $match: { organizationId: new (require('mongoose').Types.ObjectId)(this.organizationId), productId: new (require('mongoose').Types.ObjectId)(productId) } },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]);
    return result[0]?.total || 0;
  }
}

module.exports = ProductRepository;
