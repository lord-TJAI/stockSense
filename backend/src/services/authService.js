'use strict';

const bcrypt = require('bcryptjs');
const ApiError = require('../utils/ApiError');
const orgRepo = require('../repositories/organizationRepository');
const UserRepository = require('../repositories/userRepository');
const InviteRepository = require('../repositories/inviteRepository');
const refreshTokenRepo = require('../repositories/refreshTokenRepository');
const { generateOTP } = require('../utils/generateOTP');
const {
  signAccessToken,
  generateRefreshToken,
  refreshTokenExpiryDate,
} = require('../utils/tokenUtils');
const mailer = require('../config/mailer');
const env = require('../config/env');

const SALT_ROUNDS = 12;
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const OTP_MAX_ATTEMPTS = 5;
const OTP_LOCK_DURATION_MS = 60 * 60 * 1000; // 1 hour

/** Build the access token payload from a user doc + org. */
function buildTokenPayload(user) {
  return {
    userId: user._id.toString(),
    organizationId: user.organizationId?.toString() || null,
    role: user.role,
  };
}

/** Issue access + refresh tokens and set the cookie. */
async function issueTokens(user, res, { ip, userAgent }) {
  const payload = buildTokenPayload(user);
  const accessToken = signAccessToken(payload);
  const plainRefresh = generateRefreshToken();
  const expiresAt = refreshTokenExpiryDate();

  await refreshTokenRepo.create({ userId: user._id, plainToken: plainRefresh, ip, userAgent, expiresAt });

  res.cookie('refreshToken', plainRefresh, {
    httpOnly: true,
    secure: env.isProduction(),
    sameSite: env.isProduction() ? 'none' : 'lax',
    expires: expiresAt,
    path: '/',
  });

  return { accessToken };
}

/** Send an OTP email (or log it via MockMailer in dev). */
async function sendOtpEmail(user, otp, otpType) {
  const subject =
    otpType === 'email_verification'
      ? 'StockSense — Verify your email'
      : 'StockSense — Password reset OTP';

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:auto">
      <h2>StockSense</h2>
      <p>Hi ${user.name},</p>
      <p>${otpType === 'email_verification' ? 'Please verify your email address.' : 'You requested a password reset.'}</p>
      <p>Your OTP is:</p>
      <h1 style="letter-spacing:8px;color:#EA580C">${otp}</h1>
      <p>This code expires in <strong>10 minutes</strong>.</p>
      ${otpType === 'email_verification' ? '' : '<p>If you did not request this, you can safely ignore this email.</p>'}
    </div>
  `;
  await mailer.sendMail({ to: user.email, subject, html });
}

// ──────────────────────────────────────────────────────────────────────────────
// SIGNUP
// ──────────────────────────────────────────────────────────────────────────────

async function signup({ orgName, name, email, password }, res, { ip, userAgent }) {
  // 1. Email must not already exist
  const existing = await UserRepository.prototype.findByEmailGlobal.call(
    { Model: require('../models/User') },
    email
  );
  // Use global lookup (no org context yet)
  const User = require('../models/User');
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'EMAIL_EXISTS', 'An account with this email already exists');
  }

  // 2. Build a unique slug from org name
  let slug = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  // Ensure uniqueness by appending random suffix if needed
  if (await orgRepo.slugExists(slug)) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 7)}`;
  }

  // 3. Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // 4. Create org (createdBy is a chicken-and-egg: we'll update after user creation)
  const org = await orgRepo.create({ name: orgName, slug, createdBy: new (require('mongoose').Types.ObjectId)() });

  // 5. Create user scoped to this org
  const user = await User.create({
    organizationId: org._id,
    name,
    email,
    passwordHash,
    role: 'inventory_manager',
    isEmailVerified: false,
  });

  // 6. Patch org.createdBy now that we have the userId
  await orgRepo.update(org._id, { createdBy: user._id });

  // 7. Generate + send email verification OTP
  const otp = generateOTP();
  const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);
  await User.findByIdAndUpdate(user._id, {
    otpHash,
    otpExpiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
    otpType: 'email_verification',
  });
  await sendOtpEmail(user, otp, 'email_verification');

  // 8. Issue tokens
  const tokens = await issueTokens(user, res, { ip, userAgent });
  return { ...tokens, user: { id: user._id, name: user.name, email: user.email, role: user.role, isEmailVerified: false, organizationId: org._id } };
}

// ──────────────────────────────────────────────────────────────────────────────
// VERIFY EMAIL OTP
// ──────────────────────────────────────────────────────────────────────────────

async function verifyEmailOtp({ email, otp }) {
  const User = require('../models/User');
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, 'NOT_FOUND', 'User not found');
  if (user.isEmailVerified) throw new ApiError(400, 'ALREADY_VERIFIED', 'Email is already verified');
  return _verifyOtp(user, otp, 'email_verification');
}

// ──────────────────────────────────────────────────────────────────────────────
// LOGIN
// ──────────────────────────────────────────────────────────────────────────────

async function login({ email, password }, res, { ip, userAgent }) {
  const User = require('../models/User');
  const user = await User.findOne({ email });
  if (!user || !user.isActive) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

  const tokens = await issueTokens(user, res, { ip, userAgent });
  return {
    ...tokens,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      organizationId: user.organizationId,
      avatarUrl: user.avatarUrl,
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// REFRESH TOKEN
// ──────────────────────────────────────────────────────────────────────────────

async function refreshAccessToken(req, res) {
  const plainToken = req.cookies?.refreshToken;
  if (!plainToken) throw new ApiError(401, 'MISSING_REFRESH_TOKEN', 'No refresh token provided');

  const tokenDoc = await refreshTokenRepo.findByToken(plainToken);
  if (!tokenDoc) throw new ApiError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired');

  const User = require('../models/User');
  const user = await User.findById(tokenDoc.userId);
  if (!user || !user.isActive) throw new ApiError(401, 'ACCOUNT_INACTIVE', 'Account is inactive');

  // Rotate: revoke old, issue new
  await refreshTokenRepo.revokeById(tokenDoc._id);
  const tokens = await issueTokens(user, res, {
    ip: req.ip,
    userAgent: req.headers['user-agent'] || '',
  });
  return tokens;
}

// ──────────────────────────────────────────────────────────────────────────────
// LOGOUT
// ──────────────────────────────────────────────────────────────────────────────

async function logout(req, res) {
  const plainToken = req.cookies?.refreshToken;
  if (plainToken) {
    const tokenDoc = await refreshTokenRepo.findByToken(plainToken);
    if (tokenDoc) await refreshTokenRepo.revokeById(tokenDoc._id);
  }
  res.clearCookie('refreshToken', { path: '/' });
}

// ──────────────────────────────────────────────────────────────────────────────
// FORGOT PASSWORD (send OTP)
// ──────────────────────────────────────────────────────────────────────────────

async function forgotPassword({ email }) {
  const User = require('../models/User');
  const user = await User.findOne({ email });
  // Always respond success to prevent email enumeration
  if (!user || !user.isActive) return;

  const otp = generateOTP();
  const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);
  await User.findByIdAndUpdate(user._id, {
    otpHash,
    otpExpiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
    otpType: 'password_reset',
    otpFailedAttempts: 0,
    otpLockedUntil: null,
  });
  await sendOtpEmail(user, otp, 'password_reset');
}

// ──────────────────────────────────────────────────────────────────────────────
// VERIFY OTP (password reset step 1 — just validates, doesn't change password)
// ──────────────────────────────────────────────────────────────────────────────

async function verifyOtp({ email, otp, otpType = 'password_reset' }) {
  const User = require('../models/User');
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, 'NOT_FOUND', 'User not found');
  return _verifyOtp(user, otp, otpType);
}

// ──────────────────────────────────────────────────────────────────────────────
// RESET PASSWORD
// ──────────────────────────────────────────────────────────────────────────────

async function resetPassword({ email, otp, newPassword }) {
  const User = require('../models/User');
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, 'NOT_FOUND', 'User not found');

  // Validate OTP
  await _verifyOtp(user, otp, 'password_reset');

  // Set new password and clear OTP
  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await User.findByIdAndUpdate(user._id, {
    passwordHash,
    otpHash: null,
    otpExpiresAt: null,
    otpType: null,
    otpFailedAttempts: 0,
  });

  // Revoke all refresh tokens on password change
  await refreshTokenRepo.revokeAllForUser(user._id);
}

// ──────────────────────────────────────────────────────────────────────────────
// INVITE USER (manager only)
// ──────────────────────────────────────────────────────────────────────────────

async function inviteUser({ email, role }, invitedBy, repos) {
  const User = require('../models/User');

  // Check if email is already a user in this org
  const existingUser = await repos.users.findByEmail(email);
  if (existingUser) {
    throw new ApiError(409, 'USER_EXISTS', 'A user with this email already exists in this organization');
  }

  // Expire any pending invite for same email
  const Invite = require('../models/Invite');
  await Invite.updateMany(
    { organizationId: repos.invites.organizationId, email, acceptedAt: null },
    { $set: { expiresAt: new Date() } }
  );

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const plainToken = await repos.invites.createInvite({
    email,
    role,
    invitedBy: invitedBy._id,
    expiresAt,
  });

  const org = await orgRepo.findById(repos.invites.organizationId);
  const acceptUrl = `${env.CLIENT_URLS.split(',')[0].trim()}/accept-invite/${plainToken}`;

  await mailer.sendMail({
    to: email,
    subject: `You're invited to join ${org.name} on StockSense`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>StockSense</h2>
        <p>Hi,</p>
        <p><strong>${invitedBy.name}</strong> has invited you to join <strong>${org.name}</strong> on StockSense as a <strong>${role === 'inventory_manager' ? 'Inventory Manager' : 'Warehouse Staff'}</strong>.</p>
        <p><a href="${acceptUrl}" style="background:#EA580C;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">Accept Invitation</a></p>
        <p style="color:#888;font-size:12px">This link expires in 7 days. If you didn't expect this invitation, you can ignore it.</p>
      </div>
    `,
  });

  return { email, role, expiresAt };
}

// ──────────────────────────────────────────────────────────────────────────────
// ACCEPT INVITE
// ──────────────────────────────────────────────────────────────────────────────

async function getInviteDetails(token) {
  const Invite = require('../models/Invite');
  const crypto = require('crypto');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const invite = await Invite.findOne({ tokenHash });

  if (!invite) throw new ApiError(404, 'INVITE_NOT_FOUND', 'Invitation not found or has expired');
  if (invite.acceptedAt) throw new ApiError(410, 'INVITE_USED', 'This invitation has already been accepted');
  if (invite.expiresAt < new Date()) throw new ApiError(410, 'INVITE_EXPIRED', 'This invitation has expired');

  const org = await orgRepo.findById(invite.organizationId);
  return { email: invite.email, role: invite.role, orgName: org?.name, expiresAt: invite.expiresAt };
}

async function acceptInvite(token, { name, password }, res, { ip, userAgent }) {
  const Invite = require('../models/Invite');
  const User = require('../models/User');
  const crypto = require('crypto');

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const invite = await Invite.findOne({ tokenHash });

  if (!invite) throw new ApiError(404, 'INVITE_NOT_FOUND', 'Invitation not found');
  if (invite.acceptedAt) throw new ApiError(410, 'INVITE_USED', 'Invitation already accepted');
  if (invite.expiresAt < new Date()) throw new ApiError(410, 'INVITE_EXPIRED', 'Invitation has expired');

  // Check email not taken globally
  const existing = await User.findOne({ email: invite.email });
  if (existing) throw new ApiError(409, 'EMAIL_EXISTS', 'An account with this email already exists');

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    organizationId: invite.organizationId,
    name,
    email: invite.email,
    passwordHash,
    role: invite.role,
    isEmailVerified: true, // invite confirms email ownership
  });

  await Invite.findByIdAndUpdate(invite._id, { acceptedAt: new Date() });

  const tokens = await issueTokens(user, res, { ip, userAgent });
  return {
    ...tokens,
    user: { id: user._id, name: user.name, email: user.email, role: user.role, isEmailVerified: true, organizationId: user.organizationId },
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// SESSIONS
// ──────────────────────────────────────────────────────────────────────────────

async function listSessions(userId) {
  return refreshTokenRepo.listActiveByUser(userId);
}

async function revokeSession(sessionId, userId) {
  const RefreshToken = require('../models/RefreshToken');
  const session = await RefreshToken.findOne({ _id: sessionId, userId });
  if (!session) throw new ApiError(404, 'SESSION_NOT_FOUND', 'Session not found');
  await refreshTokenRepo.revokeById(sessionId);
}

async function revokeAllOtherSessions(currentRefreshToken, userId) {
  const tokenDoc = await refreshTokenRepo.findByToken(currentRefreshToken);
  const currentId = tokenDoc?._id || null;
  await refreshTokenRepo.revokeAllForUser(userId, currentId);
}

// ──────────────────────────────────────────────────────────────────────────────
// PRIVATE HELPERS
// ──────────────────────────────────────────────────────────────────────────────

async function _verifyOtp(user, otp, expectedType) {
  const User = require('../models/User');

  // Check lock
  if (user.otpLockedUntil && user.otpLockedUntil > new Date()) {
    const remaining = Math.ceil((user.otpLockedUntil - Date.now()) / 60000);
    throw new ApiError(429, 'OTP_LOCKED', `Too many failed attempts. Try again in ${remaining} minute(s).`);
  }

  if (!user.otpHash || user.otpType !== expectedType) {
    throw new ApiError(400, 'INVALID_OTP', 'No pending OTP for this operation');
  }

  if (user.otpExpiresAt < new Date()) {
    throw new ApiError(400, 'OTP_EXPIRED', 'OTP has expired. Please request a new one.');
  }

  const match = await bcrypt.compare(otp, user.otpHash);
  if (!match) {
    const newAttempts = (user.otpFailedAttempts || 0) + 1;
    if (newAttempts >= OTP_MAX_ATTEMPTS) {
      await User.findByIdAndUpdate(user._id, {
        otpLockedUntil: new Date(Date.now() + OTP_LOCK_DURATION_MS),
        otpFailedAttempts: 0,
      });
      throw new ApiError(429, 'OTP_LOCKED', 'Too many failed attempts. OTP locked for 1 hour.');
    }
    await User.findByIdAndUpdate(user._id, { otpFailedAttempts: newAttempts });
    throw new ApiError(400, 'INVALID_OTP', `Incorrect OTP. ${OTP_MAX_ATTEMPTS - newAttempts} attempt(s) remaining.`);
  }

  // OTP valid — mark email verified if needed
  if (expectedType === 'email_verification') {
    await User.findByIdAndUpdate(user._id, {
      isEmailVerified: true,
      otpHash: null,
      otpExpiresAt: null,
      otpType: null,
      otpFailedAttempts: 0,
    });
  }

  return true;
}

module.exports = {
  signup,
  verifyEmailOtp,
  login,
  refreshAccessToken,
  logout,
  forgotPassword,
  verifyOtp,
  resetPassword,
  inviteUser,
  getInviteDetails,
  acceptInvite,
  listSessions,
  revokeSession,
  revokeAllOtherSessions,
};
