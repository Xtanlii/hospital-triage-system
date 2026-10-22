const request = require('supertest');
const bcrypt = require('bcryptjs');
const app = require('../src/app');
const prisma = require('../src/config/db');

// Mock Prisma client methods for unit testing without live DB requirement
jest.mock('../src/config/db', () => {
  const users = new Map();

  return {
    user: {
      findUnique: jest.fn(async ({ where }) => {
        if (where.username) {
          return users.get(where.username) || null;
        }
        if (where.user_id) {
          for (const u of users.values()) {
            if (u.user_id === where.user_id) return u;
          }
        }
        return null;
      }),
      create: jest.fn(async ({ data }) => {
        const savedUser = {
          user_id: 'mock-uuid-1234',
          full_name: data.full_name,
          username: data.username,
          password_hash: data.password_hash,
          role: data.role,
          created_at: new Date()
        };
        users.set(data.username, savedUser);
        return {
          user_id: savedUser.user_id,
          full_name: savedUser.full_name,
          username: savedUser.username,
          role: savedUser.role,
          created_at: savedUser.created_at
        };
      }),
      deleteMany: jest.fn(async () => {
        users.clear();
        return { count: 0 };
      })
    },
    $disconnect: jest.fn(async () => {})
  };
});

describe('Authentication & Authorization Tests', () => {
  const testNurseUsername = 'nurse_florence';
  let nurseToken = '';

  test('POST /api/auth/register - Successfully registers a new nurse', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        full_name: 'Test Nurse Florence',
        username: testNurseUsername,
        password: 'password123',
        role: 'NURSE'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.username).toBe(testNurseUsername);
    expect(res.body.data.user.role).toBe('NURSE');
    expect(res.body.data.user.password_hash).toBeUndefined(); // ensure hash is never returned
  });

  test('POST /api/auth/register - Fails with duplicate username (409 Conflict)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        full_name: 'Duplicate Nurse',
        username: testNurseUsername,
        password: 'password123',
        role: 'NURSE'
      });

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/login - Successfully logs in with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: testNurseUsername,
        password: 'password123'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    nurseToken = res.body.data.token;
  });

  test('POST /api/auth/login - Fails with incorrect password (401 Unauthorized)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: testNurseUsername,
        password: 'wrongpassword'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/login - Fails with unknown username (401 Unauthorized)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'nonexistent_user_9999',
        password: 'password123'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/auth/me - Successfully retrieves current user profile with valid Bearer token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${nurseToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.username).toBe(testNurseUsername);
  });

  test('GET /api/auth/me - Rejects request with missing token (401)', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/admin/dashboard - Denies access to NURSE for ADMIN-only route (403 Forbidden)', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${nurseToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
