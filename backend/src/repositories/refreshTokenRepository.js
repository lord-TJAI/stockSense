'use strict';

const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');

/**
 * RefreshToken repository — scoped by userId, not organizationId.
 * Not a tenant-scoped BaseRepository; its own simple class.
 */
class RefreshTokenRepository {
  async create({ userId, plainToken, userAgent, ip, expiresAt }) {
    const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');
    return RefreshToken.create({ userId, tokenHash, userAgent, ip, expiresAt });
  }

  async findByToken(plainToken) {
    const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');
    return RefreshToken.findOne({ tokenHash, revokedAt: null, expiresAt: { $gt: new Date() } });
  }

  async revokeById(id) {
    return RefreshToken.findByIdAndUpdate(id, { $set: { revokedAt: new Date() } }, { new: true });
  }

  async revokeAllForUser(userId, exceptId = null) {
    const filter = { userId, revokedAt: null };
    if (exceptId) filter._id = { $ne: exceptId };
    return RefreshToken.updateMany(filter, { $set: { revokedAt: new Date() } });
  }

  async listActiveByUser(userId) {
    return RefreshToken.find({ userId, revokedAt: null, expiresAt: { $gt: new Date() } }).sort({
      createdAt: -1,
    });
  }
}

module.exports = new RefreshTokenRepository();
