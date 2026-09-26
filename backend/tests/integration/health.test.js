'use strict';

const request = require('supertest');

// The health route is a pure HTTP route — no DB needed.
// We test app.js directly without calling connectDB.
const app = require('../../src/app');

describe('GET /api/health', () => {
  it('should return 200 with success:true', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/healthy/i);
    expect(res.body.data).toHaveProperty('timestamp');
  });

  it('should return 404 for unknown routes', async () => {
    const res = await request(app).get('/api/unknown-route');
    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
