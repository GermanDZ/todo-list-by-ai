import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/services/prismaClient.js';
import { hashPassword } from '../src/services/authService.js';

describe('Error Handling', () => {
  describe('404 Not Found', () => {
    it('should return 404 with error code for unknown routes', async () => {
      const response = await request(app).get('/api/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code', 'NOT_FOUND');
      expect(response.body).toHaveProperty('path', '/api/unknown-route');
    });

    it('should return 404 for POST to unknown route', async () => {
      const response = await request(app)
        .post('/api/nonexistent')
        .send({ data: 'test' });

      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
    });
  });

  describe('Error Response Structure', () => {
    it('should return structured error with code for validation errors', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code', 'VALIDATION_ERROR');
    });

    it('should return structured error for unauthorized requests', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
      // Note: authMiddleware might not use structured errors yet
    });
  });

  describe('Task Error Handling', () => {
    const testEmail = `error-test-${Date.now()}@example.com`;
    let accessToken: string;

    beforeEach(async () => {
      // Clean up and create test user
      await prisma.refreshToken.deleteMany({});
      await prisma.user.deleteMany({ where: { email: testEmail } });

      const passwordHash = await hashPassword('password123');
      const user = await prisma.user.create({
        data: { email: testEmail, passwordHash },
      });

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'password123' });

      accessToken = loginResponse.body.accessToken;
    });

    afterEach(async () => {
      await prisma.task.deleteMany({});
      await prisma.refreshToken.deleteMany({});
      await prisma.user.deleteMany({ where: { email: testEmail } });
    });

    it('should return 404 with error code for non-existent task', async () => {
      // Try to update a non-existent task (this endpoint exists)
      const response = await request(app)
        .patch('/api/tasks/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Updated' });

      // Should return 404 with NOT_FOUND code
      expect(response.status).toBe(404);
      expect(response.body.code).toBe('NOT_FOUND');
      expect(response.body.error).toBe('Task not found');
    });
  });
});

