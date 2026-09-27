'use strict';

/**
 * Unit tests for Phase 2 models and indexes.
 * Verifies that:
 * - StockLevel compound unique index (organizationId, productId, locationId) is defined
 * - Product compound unique index (organizationId, sku) is defined
 * These are schema-level checks (no DB connection needed).
 */

const StockLevel = require('../../src/models/StockLevel');
const Product = require('../../src/models/Product');
const Warehouse = require('../../src/models/Warehouse');

describe('StockLevel schema', () => {
  it('has a compound unique index on (organizationId, productId, locationId)', () => {
    const indexes = StockLevel.schema.indexes();
    const compoundUnique = indexes.find(([fields, opts]) =>
      fields.organizationId === 1 &&
      fields.productId === 1 &&
      fields.locationId === 1 &&
      opts.unique === true
    );
    expect(compoundUnique).toBeDefined();
  });

  it('has a version field (reserved for future optimistic locking)', () => {
    expect(StockLevel.schema.path('version')).toBeDefined();
  });
});

describe('Product schema', () => {
  it('has a compound unique index on (organizationId, sku)', () => {
    const indexes = Product.schema.indexes();
    const skuUnique = indexes.find(([fields, opts]) =>
      fields.organizationId === 1 &&
      fields.sku === 1 &&
      opts.unique === true
    );
    expect(skuUnique).toBeDefined();
  });
});

describe('Warehouse schema', () => {
  it('has a compound unique index on (organizationId, code)', () => {
    const indexes = Warehouse.schema.indexes();
    const codeUnique = indexes.find(([fields, opts]) =>
      fields.organizationId === 1 &&
      fields.code === 1 &&
      opts.unique === true
    );
    expect(codeUnique).toBeDefined();
  });
});
