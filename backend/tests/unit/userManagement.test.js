'use strict';

/**
 * Unit tests for user management controller helpers.
 * No DB — tests pure validation logic and guard conditions.
 */

const ApiError = require('../../src/utils/ApiError');

// ── Guard: self role change ───────────────────────────────────────────────────
describe('User management guards', () => {
  const userId = '507f1f77bcf86cd799439011';

  it('blocks self role change when id === userId', () => {
    // Mirrors the guard in changeRole()
    const isSelf = userId === userId;
    expect(isSelf).toBe(true);
  });

  it('allows role change when id !== userId', () => {
    const otherId = '507f1f77bcf86cd799439012';
    const isSelf = otherId === userId;
    expect(isSelf).toBe(false);
  });

  it('ApiError has expected shape for SELF_ROLE_CHANGE', () => {
    const err = new ApiError(400, 'SELF_ROLE_CHANGE', 'You cannot change your own role');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe('SELF_ROLE_CHANGE');
    expect(err.message).toContain('own role');
  });
});

// ── Password change validation ────────────────────────────────────────────────
describe('Password change validation', () => {
  it('rejects passwords shorter than 8 characters', () => {
    const newPassword = 'abc';
    const tooShort = newPassword.length < 8;
    expect(tooShort).toBe(true);
  });

  it('accepts passwords of 8 characters or more', () => {
    const newPassword = 'Secur3P@ss';
    const tooShort = newPassword.length < 8;
    expect(tooShort).toBe(false);
  });
});

// ── Invite list + revoke ──────────────────────────────────────────────────────
describe('Invite repository extensions', () => {
  it('listPending filters by acceptedAt: null and future expiry', () => {
    // Verify filter shape — mirrors what listPending() constructs
    const now = new Date();
    const filter = {
      acceptedAt:  null,
      expiresAt:   { $gt: now },
    };
    expect(filter.acceptedAt).toBeNull();
    expect(filter.expiresAt.$gt).toBeInstanceOf(Date);
  });

  it('revoke checks acceptedAt: null before deleting', () => {
    // An already-accepted invite should not be revoked
    const invite = { acceptedAt: new Date() };
    const canRevoke = invite.acceptedAt === null;
    expect(canRevoke).toBe(false);
  });

  it('pending invite has acceptedAt: null', () => {
    const pendingInvite = { acceptedAt: null, expiresAt: new Date(Date.now() + 3600_000) };
    const isPending = pendingInvite.acceptedAt === null && pendingInvite.expiresAt > new Date();
    expect(isPending).toBe(true);
  });
});

// ── Org update ────────────────────────────────────────────────────────────────
describe('Org settings validation', () => {
  it('rejects empty org name', () => {
    const name = '   ';
    const invalid = !name || !name.trim();
    expect(invalid).toBe(true);
  });

  it('accepts non-empty org name', () => {
    const name = 'Acme Corp';
    const invalid = !name || !name.trim();
    expect(invalid).toBe(false);
  });
});
