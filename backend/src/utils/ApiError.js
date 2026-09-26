'use strict';

/**
 * Operational API error — caught by the global error handler.
 * code is a machine-readable string (e.g. 'INSUFFICIENT_STOCK').
 */
class ApiError extends Error {
  constructor(statusCode, code, message, errors = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
