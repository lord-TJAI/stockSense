'use strict';

const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const env = require('../config/env');

/**
 * Extracts and verifies the JWT access token from the Authorization header.
 * Attaches { userId, organizationId, role } to req.user.
 * Role is always re-read from the token — role changes in the DB take effect
 * on the user's next login (new token). For immediate effect after role changes,
 * the service layer also checks the DB on protected routes.
 */
async function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'UNAUTHORIZED', 'Authentication token is required'));
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.user = {
      userId: decoded.userId,
      organizationId: decoded.organizationId,
      role: decoded.role,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'TOKEN_EXPIRED', 'Access token has expired'));
    }
    return next(new ApiError(401, 'INVALID_TOKEN', 'Invalid authentication token'));
  }
}

module.exports = { verifyJWT };
