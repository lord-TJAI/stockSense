'use strict';

const User = require('../models/User');
const BaseRepository = require('./BaseRepository');

class UserRepository extends BaseRepository {
  constructor(organizationId) {
    super(User, organizationId);
  }

  /** Global email lookup — not tenant-scoped (email is globally unique). */
  async findByEmailGlobal(email) {
    return User.findOne({ email });
  }

  async findByEmail(email) {
    return this.findOne({ email });
  }

  async findActiveById(id) {
    return this.findOne({ _id: id, isActive: true });
  }

  async deactivate(id) {
    return this.findOneAndUpdate({ _id: id }, { $set: { isActive: false } });
  }

  async setOtp(userId, otpHash, expiresAt, otpType) {
    return User.findByIdAndUpdate(
      userId,
      {
        $set: {
          otpHash,
          otpExpiresAt: expiresAt,
          otpType,
          otpFailedAttempts: 0,
          otpLockedUntil: null,
        },
      },
      { new: true }
    );
  }

  async clearOtp(userId) {
    return User.findByIdAndUpdate(
      userId,
      { $set: { otpHash: null, otpExpiresAt: null, otpType: null, otpFailedAttempts: 0 } },
      { new: true }
    );
  }

  async incrementOtpFailed(userId) {
    return User.findByIdAndUpdate(userId, { $inc: { otpFailedAttempts: 1 } }, { new: true });
  }

  async lockOtp(userId, lockedUntil) {
    return User.findByIdAndUpdate(
      userId,
      { $set: { otpLockedUntil: lockedUntil, otpFailedAttempts: 0 } },
      { new: true }
    );
  }

  async setEmailVerified(userId) {
    return User.findByIdAndUpdate(
      userId,
      { $set: { isEmailVerified: true, otpHash: null, otpExpiresAt: null, otpType: null } },
      { new: true }
    );
  }

  async updatePassword(userId, passwordHash) {
    return User.findByIdAndUpdate(userId, { $set: { passwordHash } }, { new: true });
  }

  async updateLastLogin(userId) {
    return User.findByIdAndUpdate(userId, { $set: { lastLoginAt: new Date() } });
  }

  async updateRole(id, role) {
    return this.findOneAndUpdate({ _id: id }, { $set: { role } });
  }

  /** Paginated list for manager view. */
  async list({ skip = 0, limit = 20, search } = {}) {
    this._requireTenantContext();
    const filter = this._scope({ isActive: true });
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    const [users, total] = await Promise.all([
      User.find(filter).skip(skip).limit(limit).select('-passwordHash -otpHash'),
      User.countDocuments(filter),
    ]);
    return { users, total };
  }
}

module.exports = UserRepository;
