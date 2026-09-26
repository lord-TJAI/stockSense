'use strict';

const UserRepository = require('../repositories/userRepository');
const InviteRepository = require('../repositories/inviteRepository');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

/**
 * tenantScope middleware:
 * 1. Verifies the user is still active and their role hasn't changed in the DB
 *    (so role changes take effect on the very next request, without re-login).
 * 2. Builds req.repos — a collection of tenant-scoped repository instances
 *    that automatically inject organizationId on every query.
 *
 * Must run after verifyJWT (needs req.user).
 */
async function tenantScope(req, res, next) {
  try {
    const { userId, organizationId } = req.user;

    // Re-read user from DB on each request to catch deactivation + role changes immediately
    const dbUser = await User.findById(userId).select('isActive role organizationId');
    if (!dbUser || !dbUser.isActive) {
      return next(new ApiError(401, 'ACCOUNT_INACTIVE', 'This account has been deactivated'));
    }

    // Overwrite token role with the DB role (role changes are immediate)
    req.user.role = dbUser.role;
    req.user.organizationId = dbUser.organizationId?.toString() || organizationId;

    const orgId = req.user.organizationId;

    // Build tenant-scoped repositories
    req.repos = {
      users: new UserRepository(orgId),
      invites: new InviteRepository(orgId),
      // Additional repos added in later phases (products, warehouses, etc.)
    };

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { tenantScope };
