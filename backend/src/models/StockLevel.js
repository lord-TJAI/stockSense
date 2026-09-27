'use strict';

const mongoose = require('mongoose');

const stockLevelSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
    quantity: { type: Number, default: 0, min: 0 },
    // version: reserved for future optimistic-locking enhancement.
    // NOT consulted in MVP logic — correctness comes from the $gte atomic conditional.
    // Increment on every write for forward-compatibility only.
    version: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Compound unique index — tenant isolation is a DATABASE constraint, not just app logic.
// This makes it impossible for two stock records with the same (org, product, location)
// to exist, even if application code were to attempt it.
stockLevelSchema.index(
  { organizationId: 1, productId: 1, locationId: 1 },
  { unique: true }
);

module.exports = mongoose.model('StockLevel', stockLevelSchema);
