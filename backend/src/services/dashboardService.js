'use strict';

const mongoose = require('mongoose');
const Product   = require('../models/Product');
const Warehouse = require('../models/Warehouse');
const Location  = require('../models/Location');
const StockLevel  = require('../models/StockLevel');
const StockLedger = require('../models/StockLedger');

/**
 * All aggregations scoped to a single organization.
 * These run in parallel where possible to minimise latency.
 */

// ── KPI Summary ────────────────────────────────────────────────────────────────

async function getKpiSummary(organizationId) {
  const orgId = new mongoose.Types.ObjectId(organizationId);

  const [
    totalProducts,
    totalWarehouses,
    totalLocations,
    stockAgg,
    recentMovements,
  ] = await Promise.all([
    // Active, non-deleted products
    Product.countDocuments({ organizationId, isDeleted: false, isActive: true }),

    // Active warehouses
    Warehouse.countDocuments({ organizationId, isActive: true }),

    // Active locations
    Location.countDocuments({ organizationId, isActive: true }),

    // Stock-level aggregation — one pass for in-stock / low-stock / out-of-stock
    StockLevel.aggregate([
      { $match: { organizationId: orgId } },
      // Sum all locations per product
      {
        $group: {
          _id: '$productId',
          totalQty: { $sum: '$quantity' },
        },
      },
      // Join product to get reorderPoint
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmpty: true } },
      // Only count active, non-deleted products
      { $match: { 'product.isDeleted': false, 'product.isActive': true } },
      {
        $group: {
          _id: null,
          inStock:  { $sum: { $cond: [{ $gt: ['$totalQty', 0] }, 1, 0] } },
          lowStock: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $gt:  ['$totalQty', 0] },
                    { $lte: ['$totalQty', { $ifNull: ['$product.reorderPoint', 0] }] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          outOfStock: { $sum: { $cond: [{ $eq: ['$totalQty', 0] }, 1, 0] } },
        },
      },
    ]),

    // Last 8 movements across all types
    StockLedger.find({ organizationId })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('createdBy', 'name')
      .populate('lines.productId', 'name sku')
      .lean(),
  ]);

  const agg = stockAgg[0] || { inStock: 0, lowStock: 0, outOfStock: 0 };

  return {
    totalProducts,
    totalWarehouses,
    totalLocations,
    inStock:    agg.inStock,
    lowStock:   agg.lowStock,
    outOfStock: agg.outOfStock,
    recentMovements,
  };
}

// ── Low-Stock Alert List ───────────────────────────────────────────────────────

async function getLowStockAlerts(organizationId, { skip = 0, limit = 20 } = {}) {
  const orgId = new mongoose.Types.ObjectId(organizationId);

  const pipeline = [
    { $match: { organizationId: orgId } },
    { $group: { _id: '$productId', totalQty: { $sum: '$quantity' }, locations: { $push: { locationId: '$locationId', qty: '$quantity' } } } },
    {
      $lookup: {
        from: 'products',
        localField: '_id',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    {
      $match: {
        'product.isDeleted': false,
        'product.isActive': true,
        $expr: {
          $and: [
            { $gt:  ['$totalQty', 0] },
            { $gt:  ['$product.reorderPoint', 0] },
            { $lte: ['$totalQty', '$product.reorderPoint'] },
          ],
        },
      },
    },
    { $sort: { totalQty: 1 } },
    {
      $facet: {
        data:  [{ $skip: skip }, { $limit: limit }],
        count: [{ $count: 'n' }],
      },
    },
  ];

  const [result] = await StockLevel.aggregate(pipeline);
  const alerts = (result?.data || []).map((r) => ({
    product: r.product,
    totalQty: r.totalQty,
    reorderPoint: r.product.reorderPoint,
    reorderQty:   r.product.reorderQty,
    deficit: r.product.reorderPoint - r.totalQty,
    locations: r.locations,
  }));

  return { alerts, total: result?.count[0]?.n || 0 };
}

// ── Out-of-Stock Alert List ────────────────────────────────────────────────────

async function getOutOfStockAlerts(organizationId, { skip = 0, limit = 20 } = {}) {
  const orgId = new mongoose.Types.ObjectId(organizationId);

  // Products with no StockLevel docs OR total qty = 0
  const pipeline = [
    // Start from all active products
    {
      $match: { organizationId: orgId, isDeleted: false, isActive: true },
    },
    {
      $lookup: {
        from: 'stocklevels',
        let:  { pid: '$_id', oid: orgId },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$productId', '$$pid'] },
                  { $eq: ['$organizationId', '$$oid'] },
                ],
              },
            },
          },
          { $group: { _id: null, totalQty: { $sum: '$quantity' } } },
        ],
        as: 'stockAgg',
      },
    },
    {
      $addFields: {
        totalQty: { $ifNull: [{ $arrayElemAt: ['$stockAgg.totalQty', 0] }, 0] },
      },
    },
    { $match: { totalQty: 0 } },
    { $sort: { name: 1 } },
    {
      $facet: {
        data:  [{ $skip: skip }, { $limit: limit }],
        count: [{ $count: 'n' }],
      },
    },
  ];

  const [result] = await Product.aggregate(pipeline);
  return {
    products: result?.data || [],
    total:    result?.count[0]?.n || 0,
  };
}

// ── Per-Product Stock Snapshot (for product detail page) ─────────────────────

async function getProductStockSnapshot(organizationId, productId) {
  const orgId = new mongoose.Types.ObjectId(organizationId);
  const pId   = new mongoose.Types.ObjectId(productId);

  const levels = await StockLevel.find({ organizationId: orgId, productId: pId })
    .populate({ path: 'locationId', select: 'name code', populate: { path: 'warehouseId', select: 'name code' } })
    .lean();

  const totalQty = levels.reduce((s, l) => s + l.quantity, 0);
  return { levels, totalQty };
}

module.exports = { getKpiSummary, getLowStockAlerts, getOutOfStockAlerts, getProductStockSnapshot };
