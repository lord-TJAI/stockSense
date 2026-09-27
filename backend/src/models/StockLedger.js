'use strict';

const mongoose = require('mongoose');

/**
 * Immutable audit ledger for every stock movement.
 * Once confirmed, a ledger doc is NEVER mutated — cancellation creates
 * a reversal entry with a negative qty.
 */
const lineSchema = new mongoose.Schema(
  {
    productId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    fromLocationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
    toLocationId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
    quantity:       { type: Number, required: true },   // always positive; direction implied by docType
    unitCost:       { type: Number, default: null },     // for receipts — optional
  },
  { _id: false }
);

const stockLedgerSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    docType:  { type: String, enum: ['receipt', 'delivery', 'transfer', 'adjustment'], required: true },
    docNumber: { type: String, required: true },
    referenceDoc: { type: String, default: null },  // external PO/SO/reference
    lines: { type: [lineSchema], required: true, validate: [(v) => v.length > 0, 'At least one line required'] },
    notes:    { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

stockLedgerSchema.index({ organizationId: 1, docType: 1, createdAt: -1 });
stockLedgerSchema.index({ organizationId: 1, docNumber: 1 }, { unique: true });
// For product-level stock history lookup
stockLedgerSchema.index({ organizationId: 1, 'lines.productId': 1, createdAt: -1 });

module.exports = mongoose.model('StockLedger', stockLedgerSchema);
