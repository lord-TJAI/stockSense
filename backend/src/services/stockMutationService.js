'use strict';

const mongoose = require('mongoose');
const StockLevel = require('../models/StockLevel');
const counterRepo = require('../repositories/counterRepository');
const ApiError = require('../utils/ApiError');

/**
 * All four stock mutation operations.
 *
 * Atomicity strategy:
 * - Receipt / adjustment: single findOneAndUpdate per line — no session needed.
 * - Delivery: findOneAndUpdate with { quantity: { $gte: qty } } guard — atomic,
 *   rejects instantly if insufficient stock without ever going negative.
 * - Transfer: session-wrapped transaction debit+credit so a crash between the two
 *   writes never leaves stock in a split state.
 *
 * StockLevel.version is incremented on every write for forward-compatibility
 * but is NEVER consulted as a concurrency guard in MVP logic.
 */

// ── RECEIPT ───────────────────────────────────────────────────────────────────

/**
 * Receive goods into a location. Quantity only ever increases.
 * @param {object} params
 * @param {string} params.organizationId
 * @param {Array}  params.lines  [{ productId, toLocationId, quantity, unitCost? }]
 * @param {string} params.notes
 * @param {string} params.referenceDoc  PO number, etc.
 * @param {string} params.createdBy  userId
 * @param {object} params.ledgerRepo
 */
async function receiveStock({ organizationId, lines, notes, referenceDoc, createdBy, ledgerRepo }) {
  _validateLines(lines, ['productId', 'toLocationId', 'quantity']);

  const docNumber = await counterRepo.nextNumber('receipt', organizationId);

  // Increment stock for each line
  for (const line of lines) {
    await StockLevel.findOneAndUpdate(
      { organizationId, productId: line.productId, locationId: line.toLocationId },
      {
        $inc:          { quantity: line.quantity, version: 1 },
        $setOnInsert:  { organizationId, productId: line.productId, locationId: line.toLocationId },
      },
      { upsert: true, new: true }
    );
  }

  return ledgerRepo.createEntry({
    docType: 'receipt',
    docNumber,
    referenceDoc: referenceDoc || null,
    lines: lines.map((l) => ({
      productId:     l.productId,
      toLocationId:  l.toLocationId,
      quantity:      l.quantity,
      unitCost:      l.unitCost || null,
    })),
    notes: notes || '',
    createdBy,
  });
}

// ── DELIVERY ──────────────────────────────────────────────────────────────────

/**
 * Dispatch goods out of a location.
 * Uses { quantity: { $gte: qty } } atomic guard — quantity NEVER goes negative.
 * If any line has insufficient stock the entire operation is rejected and
 * no stock levels are mutated.
 */
async function deliverStock({ organizationId, lines, notes, referenceDoc, createdBy, ledgerRepo }) {
  _validateLines(lines, ['productId', 'fromLocationId', 'quantity']);

  // Pre-flight: check all lines have sufficient stock before mutating any
  for (const line of lines) {
    const sl = await StockLevel.findOne({
      organizationId,
      productId:  line.productId,
      locationId: line.fromLocationId,
    });
    const available = sl?.quantity || 0;
    if (available < line.quantity) {
    const Product = require('../models/Product');
    const prod = await Product.findById(line.productId).select('name sku');
    throw new ApiError(
      422,
      'INSUFFICIENT_STOCK',
      `Insufficient stock for ${prod?.name || line.productId}: available ${available}, requested ${line.quantity}`
    );
    }
  }

  const docNumber = await counterRepo.nextNumber('delivery', organizationId);

  // Atomic decrement — the $gte guard prevents negative stock
  for (const line of lines) {
    const updated = await StockLevel.findOneAndUpdate(
      {
        organizationId,
        productId:  line.productId,
        locationId: line.fromLocationId,
        quantity:   { $gte: line.quantity },   // ← THE atomic guard
      },
      { $inc: { quantity: -line.quantity, version: 1 } },
      { new: true }
    );
    if (!updated) {
      // Race condition: another write snuck in between preflight and update
      throw new ApiError(
        422,
        'STOCK_RACE',
        `Stock changed concurrently. Please retry the delivery.`
      );
    }
  }

  return ledgerRepo.createEntry({
    docType: 'delivery',
    docNumber,
    referenceDoc: referenceDoc || null,
    lines: lines.map((l) => ({
      productId:      l.productId,
      fromLocationId: l.fromLocationId,
      quantity:       l.quantity,
    })),
    notes: notes || '',
    createdBy,
  });
}

// ── TRANSFER ──────────────────────────────────────────────────────────────────

/**
 * Move stock between locations. Uses a Mongoose session so debit+credit are atomic.
 * If the session cannot be started (e.g. single-node dev), falls back to two sequential
 * writes with the same $gte guard (best-effort — documented in assumptions).
 */
async function transferStock({ organizationId, lines, notes, referenceDoc, createdBy, ledgerRepo }) {
  _validateLines(lines, ['productId', 'fromLocationId', 'toLocationId', 'quantity']);

  // Validate same-location transfers are rejected
  for (const line of lines) {
    if (String(line.fromLocationId) === String(line.toLocationId)) {
      throw new ApiError(400, 'SAME_LOCATION', 'Source and destination location must be different');
    }
  }

  const docNumber = await counterRepo.nextNumber('transfer', organizationId);

  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch {
    session = null; // Standalone dev mode — no transactions available
  }

  try {
    for (const line of lines) {
      // Debit source
      const opts = session ? { session, new: true } : { new: true };
      const debited = await StockLevel.findOneAndUpdate(
        {
          organizationId,
          productId:  line.productId,
          locationId: line.fromLocationId,
          quantity:   { $gte: line.quantity },
        },
        { $inc: { quantity: -line.quantity, version: 1 } },
        opts
      );
      if (!debited) {
        if (session) await session.abortTransaction();
        const Product = require('../models/Product');
        const prod = await Product.findById(line.productId).select('name sku');
        throw new ApiError(
          422,
          'INSUFFICIENT_STOCK',
          `Insufficient stock to transfer ${prod?.name || line.productId}`
        );
      }

      // Credit destination (upsert)
      await StockLevel.findOneAndUpdate(
        { organizationId, productId: line.productId, locationId: line.toLocationId },
        {
          $inc:         { quantity: line.quantity, version: 1 },
          $setOnInsert: { organizationId, productId: line.productId, locationId: line.toLocationId },
        },
        { upsert: true, new: true, ...(session ? { session } : {}) }
      );
    }

    const ledger = await ledgerRepo.createEntry(
      {
        docType: 'transfer',
        docNumber,
        referenceDoc: referenceDoc || null,
        lines: lines.map((l) => ({
          productId:      l.productId,
          fromLocationId: l.fromLocationId,
          toLocationId:   l.toLocationId,
          quantity:       l.quantity,
        })),
        notes: notes || '',
        createdBy,
      },
      session
    );

    if (session) await session.commitTransaction();
    return ledger;
  } catch (err) {
    if (session) {
      try { await session.abortTransaction(); } catch {}
    }
    throw err;
  } finally {
    if (session) session.endSession();
  }
}

// ── ADJUSTMENT ────────────────────────────────────────────────────────────────

/**
 * Set stock to an exact quantity (manager only).
 * Computes the implicit delta for the audit trail.
 */
async function adjustStock({ organizationId, lines, notes, createdBy, ledgerRepo }) {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new ApiError(400, 'NO_LINES', 'At least one line item is required');
  }
  // Check negative FIRST — must produce NEGATIVE_QTY, not the generic INVALID_QTY from _validateLines
  for (const line of lines) {
    if (Number(line.newQuantity) < 0) throw new ApiError(400, 'NEGATIVE_QTY', 'Adjusted quantity cannot be negative');
  }
  // Now validate required fields (newQuantity >= 0 is already guaranteed above)
  for (const line of lines) {
    if (!line.productId || !line.locationId) {
      throw new ApiError(400, 'MISSING_FIELD', 'Each adjustment line requires productId and locationId');
    }
    if (line.newQuantity === undefined || line.newQuantity === null || line.newQuantity === '') {
      throw new ApiError(400, 'MISSING_FIELD', "Each adjustment line requires 'newQuantity'");
    }
  }

  const docNumber = await counterRepo.nextNumber('adjustment', organizationId);

  const ledgerLines = [];
  for (const line of lines) {
    const existing = await StockLevel.findOne({
      organizationId,
      productId:  line.productId,
      locationId: line.locationId,
    });
    const prevQty = existing?.quantity ?? 0;
    const delta = line.newQuantity - prevQty;

    await StockLevel.findOneAndUpdate(
      { organizationId, productId: line.productId, locationId: line.locationId },
      {
        $set:         { quantity: line.newQuantity },
        $inc:         { version: 1 },
        $setOnInsert: { organizationId, productId: line.productId, locationId: line.locationId },
      },
      { upsert: true, new: true }
    );

    ledgerLines.push({
      productId:    line.productId,
      toLocationId: delta >= 0 ? line.locationId : null,
      fromLocationId: delta < 0 ? line.locationId : null,
      quantity: Math.abs(delta),      // ledger always records absolute delta
      unitCost: null,
    });
  }

  return ledgerRepo.createEntry({
    docType: 'adjustment',
    docNumber,
    lines: ledgerLines,
    notes: notes || '',
    createdBy,
  });
}

// ── Private helpers ───────────────────────────────────────────────────────────

function _validateLines(lines, required) {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new ApiError(400, 'NO_LINES', 'At least one line item is required');
  }
  for (const line of lines) {
    for (const field of required) {
      if (line[field] === undefined || line[field] === null || line[field] === '') {
        throw new ApiError(400, 'MISSING_FIELD', `Each line must have '${field}'`);
      }
    }
    const qtyField = required.includes('quantity') ? 'quantity' : 'newQuantity';
    const qty = Number(line[qtyField]);
    if (isNaN(qty) || qty <= 0) {
      throw new ApiError(400, 'INVALID_QTY', `'${qtyField}' must be a positive number`);
    }
  }
}

module.exports = { receiveStock, deliverStock, transferStock, adjustStock };
