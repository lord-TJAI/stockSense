'use strict';

const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');

/**
 * Sign a short-lived access token.
 * Payload carries only userId, organizationId, and role — no sensitive data.
 */
function signAccessToken(payload) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRY });
}

/**
 * Sign a refresh token — opaque random string stored hashed in the DB.
 */
function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

/**
 * Verify an access token. Throws if invalid or expired.
 */
function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET);
}

/**
 * Compute the refresh token expiry Date from the env string (e.g. '7d').
 */
function refreshTokenExpiryDate() {
  const raw = env.JWT_REFRESH_EXPIRY || '7d';
  const unit = raw.slice(-1);
  const amount = parseInt(raw.slice(0, -1), 10);
  const ms = unit === 'd' ? amount * 86400000 : unit === 'h' ? amount * 3600000 : amount * 60000;
  return new Date(Date.now() + ms);
}

module.exports = { signAccessToken, generateRefreshToken, verifyAccessToken, refreshTokenExpiryDate };
