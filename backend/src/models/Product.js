'use strict';

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    unitOfMeasure: { type: String, required: true, default: 'pcs', trim: true },
    reorderPoint: { type: Number, default: 0, min: 0 },
    reorderQty: { type: Number, default: 0, min: 0 },
    imageUrl: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Compound unique index — tenant-isolated SKU uniqueness enforced at DB level
productSchema.index({ organizationId: 1, sku: 1 }, { unique: true });

module.exports = mongoose.model('Product', productSchema);
