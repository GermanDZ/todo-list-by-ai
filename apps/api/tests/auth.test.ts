import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/services/prismaClient.js';
import {
  deleteAllUserRefreshTokens,
  deleteRefreshToken,
} from '../src/services/refreshTokenService.js';

describe('Authentication API', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'password123',
  };

  beforeEach(async () => {
    // Clean up test data before each test
    // Delete refresh tokens first (due to foreign key constraint)
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user with valid email and password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user).not.toHaveProperty('passwordHash');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ password: testUser.password });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required');
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: testUser.email });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required');
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 when email format is invalid', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'invalid-email', password: testUser.password });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid email format');
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.details).toHaveProperty('field', 'email');
    });

    it('should return 400 when password is too short', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: testUser.email, password: 'short' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Password must be at least 8 characters');
    });

    it('should return 409 when email already exists', async () => {
      // Register first user
      await request(app).post('/api/auth/register').send(testUser);

      // Try to register again with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Email already registered');
      expect(response.body.code).toBe('CONFLICT');
      expect(response.body.details).toHaveProperty('field', 'email');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register a user before login tests
      // Clean up any existing refresh tokens first
      await prisma.refreshToken.deleteMany({});
      await request(app).post('/api/auth/register').send(testUser);
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(testUser);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ password: testUser.password });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email and password are required');
    });

    it('should return 401 when email does not exist', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: testUser.password });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid email or password');
    });

    it('should return 401 when password is incorrect', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid email or password');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Register and login to get tokens
      const loginResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      // Extract refresh token from cookie
      const cookies = loginResponse.headers['set-cookie'];
      if (cookies && cookies[0]) {
        refreshToken = cookies[0].split(';')[0].split('=')[1];
      }
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${refreshToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return 401 when refresh token is missing', async () => {
      const response = await request(app).post('/api/auth/refresh');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Refresh token required');
    });

    it('should return 401 when refresh token is invalid', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', 'refreshToken=invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid or expired refresh token');
    });
  });

  describe('POST /api/auth/logout', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Register and login to get tokens
      const loginResponse = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      // Extract refresh token from cookie
      const cookies = loginResponse.headers['set-cookie'];
      if (cookies && cookies[0]) {
        refreshToken = cookies[0].split(';')[0].split('=')[1];
      }
    });

    it('should logout and clear refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', `refreshToken=${refreshToken}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out successfully');

      // Verify refresh token is deleted
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });
      expect(tokenRecord).toBeNull();
    });

    it('should logout even without refresh token', async () => {
      const response = await request(app).post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Logged out successfully');
    });
  });
});

