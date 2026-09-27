'use strict';

const crypto = require('crypto');
const Invite = require('../models/Invite');
const BaseRepository = require('./BaseRepository');

class InviteRepository extends BaseRepository {
  constructor(organizationId) {
    super(Invite, organizationId);
  }

  /** Find an invite by the raw token (hashes it first). */
  async findByToken(plainToken) {
    const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');
    return Invite.findOne({ tokenHash });
  }

  async findPendingByEmail(email) {
    return this.findOne({ email, acceptedAt: null, expiresAt: { $gt: new Date() } });
  }

  async markAccepted(inviteId) {
    return Invite.findByIdAndUpdate(inviteId, { $set: { acceptedAt: new Date() } }, { new: true });
  }

  /** Create invite — stores hash, returns the plain token so it can be emailed. */
  async createInvite({ email, role, invitedBy, expiresAt }) {
    this._requireTenantContext();
    const plainToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');
    await Invite.create({
      organizationId: this.organizationId,
      email,
      role,
      tokenHash,
      invitedBy,
      expiresAt,
    });
    return plainToken; // caller emails this to the invitee
  }
}

module.exports = InviteRepository;
