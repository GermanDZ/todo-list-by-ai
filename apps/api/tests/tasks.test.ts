import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/services/prismaClient.js';
import { hashPassword } from '../src/services/authService.js';

describe('Tasks API', () => {
  const testUser1 = {
    email: 'user1@example.com',
    password: 'password123',
  };

  const testUser2 = {
    email: 'user2@example.com',
    password: 'password123',
  };

  let user1AccessToken: string;
  let user2AccessToken: string;
  let user1Id: string;
  let user2Id: string;

  beforeEach(async () => {
    // Clean up test data
    await prisma.task.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [testUser1.email, testUser2.email],
        },
      },
    });

    // Create test users and get access tokens
    const passwordHash1 = await hashPassword(testUser1.password);
    const user1 = await prisma.user.create({
      data: {
        email: testUser1.email,
        passwordHash: passwordHash1,
      },
    });
    user1Id = user1.id;

    const passwordHash2 = await hashPassword(testUser2.password);
    const user2 = await prisma.user.create({
      data: {
        email: testUser2.email,
        passwordHash: passwordHash2,
      },
    });
    user2Id = user2.id;

    // Login to get access tokens
    const login1 = await request(app).post('/api/auth/login').send(testUser1);
    user1AccessToken = login1.body.accessToken;

    const login2 = await request(app).post('/api/auth/login').send(testUser2);
    user2AccessToken = login2.body.accessToken;
  });

  afterEach(async () => {
    // Clean up after each test
    await prisma.task.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [testUser1.email, testUser2.email],
        },
      },
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a task with valid title', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ title: 'Test task' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test task');
      expect(response.body.completed).toBe(false);
      expect(response.body.userId).toBe(user1Id);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should return 401 when access token is missing', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({ title: 'Test task' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should return 400 when title is missing', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Task title is required');
    });

    it('should return 400 when title is empty', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ title: '   ' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Task title is required');
    });

    it('should return 400 when title is too long', async () => {
      const longTitle = 'a'.repeat(501);
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ title: longTitle });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Task title must be 500 characters or less');
    });

    it('should trim whitespace from title', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ title: '  Test task  ' });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('Test task');
    });

    it('should create a task with a due date', async () => {
      const dueDate = new Date('2026-12-31T00:00:00.000Z').toISOString();
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ title: 'Task with due date', dueDate });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('Task with due date');
      expect(response.body.dueDate).toBeTruthy();
      expect(new Date(response.body.dueDate).toISOString()).toBe(dueDate);
    });

    it('should create a task without a due date (null)', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ title: 'Task without due date', dueDate: null });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('Task without due date');
      expect(response.body.dueDate).toBeNull();
    });

    it('should return 400 when due date is invalid format', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ title: 'Task with invalid date', dueDate: 'invalid-date' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Due date must be a valid ISO 8601 date string');
      expect(response.body.details?.field).toBe('dueDate');
    });

    it('should create a task with a category', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ title: 'Task with category', category: 'Work' });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('Task with category');
      expect(response.body.category).toBe('Work');
    });

    it('should create a task without a category (null)', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ title: 'Task without category', category: null });

      expect(response.status).toBe(201);
      expect(response.body.title).toBe('Task without category');
      expect(response.body.category).toBeNull();
    });

    it('should trim whitespace from category', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ title: 'Task with trimmed category', category: '  Work  ' });

      expect(response.status).toBe(201);
      expect(response.body.category).toBe('Work');
    });

    it('should return 400 when category is too long', async () => {
      const longCategory = 'a'.repeat(51);
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ title: 'Task with long category', category: longCategory });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Category must be 50 characters or less');
      expect(response.body.details?.field).toBe('category');
    });

    it('should treat empty string category as null', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ title: 'Task with empty category', category: '   ' });

      expect(response.status).toBe(201);
      expect(response.body.category).toBeNull();
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      // Create tasks for user1
      await prisma.task.createMany({
        data: [
          { title: 'Task 1', userId: user1Id, completed: false },
          { title: 'Task 2', userId: user1Id, completed: true },
          { title: 'Task 3', userId: user1Id, completed: false },
        ],
      });

      // Create tasks for user2
      await prisma.task.create({
        data: { title: 'User 2 Task', userId: user2Id, completed: false },
      });
    });

    it('should return all tasks for authenticated user', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${user1AccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(3);
      expect(response.body.every((task: any) => task.userId === user1Id)).toBe(
        true
      );
    });

    it('should return only completed tasks when filtered', async () => {
      const response = await request(app)
        .get('/api/tasks?completed=true')
        .set('Authorization', `Bearer ${user1AccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].completed).toBe(true);
    });

    it('should return only incomplete tasks when filtered', async () => {
      const response = await request(app)
        .get('/api/tasks?completed=false')
        .set('Authorization', `Bearer ${user1AccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body.every((task: any) => task.completed === false)).toBe(
        true
      );
    });

    it('should not return tasks from other users', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${user1AccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.every((task: any) => task.title !== 'User 2 Task')).toBe(
        true
      );
    });

    it('should return 401 when access token is missing', async () => {
      const response = await request(app).get('/api/tasks');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should return tasks sorted by creation date (newest first)', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${user1AccessToken}`);

      expect(response.status).toBe(200);
      const dates = response.body.map((task: any) => new Date(task.createdAt));
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1].getTime()).toBeGreaterThanOrEqual(dates[i].getTime());
      }
    });
  });

  describe('PATCH /api/tasks/:id', () => {
    let taskId: string;

    beforeEach(async () => {
      const task = await prisma.task.create({
        data: { title: 'Original task', userId: user1Id, completed: false },
      });
      taskId = task.id;
    });

    it('should update task title', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ title: 'Updated task' });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated task');
      expect(response.body.completed).toBe(false);
    });

    it('should update task completion status', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ completed: true });

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(true);
      expect(response.body.title).toBe('Original task');
    });

    it('should update both title and completion status', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ title: 'Updated task', completed: true });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated task');
      expect(response.body.completed).toBe(true);
    });

    it('should return 404 when task does not exist', async () => {
      const response = await request(app)
        .patch('/api/tasks/non-existent-id')
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ title: 'Updated task' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
      expect(response.body.code).toBe('NOT_FOUND');
    });

    it('should return 404 when task belongs to another user', async () => {
      const user2Task = await prisma.task.create({
        data: { title: 'User 2 task', userId: user2Id, completed: false },
      });

      const response = await request(app)
        .patch(`/api/tasks/${user2Task.id}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ title: 'Updated task' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });

    it('should return 400 when title is invalid', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ title: '' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Task title is required');
    });

    it('should return 401 when access token is missing', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .send({ title: 'Updated task' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });

    it('should update task due date', async () => {
      const dueDate = new Date('2026-12-31T00:00:00.000Z').toISOString();
      const response = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ dueDate });

      expect(response.status).toBe(200);
      expect(response.body.dueDate).toBeTruthy();
      expect(new Date(response.body.dueDate).toISOString()).toBe(dueDate);
    });

    it('should clear task due date when set to null', async () => {
      // First set a due date
      const dueDate = new Date('2026-12-31T00:00:00.000Z').toISOString();
      await request(app)
        .patch(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ dueDate });

      // Then clear it
      const response = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ dueDate: null });

      expect(response.status).toBe(200);
      expect(response.body.dueDate).toBeNull();
    });

    it('should return 400 when due date is invalid format', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ dueDate: 'invalid-date' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Due date must be a valid ISO 8601 date string');
      expect(response.body.details?.field).toBe('dueDate');
    });

    it('should update both title and due date', async () => {
      const dueDate = new Date('2026-12-31T00:00:00.000Z').toISOString();
      const response = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ title: 'Updated task', dueDate });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated task');
      expect(response.body.dueDate).toBeTruthy();
      expect(new Date(response.body.dueDate).toISOString()).toBe(dueDate);
    });

    it('should update task category', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ category: 'Personal' });

      expect(response.status).toBe(200);
      expect(response.body.category).toBe('Personal');
    });

    it('should clear task category when set to null', async () => {
      // First set a category
      await request(app)
        .patch(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ category: 'Work' });

      // Then clear it
      const response = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ category: null });

      expect(response.status).toBe(200);
      expect(response.body.category).toBeNull();
    });

    it('should return 400 when category is too long', async () => {
      const longCategory = 'a'.repeat(51);
      const response = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ category: longCategory });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Category must be 50 characters or less');
      expect(response.body.details?.field).toBe('category');
    });

    it('should update both title and category', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user1AccessToken}`)
        .send({ title: 'Updated task', category: 'Work' });

      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Updated task');
      expect(response.body.category).toBe('Work');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    let taskId: string;

    beforeEach(async () => {
      const task = await prisma.task.create({
        data: { title: 'Task to delete', userId: user1Id, completed: false },
      });
      taskId = task.id;
    });

    it('should delete task', async () => {
      const response = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${user1AccessToken}`);

      expect(response.status).toBe(204);

      // Verify task is deleted
      const deletedTask = await prisma.task.findUnique({
        where: { id: taskId },
      });
      expect(deletedTask).toBeNull();
    });

    it('should return 404 when task does not exist', async () => {
      const response = await request(app)
        .delete('/api/tasks/non-existent-id')
        .set('Authorization', `Bearer ${user1AccessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });

    it('should return 404 when task belongs to another user', async () => {
      const user2Task = await prisma.task.create({
        data: { title: 'User 2 task', userId: user2Id, completed: false },
      });

      const response = await request(app)
        .delete(`/api/tasks/${user2Task.id}`)
        .set('Authorization', `Bearer ${user1AccessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });

    it('should return 401 when access token is missing', async () => {
      const response = await request(app).delete(`/api/tasks/${taskId}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('PATCH /api/tasks/:id/toggle', () => {
    let taskId: string;

    beforeEach(async () => {
      const task = await prisma.task.create({
        data: { title: 'Task to toggle', userId: user1Id, completed: false },
      });
      taskId = task.id;
    });

    it('should toggle task from incomplete to complete', async () => {
      const response = await request(app)
        .patch(`/api/tasks/${taskId}/toggle`)
        .set('Authorization', `Bearer ${user1AccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(true);
    });

    it('should toggle task from complete to incomplete', async () => {
      // First toggle to complete
      await request(app)
        .patch(`/api/tasks/${taskId}/toggle`)
        .set('Authorization', `Bearer ${user1AccessToken}`);

      // Then toggle back to incomplete
      const response = await request(app)
        .patch(`/api/tasks/${taskId}/toggle`)
        .set('Authorization', `Bearer ${user1AccessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.completed).toBe(false);
    });

    it('should update updatedAt timestamp', async () => {
      const taskBefore = await prisma.task.findUnique({
        where: { id: taskId },
      });
      const originalUpdatedAt = taskBefore!.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      const response = await request(app)
        .patch(`/api/tasks/${taskId}/toggle`)
        .set('Authorization', `Bearer ${user1AccessToken}`);

      expect(response.status).toBe(200);
      expect(new Date(response.body.updatedAt).getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });

    it('should return 404 when task does not exist', async () => {
      const response = await request(app)
        .patch('/api/tasks/non-existent-id/toggle')
        .set('Authorization', `Bearer ${user1AccessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });

    it('should return 404 when task belongs to another user', async () => {
      const user2Task = await prisma.task.create({
        data: { title: 'User 2 task', userId: user2Id, completed: false },
      });

      const response = await request(app)
        .patch(`/api/tasks/${user2Task.id}/toggle`)
        .set('Authorization', `Bearer ${user1AccessToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Task not found');
    });

    it('should return 401 when access token is missing', async () => {
      const response = await request(app).patch(`/api/tasks/${taskId}/toggle`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Access token required');
    });
  });

  describe('Due date functionality', () => {
    it('should return due date in task list', async () => {
      const dueDate = new Date('2026-12-31T00:00:00.000Z').toISOString();
      await prisma.task.create({
        data: {
          title: 'Task with due date',
          userId: user1Id,
          completed: false,
          dueDate: new Date(dueDate),
        },
      });

      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${user1AccessToken}`);

      expect(response.status).toBe(200);
      const taskWithDueDate = response.body.find(
        (task: any) => task.title === 'Task with due date'
      );
      expect(taskWithDueDate).toBeTruthy();
      expect(taskWithDueDate.dueDate).toBeTruthy();
      expect(new Date(taskWithDueDate.dueDate).toISOString()).toBe(dueDate);
    });

    it('should return null for tasks without due date', async () => {
      await prisma.task.create({
        data: {
          title: 'Task without due date',
          userId: user1Id,
          completed: false,
          dueDate: null,
        },
      });

      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${user1AccessToken}`);

      expect(response.status).toBe(200);
      const taskWithoutDueDate = response.body.find(
        (task: any) => task.title === 'Task without due date'
      );
      expect(taskWithoutDueDate).toBeTruthy();
      expect(taskWithoutDueDate.dueDate).toBeNull();
    });
  });

  describe('Category functionality', () => {
    it('should return category in task list', async () => {
      await prisma.task.create({
        data: {
          title: 'Task with category',
          userId: user1Id,
          completed: false,
          category: 'Work',
        },
      });

      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${user1AccessToken}`);

      expect(response.status).toBe(200);
      const taskWithCategory = response.body.find(
        (task: any) => task.title === 'Task with category'
      );
      expect(taskWithCategory).toBeTruthy();
      expect(taskWithCategory.category).toBe('Work');
    });

    it('should return null for tasks without category', async () => {
      await prisma.task.create({
        data: {
          title: 'Task without category',
          userId: user1Id,
          completed: false,
          category: null,
        },
      });

      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${user1AccessToken}`);

      expect(response.status).toBe(200);
      const taskWithoutCategory = response.body.find(
        (task: any) => task.title === 'Task without category'
      );
      expect(taskWithoutCategory).toBeTruthy();
      expect(taskWithoutCategory.category).toBeNull();
    });
  });
});

