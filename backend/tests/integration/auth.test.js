'use strict';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const { connectDB, disconnectDB } = require('../../src/config/db');

// Use a unique test email prefix to avoid collisions across runs
const testId = Date.now();
const testEmail = `test_${testId}@stocksense-test.dev`;
const testPassword = 'Test@Password123';

let accessToken;
let staffToken;
let cookies; // for refresh token cookie

beforeAll(async () => {
  await connectDB();
  // Clean up any leftover test data
  const User = require('../../src/models/User');
  const Org = require('../../src/models/Organization');
  await User.deleteMany({ email: { $regex: /stocksense-test\.dev$/ } });
  await Org.deleteMany({ slug: { $regex: /test-org/ } });
});

afterAll(async () => {
  // Clean up test data
  const User = require('../../src/models/User');
  const Org = require('../../src/models/Organization');
  await User.deleteMany({ email: { $regex: /stocksense-test\.dev$/ } });
  await Org.deleteMany({ slug: { $regex: /test-org/ } });
  await disconnectDB();
});

// ── SIGNUP ────────────────────────────────────────────────────────────────────
describe('POST /api/auth/signup', () => {
  it('creates org + user and returns access token', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      orgName: `Test Org ${testId}`,
      name: 'Test Manager',
      email: testEmail,
      password: testPassword,
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.user.role).toBe('inventory_manager');
    accessToken = res.body.data.accessToken;
    // Capture Set-Cookie for refresh token
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeDefined();
    cookies = setCookie;
  });

  it('rejects duplicate email with 409', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      orgName: 'Another Org',
      name: 'Dup User',
      email: testEmail,
      password: testPassword,
    });
    expect(res.statusCode).toBe(409);
    expect(res.body.code).toBe('EMAIL_EXISTS');
  });

  it('rejects short password with 422', async () => {
    const res = await request(app).post('/api/auth/signup').send({
      orgName: 'Test Org',
      name: 'User',
      email: `short_${testId}@stocksense-test.dev`,
      password: '123',
    });
    expect(res.statusCode).toBe(422);
  });
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  it('returns access token on valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: testPassword,
    });
    expect(res.statusCode).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    accessToken = res.body.data.accessToken;
    cookies = res.headers['set-cookie'];
  });

  it('rejects wrong password with 401', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testEmail,
      password: 'WrongPass999!',
    });
    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });
});

// ── TOKEN REFRESH ─────────────────────────────────────────────────────────────
describe('POST /api/auth/refresh', () => {
  it('returns a new access token using the refresh cookie', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', cookies);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();
    // Update to use the fresh token
    accessToken = res.body.data.accessToken;
    cookies = res.headers['set-cookie'] || cookies;
  });

  it('rejects when no cookie is provided', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.statusCode).toBe(401);
  });
});

// ── RBAC ──────────────────────────────────────────────────────────────────────
describe('RBAC — manager-only routes', () => {
  it('GET /api/users returns 200 for inventory_manager', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data.users)).toBe(true);
  });

  it('returns 403 for warehouse_staff on GET /api/users', async () => {
    // Create a staff user in the same org
    const User = require('../../src/models/User');
    const jwt = require('jsonwebtoken');
    const env = require('../../src/config/env');

    // Decode manager token to get org id
    const decoded = jwt.decode(accessToken);
    const bcrypt = require('bcryptjs');
    const staffEmail = `staff_${testId}@stocksense-test.dev`;
    const staffUser = await User.create({
      organizationId: decoded.organizationId,
      name: 'Staff Member',
      email: staffEmail,
      passwordHash: await bcrypt.hash(testPassword, 12),
      role: 'warehouse_staff',
      isEmailVerified: true,
    });

    staffToken = jwt.sign(
      { userId: staffUser._id.toString(), organizationId: decoded.organizationId, role: 'warehouse_staff' },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${staffToken}`);
    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });
});

// ── FORGOT PASSWORD / OTP ─────────────────────────────────────────────────────
describe('Forgot password OTP flow', () => {
  it('POST /api/auth/forgot-password always returns 200', async () => {
    const res = await request(app).post('/api/auth/forgot-password').send({ email: testEmail });
    expect(res.statusCode).toBe(200);
    // No info about whether email exists
    expect(res.body.message).toMatch(/if an account exists/i);
  });

  it('OTP lock: 5 wrong OTP attempts lock the account for 1 hour', async () => {
    const User = require('../../src/models/User');
    const bcrypt = require('bcryptjs');

    // Manually set a fresh OTP
    const fakeOtp = '000000';
    const otpHash = await bcrypt.hash(fakeOtp, 12);
    await User.findOneAndUpdate(
      { email: testEmail },
      {
        otpHash,
        otpExpiresAt: new Date(Date.now() + 600000),
        otpType: 'password_reset',
        otpFailedAttempts: 0,
        otpLockedUntil: null,
      }
    );

    // Send 5 wrong OTPs
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/auth/verify-otp').send({
        email: testEmail,
        otp: '999999',
        otpType: 'password_reset',
      });
    }

    // Now even the right OTP should be locked
    const res = await request(app).post('/api/auth/verify-otp').send({
      email: testEmail,
      otp: fakeOtp,
      otpType: 'password_reset',
    });
    expect(res.statusCode).toBe(429);
    expect(res.body.code).toBe('OTP_LOCKED');
  });
});

// ── SESSION MANAGEMENT ────────────────────────────────────────────────────────
describe('Session management', () => {
  it('GET /api/auth/sessions returns active sessions', async () => {
    const res = await request(app)
      .get('/api/auth/sessions')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

// ── GET /api/users/me ─────────────────────────────────────────────────────────
describe('GET /api/users/me', () => {
  it('returns current user profile without password hash', async () => {
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.email).toBe(testEmail);
    expect(res.body.data.passwordHash).toBeUndefined();
  });
});
