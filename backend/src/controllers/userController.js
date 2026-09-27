'use strict';

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Organization = require('../models/Organization');
const ApiResponse = require('../utils/ApiResponse');
const ApiError    = require('../utils/ApiError');
const { getPagination, paginationMeta } = require('../utils/pagination');

// ── User list (manager) ───────────────────────────────────────────────────────

/** GET /api/users — list ALL users including inactive (manager only) */
async function listUsers(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const search = req.query.search || '';
  const { users, total } = await req.repos.users.listAll({ skip, limit, search });
  res.json(new ApiResponse(200, 'Users retrieved', {
    users: users.map(safeUser),
    pagination: paginationMeta(total, { page, limit }),
  }));
}

/** GET /api/users/me */
async function getMe(req, res) {
  const user = await User.findById(req.user.userId).select('-passwordHash -otpHash');
  if (!user) throw new ApiError(404, 'NOT_FOUND', 'User not found');
  res.json(new ApiResponse(200, 'Profile retrieved', safeUser(user)));
}

// ── Profile update (self) ─────────────────────────────────────────────────────

/** PATCH /api/users/me — update own name */
async function updateMe(req, res) {
  const { name } = req.body;
  if (!name || !name.trim()) throw new ApiError(400, 'MISSING_FIELD', 'Name is required');
  const updated = await req.repos.users.updateProfile(req.user.userId, { name: name.trim() });
  if (!updated) throw new ApiError(404, 'NOT_FOUND', 'User not found');
  res.json(new ApiResponse(200, 'Profile updated', safeUser(updated)));
}

/** PATCH /api/users/me/password — change own password */
async function changeMyPassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'MISSING_FIELD', 'currentPassword and newPassword required');
  }
  if (newPassword.length < 8) {
    throw new ApiError(400, 'WEAK_PASSWORD', 'New password must be at least 8 characters');
  }

  const user = await User.findById(req.user.userId);
  if (!user) throw new ApiError(404, 'NOT_FOUND', 'User not found');

  const match = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!match) throw new ApiError(401, 'WRONG_PASSWORD', 'Current password is incorrect');

  const hash = await bcrypt.hash(newPassword, 12);
  await req.repos.users.updatePassword(req.user.userId, hash);

  res.json(new ApiResponse(200, 'Password changed successfully'));
}

// ── Role / deactivate / reactivate (manager) ──────────────────────────────────

/** PATCH /api/users/:id/role */
async function changeRole(req, res) {
  const { role } = req.body;
  const { id }   = req.params;
  if (id === req.user.userId) throw new ApiError(400, 'SELF_ROLE_CHANGE', 'You cannot change your own role');

  const updated = await req.repos.users.updateRole(id, role);
  if (!updated) throw new ApiError(404, 'NOT_FOUND', 'User not found in this organization');

  res.json(new ApiResponse(200, 'Role updated. Change takes effect on their next request.', safeUser(updated)));
}

/** PATCH /api/users/:id/deactivate */
async function deactivateUser(req, res) {
  const { id } = req.params;
  if (id === req.user.userId) throw new ApiError(400, 'SELF_DEACTIVATE', 'You cannot deactivate your own account');

  const updated = await req.repos.users.deactivate(id);
  if (!updated) throw new ApiError(404, 'NOT_FOUND', 'User not found in this organization');

  const refreshTokenRepo = require('../repositories/refreshTokenRepository');
  await refreshTokenRepo.revokeAllForUser(id);

  res.json(new ApiResponse(200, 'User deactivated', safeUser(updated)));
}

/** PATCH /api/users/:id/reactivate */
async function reactivateUser(req, res) {
  const { id } = req.params;
  const updated = await req.repos.users.reactivate(id);
  if (!updated) throw new ApiError(404, 'NOT_FOUND', 'User not found in this organization');
  res.json(new ApiResponse(200, 'User reactivated', safeUser(updated)));
}

// ── Invites (manager) ─────────────────────────────────────────────────────────

/** GET /api/users/invites */
async function listInvites(req, res) {
  const { page, limit, skip } = getPagination(req.query);
  const { invites, total } = await req.repos.invites.listPending({ skip, limit });
  res.json(new ApiResponse(200, 'Pending invites retrieved', {
    invites,
    pagination: paginationMeta(total, { page, limit }),
  }));
}

/** DELETE /api/users/invites/:id */
async function revokeInvite(req, res) {
  const revoked = await req.repos.invites.revoke(req.params.id);
  if (!revoked) throw new ApiError(404, 'NOT_FOUND', 'Invite not found or already accepted');
  res.json(new ApiResponse(200, 'Invite revoked'));
}

// ── Org settings (manager) ────────────────────────────────────────────────────

/** GET /api/users/org */
async function getOrg(req, res) {
  const org = await Organization.findById(req.user.organizationId).select('name plan createdAt');
  if (!org) throw new ApiError(404, 'NOT_FOUND', 'Organization not found');
  res.json(new ApiResponse(200, 'Organization retrieved', org));
}

/** PATCH /api/users/org */
async function updateOrg(req, res) {
  const { name } = req.body;
  if (!name || !name.trim()) throw new ApiError(400, 'MISSING_FIELD', 'Organization name is required');
  const org = await Organization.findByIdAndUpdate(
    req.user.organizationId,
    { $set: { name: name.trim() } },
    { new: true }
  ).select('name plan createdAt');
  if (!org) throw new ApiError(404, 'NOT_FOUND', 'Organization not found');
  res.json(new ApiResponse(200, 'Organization updated', org));
}

// ── Private ───────────────────────────────────────────────────────────────────

function safeUser(user) {
  const u = user.toObject ? user.toObject() : { ...user };
  delete u.passwordHash; delete u.otpHash;
  delete u.otpExpiresAt; delete u.otpLockedUntil; delete u.otpFailedAttempts;
  return u;
}

module.exports = {
  listUsers, getMe, updateMe, changeMyPassword,
  changeRole, deactivateUser, reactivateUser,
  listInvites, revokeInvite,
  getOrg, updateOrg,
};
