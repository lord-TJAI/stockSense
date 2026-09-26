'use strict';

const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const authService = require('../services/authService');
const { getPagination, paginationMeta } = require('../utils/pagination');

/** GET /api/users — manager only */
async function listUsers(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const search = req.query.search || '';
  const { users, total } = await req.repos.users.list({ skip, limit, search });
  res.json(
    new ApiResponse(200, 'Users retrieved', {
      users: users.map(safeUser),
      pagination: paginationMeta(total, { page, limit }),
    })
  );
}

/** GET /api/users/me — current user profile */
async function getMe(req, res) {
  const user = await User.findById(req.user.userId).select('-passwordHash -otpHash');
  if (!user) throw new ApiError(404, 'NOT_FOUND', 'User not found');
  res.json(new ApiResponse(200, 'Profile retrieved', safeUser(user)));
}

/** PATCH /api/users/:id/role — manager only */
async function changeRole(req, res) {
  const { role } = req.body;
  const { id } = req.params;

  // Can't change your own role
  if (id === req.user.userId) {
    throw new ApiError(400, 'SELF_ROLE_CHANGE', 'You cannot change your own role');
  }

  const updated = await req.repos.users.updateRole(id, role);
  if (!updated) throw new ApiError(404, 'NOT_FOUND', 'User not found in this organization');

  res.json(new ApiResponse(200, 'Role updated. Change takes effect on their next request.', safeUser(updated)));
}

/** PATCH /api/users/:id/deactivate — manager only */
async function deactivateUser(req, res) {
  const { id } = req.params;
  if (id === req.user.userId) {
    throw new ApiError(400, 'SELF_DEACTIVATE', 'You cannot deactivate your own account');
  }
  const updated = await req.repos.users.deactivate(id);
  if (!updated) throw new ApiError(404, 'NOT_FOUND', 'User not found in this organization');

  // Revoke all refresh tokens immediately
  const refreshTokenRepo = require('../repositories/refreshTokenRepository');
  await refreshTokenRepo.revokeAllForUser(id);

  res.json(new ApiResponse(200, 'User deactivated', safeUser(updated)));
}

/** Strip sensitive fields. */
function safeUser(user) {
  const u = user.toObject ? user.toObject() : user;
  delete u.passwordHash;
  delete u.otpHash;
  delete u.otpExpiresAt;
  delete u.otpLockedUntil;
  delete u.otpFailedAttempts;
  return u;
}

module.exports = { listUsers, getMe, changeRole, deactivateUser };
