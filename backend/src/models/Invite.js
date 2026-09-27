'use strict';

const mongoose = require('mongoose');

const inviteSchema = new mongoose.Schema(
  {
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    role: { type: String, enum: ['inventory_manager', 'warehouse_staff'], required: true },
    tokenHash: { type: String, required: true }, // SHA-256 hash of the plain token
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

inviteSchema.index({ organizationId: 1, email: 1 });
inviteSchema.index({ tokenHash: 1 });

module.exports = mongoose.model('Invite', inviteSchema);
