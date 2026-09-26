'use strict';

const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    parentLocationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

locationSchema.index({ organizationId: 1, warehouseId: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Location', locationSchema);
