import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  setAccessToken,
  getAccessToken,
  clearAccessToken,
  register,
  login,
  logout,
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  toggleTask,
} from './apiClient.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAccessToken();
    (global.fetch as ReturnType<typeof vi.fn>).mockClear();
  });

  afterEach(() => {
    clearAccessToken();
  });

  describe('token_management', () => {
    it('should_set_and_get_access_token', () => {
      setAccessToken('test-token');
      expect(getAccessToken()).toBe('test-token');
    });

    it('should_clear_access_token', () => {
      setAccessToken('test-token');
      clearAccessToken();
      expect(getAccessToken()).toBeNull();
    });
  });

  describe('register', () => {
    it('should_register_user_and_store_token', async () => {
      const mockResponse = {
        user: { id: '1', email: 'test@example.com' },
        accessToken: 'access-token',
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await register({ email: 'test@example.com', password: 'password123' });

      expect(result).toEqual(mockResponse);
      expect(getAccessToken()).toBe('access-token');
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/register'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        })
      );
    });

    it('should_handle_registration_error', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: 'Email already exists' }),
      });

      await expect(
        register({ email: 'test@example.com', password: 'password123' })
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('login', () => {
    it('should_login_user_and_store_token', async () => {
      const mockResponse = {
        user: { id: '1', email: 'test@example.com' },
        accessToken: 'access-token',
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await login({ email: 'test@example.com', password: 'password123' });

      expect(result).toEqual(mockResponse);
      expect(getAccessToken()).toBe('access-token');
    });

    it('should_handle_login_error', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Invalid credentials' }),
      });

      await expect(
        login({ email: 'test@example.com', password: 'wrongpassword' })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('logout', () => {
    it('should_logout_and_clear_token', async () => {
      setAccessToken('test-token');

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Logged out' }),
      });

      await logout();

      expect(getAccessToken()).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/logout'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should_clear_token_even_if_logout_fails', async () => {
      setAccessToken('test-token');

      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      await expect(logout()).rejects.toThrow();
      expect(getAccessToken()).toBeNull();
    });
  });

  describe('createTask', () => {
    it('should_create_task_with_authorization', async () => {
      setAccessToken('test-token');
      const mockTask = {
        id: 'task-1',
        title: 'New task',
        completed: false,
        userId: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTask,
      });

      const result = await createTask('New task');

      expect(result).toEqual(mockTask);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tasks'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should_create_task_with_due_date_and_category', async () => {
      setAccessToken('test-token');
      const mockTask = {
        id: 'task-1',
        title: 'New task',
        dueDate: '2026-12-31T00:00:00.000Z',
        category: 'Work',
        completed: false,
        userId: 'user-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTask,
      });

      await createTask('New task', '2026-12-31T00:00:00.000Z', 'Work');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tasks'),
        expect.objectContaining({
          body: JSON.stringify({
            title: 'New task',
            dueDate: '2026-12-31T00:00:00.000Z',
            category: 'Work',
          }),
        })
      );
    });
  });

  describe('getTasks', () => {
    it('should_fetch_tasks_with_authorization', async () => {
      setAccessToken('test-token');
      const mockTasks = [
        { id: 'task-1', title: 'Task 1', completed: false },
        { id: 'task-2', title: 'Task 2', completed: true },
      ];

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTasks,
      });

      const result = await getTasks();

      expect(result).toEqual(mockTasks);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tasks'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    it('should_fetch_tasks_with_completed_filter', async () => {
      setAccessToken('test-token');

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await getTasks(true);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tasks?completed=true'),
        expect.any(Object)
      );
    });
  });

  describe('updateTask', () => {
    it('should_update_task', async () => {
      setAccessToken('test-token');
      const mockTask = {
        id: 'task-1',
        title: 'Updated task',
        completed: false,
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTask,
      });

      const result = await updateTask('task-1', { title: 'Updated task' });

      expect(result).toEqual(mockTask);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tasks/task-1'),
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ title: 'Updated task' }),
        })
      );
    });
  });

  describe('deleteTask', () => {
    it('should_delete_task', async () => {
      setAccessToken('test-token');

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await deleteTask('task-1');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tasks/task-1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('toggleTask', () => {
    it('should_toggle_task', async () => {
      setAccessToken('test-token');
      const mockTask = {
        id: 'task-1',
        title: 'Task',
        completed: true,
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTask,
      });

      const result = await toggleTask('task-1');

      expect(result).toEqual(mockTask);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/tasks/task-1/toggle'),
        expect.objectContaining({
          method: 'PATCH',
        })
      );
    });
  });

  describe('error_handling', () => {
    it('should_handle_network_errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new TypeError('Failed to fetch')
      );

      await expect(getTasks()).rejects.toThrow('Network error');
    });

    it('should_handle_401_with_token_refresh', async () => {
      setAccessToken('expired-token');
      const refreshResponse = {
        accessToken: 'new-token',
      };
      const tasksResponse = [{ id: 'task-1', title: 'Task' }];

      // First call returns 401, refresh succeeds, retry succeeds
      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => refreshResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => tasksResponse,
        });

      const result = await getTasks();

      expect(result).toEqual(tasksResponse);
      expect(getAccessToken()).toBe('new-token');
    });

    it('should_handle_refresh_failure', async () => {
      setAccessToken('expired-token');

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: false,
          status: 401,
        })
        .mockRejectedValueOnce(new Error('Refresh failed'));

      await expect(getTasks()).rejects.toThrow('Session expired');
      expect(getAccessToken()).toBeNull();
    });
  });
});

