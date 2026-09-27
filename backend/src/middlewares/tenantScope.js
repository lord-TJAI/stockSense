'use strict';

const UserRepository = require('../repositories/userRepository');
const InviteRepository = require('../repositories/inviteRepository');
const WarehouseRepository = require('../repositories/warehouseRepository');
const LocationRepository = require('../repositories/locationRepository');
const CategoryRepository = require('../repositories/categoryRepository');
const ProductRepository = require('../repositories/productRepository');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');

/**
 * tenantScope middleware:
 * 1. Re-reads user from DB on every request — role changes and deactivation
 *    take effect immediately without requiring re-login.
 * 2. Builds req.repos — tenant-scoped repository instances that automatically
 *    inject organizationId into every query.
 *
 * Must run after verifyJWT.
 */
async function tenantScope(req, res, next) {
  try {
    const { userId, organizationId } = req.user;

    const dbUser = await User.findById(userId).select('isActive role organizationId');
    if (!dbUser || !dbUser.isActive) {
      return next(new ApiError(401, 'ACCOUNT_INACTIVE', 'This account has been deactivated'));
    }

    // Always use DB role — overrides token role for immediate effect
    req.user.role = dbUser.role;
    req.user.organizationId = dbUser.organizationId?.toString() || organizationId;

    const orgId = req.user.organizationId;

    req.repos = {
      users: new UserRepository(orgId),
      invites: new InviteRepository(orgId),
      warehouses: new WarehouseRepository(orgId),
      locations: new LocationRepository(orgId),
      categories: new CategoryRepository(orgId),
      products: new ProductRepository(orgId),
    };

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { tenantScope };
