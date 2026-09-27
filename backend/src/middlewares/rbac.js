'use strict';

const ApiError = require('../utils/ApiError');

/**
 * RBAC middleware factory.
 * Usage: requireRole('inventory_manager') or requireRole(['inventory_manager', 'warehouse_staff'])
 * Must run after verifyJWT + tenantScope (needs req.user.role from DB-refreshed tenantScope).
 */
function requireRole(...roles) {
  const allowed = roles.flat();
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'UNAUTHORIZED', 'Not authenticated'));
    }
    if (!allowed.includes(req.user.role)) {
      return next(
        new ApiError(
          403,
          'FORBIDDEN',
          `This action requires one of the following roles: ${allowed.join(', ')}`
        )
      );
    }
    next();
  };
}

module.exports = { requireRole };
