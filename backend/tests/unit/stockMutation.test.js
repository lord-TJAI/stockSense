'use strict';

/**
 * Unit tests for stock mutation service logic.
 * All Mongoose model calls are mocked — no DB connection required.
 */

jest.mock('../../src/models/StockLevel');
jest.mock('../../src/models/Product', () => ({
  findById: jest.fn().mockReturnValue({
    select: jest.fn().mockResolvedValue({ name: 'Test Product', sku: 'SKU001' }),
  }),
}));
jest.mock('../../src/repositories/counterRepository', () => ({
  nextNumber: jest.fn().mockResolvedValue('REC-00001'),
}));

const StockLevel = require('../../src/models/StockLevel');
const { receiveStock, deliverStock, transferStock, adjustStock } = require('../../src/services/stockMutationService');

const ORG  = '507f1f77bcf86cd799439011';
const PROD = '507f1f77bcf86cd799439012';
const LOC1 = '507f1f77bcf86cd799439013';
const LOC2 = '507f1f77bcf86cd799439014';
const USER = '507f1f77bcf86cd799439015';

const mockLedgerRepo = {
  organizationId: ORG,
  createEntry: jest.fn().mockResolvedValue({ docNumber: 'REC-00001', docType: 'receipt' }),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockLedgerRepo.createEntry.mockResolvedValue({ docNumber: 'ANY-00001' });
});

// ── RECEIPT ───────────────────────────────────────────────────────────────────
describe('receiveStock', () => {
  it('calls findOneAndUpdate with $inc and upsert for each line', async () => {
    StockLevel.findOneAndUpdate = jest.fn().mockResolvedValue({ quantity: 10 });

    await receiveStock({
      organizationId: ORG,
      lines: [{ productId: PROD, toLocationId: LOC1, quantity: 10 }],
      createdBy: USER,
      ledgerRepo: mockLedgerRepo,
    });

    expect(StockLevel.findOneAndUpdate).toHaveBeenCalledTimes(1);
    const [filter, update, opts] = StockLevel.findOneAndUpdate.mock.calls[0];
    expect(filter.organizationId).toBe(ORG);
    expect(update.$inc.quantity).toBe(10);
    expect(opts.upsert).toBe(true);
    expect(mockLedgerRepo.createEntry).toHaveBeenCalledWith(
      expect.objectContaining({ docType: 'receipt' })
    );
  });

  it('throws on missing toLocationId', async () => {
    await expect(
      receiveStock({
        organizationId: ORG,
        lines: [{ productId: PROD, quantity: 5 }], // no toLocationId
        createdBy: USER,
        ledgerRepo: mockLedgerRepo,
      })
    ).rejects.toThrow('toLocationId');
  });

  it('throws on zero quantity', async () => {
    await expect(
      receiveStock({
        organizationId: ORG,
        lines: [{ productId: PROD, toLocationId: LOC1, quantity: 0 }],
        createdBy: USER,
        ledgerRepo: mockLedgerRepo,
      })
    ).rejects.toMatchObject({ code: 'INVALID_QTY' });
  });
});

// ── DELIVERY ──────────────────────────────────────────────────────────────────
describe('deliverStock', () => {
  it('succeeds when stock is sufficient and uses $gte atomic guard', async () => {
    StockLevel.findOne = jest.fn().mockResolvedValue({ quantity: 50 });
    StockLevel.findOneAndUpdate = jest.fn().mockResolvedValue({ quantity: 40 });
    require('../../src/repositories/counterRepository').nextNumber.mockResolvedValue('DEL-00001');

    await deliverStock({
      organizationId: ORG,
      lines: [{ productId: PROD, fromLocationId: LOC1, quantity: 10 }],
      createdBy: USER,
      ledgerRepo: mockLedgerRepo,
    });

    const [filter, update] = StockLevel.findOneAndUpdate.mock.calls[0];
    // Must include $gte guard
    expect(filter.quantity).toEqual({ $gte: 10 });
    // Must decrement (negative $inc)
    expect(update.$inc.quantity).toBe(-10);
  });

  it('rejects with INSUFFICIENT_STOCK when pre-flight check fails', async () => {
    StockLevel.findOne = jest.fn().mockResolvedValue({ quantity: 3 });

    await expect(
      deliverStock({
        organizationId: ORG,
        lines: [{ productId: PROD, fromLocationId: LOC1, quantity: 10 }],
        createdBy: USER,
        ledgerRepo: mockLedgerRepo,
      })
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK' });

    // No stock levels should have been mutated
    expect(StockLevel.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('rejects with STOCK_RACE when atomic update returns null (concurrent write)', async () => {
    StockLevel.findOne = jest.fn().mockResolvedValue({ quantity: 50 });
    // Simulate another process took the stock between preflight and update
    StockLevel.findOneAndUpdate = jest.fn().mockResolvedValue(null);
    require('../../src/repositories/counterRepository').nextNumber.mockResolvedValue('DEL-00002');

    await expect(
      deliverStock({
        organizationId: ORG,
        lines: [{ productId: PROD, fromLocationId: LOC1, quantity: 10 }],
        createdBy: USER,
        ledgerRepo: mockLedgerRepo,
      })
    ).rejects.toMatchObject({ code: 'STOCK_RACE' });
  });
});

// ── TRANSFER ──────────────────────────────────────────────────────────────────
describe('transferStock', () => {
  it('rejects same-location transfers', async () => {
    await expect(
      transferStock({
        organizationId: ORG,
        lines: [{ productId: PROD, fromLocationId: LOC1, toLocationId: LOC1, quantity: 5 }],
        createdBy: USER,
        ledgerRepo: mockLedgerRepo,
      })
    ).rejects.toMatchObject({ code: 'SAME_LOCATION' });
  });
});

// ── ADJUSTMENT ────────────────────────────────────────────────────────────────
describe('adjustStock', () => {
  it('sets quantity to exact value using $set', async () => {
    StockLevel.findOne = jest.fn().mockResolvedValue({ quantity: 10 });
    StockLevel.findOneAndUpdate = jest.fn().mockResolvedValue({ quantity: 25 });
    require('../../src/repositories/counterRepository').nextNumber.mockResolvedValue('ADJ-00001');

    await adjustStock({
      organizationId: ORG,
      lines: [{ productId: PROD, locationId: LOC1, newQuantity: 25 }],
      createdBy: USER,
      ledgerRepo: mockLedgerRepo,
    });

    const [, update] = StockLevel.findOneAndUpdate.mock.calls[0];
    expect(update.$set.quantity).toBe(25);
  });

  it('rejects negative newQuantity', async () => {
    await expect(
      adjustStock({
        organizationId: ORG,
        lines: [{ productId: PROD, locationId: LOC1, newQuantity: -1 }],
        createdBy: USER,
        ledgerRepo: mockLedgerRepo,
      })
    ).rejects.toMatchObject({ code: 'NEGATIVE_QTY' });
  });
});
