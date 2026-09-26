'use strict';

/**
 * Unit test: BaseRepository must throw when called without an organizationId.
 * This is the test mandated by Section 3 of the spec.
 */

const BaseRepository = require('../../src/repositories/BaseRepository');

// Minimal Mongoose-like mock model
const MockModel = {
  modelName: 'MockModel',
  find: jest.fn(),
  findOne: jest.fn(),
  findOneAndUpdate: jest.fn(),
  countDocuments: jest.fn(),
};

describe('BaseRepository — tenant isolation', () => {
  it('throws when find() is called without organizationId', () => {
    const repo = new BaseRepository(MockModel, null);
    expect(() => repo._scope()).toThrow('[TenantScope]');
  });

  it('throws when findOne() is called without organizationId', async () => {
    const repo = new BaseRepository(MockModel, undefined);
    await expect(repo.findOne({})).rejects.toThrow('[TenantScope]');
  });

  it('throws when create() is called without organizationId', async () => {
    const repo = new BaseRepository(MockModel, '');
    await expect(repo.create({ name: 'test' })).rejects.toThrow('[TenantScope]');
  });

  it('does NOT throw and injects organizationId when context is provided', () => {
    const orgId = '507f1f77bcf86cd799439011';
    const repo = new BaseRepository(MockModel, orgId);
    const filter = repo._scope({ status: 'active' });
    expect(filter.organizationId).toBe(orgId);
    expect(filter.status).toBe('active');
  });

  it('_scope overwrites any caller-supplied organizationId with the trusted context value', () => {
    const orgId = '507f1f77bcf86cd799439011';
    const repo = new BaseRepository(MockModel, orgId);
    // Even if caller tries to pass a different organizationId, _scope spreads it first
    // then overwrites with the constructor's orgId — the trusted value always wins.
    const filter = repo._scope({ organizationId: 'attacker-org-id', status: 'done' });
    expect(filter.organizationId).toBe(orgId); // constructor orgId wins
    expect(filter.status).toBe('done');
  });
});
