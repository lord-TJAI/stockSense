'use strict';

const { z } = require('zod');

const signupSchema = z.object({
  orgName: z.string().min(2).max(100),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const verifyOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6).regex(/^\d{6}$/),
  otpType: z.enum(['email_verification', 'password_reset']).optional().default('password_reset'),
});

const resetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6).regex(/^\d{6}$/),
  newPassword: z.string().min(8).max(128),
});

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['inventory_manager', 'warehouse_staff']),
});

const acceptInviteSchema = z.object({
  name: z.string().min(2).max(100),
  password: z.string().min(8).max(128),
});

const changeRoleSchema = z.object({
  role: z.enum(['inventory_manager', 'warehouse_staff']),
});

module.exports = {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  inviteSchema,
  acceptInviteSchema,
  changeRoleSchema,
};
