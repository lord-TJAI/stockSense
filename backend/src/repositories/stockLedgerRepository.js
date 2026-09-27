'use strict';

const StockLedger = require('../models/StockLedger');
const BaseRepository = require('./BaseRepository');

class StockLedgerRepository extends BaseRepository {
  constructor(organizationId) {
    super(StockLedger, organizationId);
  }

  async listByType(docType, { skip = 0, limit = 20 } = {}) {
    this._requireTenantContext();
    const filter = this._scope({ docType });
    const [docs, total] = await Promise.all([
      StockLedger.find(filter)
        .populate('createdBy', 'name email')
        .populate('lines.productId', 'name sku unitOfMeasure')
        .populate('lines.fromLocationId', 'name code')
        .populate('lines.toLocationId', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      StockLedger.countDocuments(filter),
    ]);
    return { docs, total };
  }

  async listForProduct(productId, { skip = 0, limit = 20 } = {}) {
    this._requireTenantContext();
    const filter = this._scope({ 'lines.productId': productId });
    const [docs, total] = await Promise.all([
      StockLedger.find(filter)
        .populate('createdBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      StockLedger.countDocuments(filter),
    ]);
    return { docs, total };
  }

  async findByDocNumber(docNumber) {
    return this.findOne({ docNumber });
  }

  /** Create ledger entry — immutable, no update ever. */
  async createEntry(data, session = null) {
    this._requireTenantContext();
    const opts = session ? { session } : {};
    const [doc] = await StockLedger.create(
      [{ ...data, organizationId: this.organizationId }],
      opts
    );
    return doc;
  }
}

module.exports = StockLedgerRepository;
