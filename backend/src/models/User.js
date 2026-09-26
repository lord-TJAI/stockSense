'use strict';

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    // null until they accept an invite or create their own org
    organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', default: null, index: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['inventory_manager', 'warehouse_staff'],
      default: 'inventory_manager',
    },
    avatarUrl: { type: String, default: null },
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    // OTP fields for email verification + password reset
    otpHash: { type: String, default: null },
    otpExpiresAt: { type: Date, default: null },
    otpFailedAttempts: { type: Number, default: 0 },
    otpLockedUntil: { type: Date, default: null },
    otpType: { type: String, enum: ['email_verification', 'password_reset'], default: null },

    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ organizationId: 1 });

module.exports = mongoose.model('User', userSchema);
