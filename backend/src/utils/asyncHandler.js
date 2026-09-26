'use strict';

/**
 * Wraps an async route handler so errors are forwarded to Express error middleware.
 * express-async-errors handles this globally, but this is kept for explicit use.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
