'use strict';

const authService = require('../services/authService');
const ApiResponse = require('../utils/ApiResponse');

function ipOf(req) {
  return req.ip || req.socket?.remoteAddress || '';
}
function uaOf(req) {
  return req.headers['user-agent'] || '';
}

async function signup(req, res) {
  const result = await authService.signup(req.body, res, { ip: ipOf(req), userAgent: uaOf(req) });
  res.status(201).json(new ApiResponse(201, 'Account created. Please verify your email.', result));
}

async function verifyEmail(req, res) {
  await authService.verifyEmailOtp(req.body);
  res.json(new ApiResponse(200, 'Email verified successfully'));
}

async function login(req, res) {
  const result = await authService.login(req.body, res, { ip: ipOf(req), userAgent: uaOf(req) });
  res.json(new ApiResponse(200, 'Login successful', result));
}

async function refresh(req, res) {
  const result = await authService.refreshAccessToken(req, res);
  res.json(new ApiResponse(200, 'Token refreshed', result));
}

async function logout(req, res) {
  await authService.logout(req, res);
  res.json(new ApiResponse(200, 'Logged out successfully'));
}

async function forgotPassword(req, res) {
  await authService.forgotPassword(req.body);
  // Always 200 to prevent email enumeration
  res.json(new ApiResponse(200, 'If an account exists for that email, an OTP has been sent'));
}

async function verifyOtp(req, res) {
  await authService.verifyOtp(req.body);
  res.json(new ApiResponse(200, 'OTP verified successfully'));
}

async function resetPassword(req, res) {
  await authService.resetPassword(req.body);
  res.json(new ApiResponse(200, 'Password reset successfully. Please log in with your new password.'));
}

async function getInvite(req, res) {
  const result = await authService.getInviteDetails(req.params.token);
  res.json(new ApiResponse(200, 'Invite details', result));
}

async function acceptInvite(req, res) {
  const result = await authService.acceptInvite(
    req.params.token,
    req.body,
    res,
    { ip: ipOf(req), userAgent: uaOf(req) }
  );
  res.status(201).json(new ApiResponse(201, 'Invitation accepted. Welcome to StockSense!', result));
}

async function sendInvite(req, res) {
  const result = await authService.inviteUser(req.body, req.user, req.repos);
  res.status(201).json(new ApiResponse(201, 'Invitation sent', result));
}

async function listSessions(req, res) {
  const sessions = await authService.listSessions(req.user.userId);
  res.json(new ApiResponse(200, 'Active sessions', sessions));
}

async function revokeSession(req, res) {
  await authService.revokeSession(req.params.sessionId, req.user.userId);
  res.json(new ApiResponse(200, 'Session revoked'));
}

async function revokeOtherSessions(req, res) {
  const plainToken = req.cookies?.refreshToken;
  await authService.revokeAllOtherSessions(plainToken, req.user.userId);
  res.json(new ApiResponse(200, 'All other sessions revoked'));
}

module.exports = {
  signup,
  verifyEmail,
  login,
  refresh,
  logout,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getInvite,
  acceptInvite,
  sendInvite,
  listSessions,
  revokeSession,
  revokeOtherSessions,
};
