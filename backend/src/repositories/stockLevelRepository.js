'use strict';

const StockLevel = require('../models/StockLevel');

/**
 * StockLevel repository — exposes ONLY safe operations.
 * All stock-decreasing mutations go through the atomic conditional
 * update in stockMutationService, not here.
 * This repo handles reads and the upsert used when a product is first
 * received into a location (creating the StockLevel doc at quantity 0).
 */
class StockLevelRepository {
  /**
   * Get or create a StockLevel record at quantity 0.
   * Safe to call multiple times — upsert is idempotent.
   */
  async getOrCreate(organizationId, productId, locationId, session = null) {
    const opts = { upsert: true, new: true, setDefaultsOnInsert: true };
    if (session) opts.session = session;
    return StockLevel.findOneAndUpdate(
      { organizationId, productId, locationId },
      { $setOnInsert: { organizationId, productId, locationId, quantity: 0, version: 0 } },
      opts
    );
  }

  async findForProduct(organizationId, productId) {
    return StockLevel.find({ organizationId, productId })
      .populate('locationId', 'name code warehouseId')
      .lean();
  }

  async findForLocation(organizationId, locationId) {
    return StockLevel.find({ organizationId, locationId })
      .populate('productId', 'name sku unitOfMeasure')
      .lean();
  }

  async totalForProduct(organizationId, productId) {
    const mongoose = require('mongoose');
    const res = await StockLevel.aggregate([
      {
        $match: {
          organizationId: new mongoose.Types.ObjectId(organizationId),
          productId: new mongoose.Types.ObjectId(productId),
        },
      },
      { $group: { _id: null, total: { $sum: '$quantity' } } },
    ]);
    return res[0]?.total || 0;
  }

  /** Dashboard KPI: total unique products with any stock. */
  async countInStock(organizationId) {
    return StockLevel.distinct('productId', { organizationId, quantity: { $gt: 0 } }).then(
      (ids) => ids.length
    );
  }

  /** Dashboard KPI: low-stock products (quantity > 0 but below reorderPoint). */
  async findLowStock(organizationId) {
    const mongoose = require('mongoose');
    return StockLevel.aggregate([
      { $match: { organizationId: new mongoose.Types.ObjectId(organizationId), quantity: { $gt: 0 } } },
      {
        $lookup: {
          from: 'products',
          localField: 'productId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: '$product' },
      { $match: { $expr: { $lte: ['$quantity', '$product.reorderPoint'] } } },
    ]);
  }
}

module.exports = new StockLevelRepository();
