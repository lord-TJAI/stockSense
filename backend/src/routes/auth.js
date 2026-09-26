'use strict';

const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const validate = require('../middlewares/validate');
const { verifyJWT } = require('../middlewares/auth');
const { tenantScope } = require('../middlewares/tenantScope');
const { requireRole } = require('../middlewares/rbac');
const { authLimiter } = require('../middlewares/rateLimiter');
const {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  inviteSchema,
  acceptInviteSchema,
} = require('../validators/authValidators');

// ── Public ────────────────────────────────────────────────────────────────────
router.post('/signup',           authLimiter, validate(signupSchema),         authController.signup);
router.post('/verify-email',     authLimiter, validate(verifyOtpSchema),      authController.verifyEmail);
router.post('/login',            authLimiter, validate(loginSchema),           authController.login);
router.post('/refresh',                                                         authController.refresh);
router.post('/logout',                                                          authController.logout);
router.post('/forgot-password',  authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/verify-otp',       authLimiter, validate(verifyOtpSchema),      authController.verifyOtp);
router.post('/reset-password',   authLimiter, validate(resetPasswordSchema),  authController.resetPassword);

// ── Invite (public — token from email) ───────────────────────────────────────
router.get('/invites/:token',                                                   authController.getInvite);
router.post('/invites/:token/accept', authLimiter, validate(acceptInviteSchema), authController.acceptInvite);

// ── Protected: send invite (manager only) ────────────────────────────────────
router.post(
  '/invites',
  verifyJWT, tenantScope, requireRole('inventory_manager'),
  validate(inviteSchema),
  authController.sendInvite
);

// ── Protected: session management ────────────────────────────────────────────
router.get('/sessions',                  verifyJWT, tenantScope, authController.listSessions);
router.delete('/sessions/others',        verifyJWT, tenantScope, authController.revokeOtherSessions);
router.delete('/sessions/:sessionId',    verifyJWT, tenantScope, authController.revokeSession);

module.exports = router;
