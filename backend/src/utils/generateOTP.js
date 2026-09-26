'use strict';

const crypto = require('crypto');

/**
 * Generate a 6-digit numeric OTP.
 */
function generateOTP() {
  // crypto-safe: generate a random number in [0, 999999] and zero-pad
  const otp = crypto.randomInt(0, 1000000);
  return String(otp).padStart(6, '0');
}

module.exports = { generateOTP };
