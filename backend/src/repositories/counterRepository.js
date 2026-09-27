'use strict';

const Counter = require('../models/Counter');

/**
 * Counter repository — uses atomic findOneAndUpdate($inc) to generate
 * sequential document numbers per (docType, organizationId).
 * Always called inside the same transaction as the document insert.
 */
class CounterRepository {
  /**
   * Get next sequence number. Prefix format: "PREFIX-00001"
   * @param {string} docType  e.g. 'receipt', 'delivery', 'transfer', 'adjustment'
   * @param {string} organizationId
   * @param {object} session  Mongoose session for the enclosing transaction
   * @returns {string}  formatted document number
   */
  async nextNumber(docType, organizationId, session = null) {
    const key = `${docType}:${organizationId}`;
    const prefix = docType.toUpperCase().slice(0, 3); // e.g. REC, DEL, TRF, ADJ
    const opts = { upsert: true, new: true, ...(session ? { session } : {}) };
    const counter = await Counter.findOneAndUpdate(
      { _id: key },
      { $inc: { seq: 1 } },
      opts
    );
    const padded = String(counter.seq).padStart(5, '0');
    return `${prefix}-${padded}`;
  }
}

module.exports = new CounterRepository();
