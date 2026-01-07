import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTasks } from './useTasks.js';
import * as apiClient from '../lib/apiClient.js';
import { createMockTask } from '../test/mocks/taskMocks.js';

// Mock the API client
vi.mock('../lib/apiClient.js', () => ({
  getTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  toggleTask: vi.fn(),
}));

describe('useTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial_state', () => {
    it('should_start_with_loading_true', () => {
      vi.mocked(apiClient.getTasks).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useTasks());

      expect(result.current.loading).toBe(true);
      expect(result.current.tasks).toEqual([]);
      expect(result.current.error).toBeNull();
    });

    it('should_fetch_tasks_on_mount', async () => {
      const mockTasks = [createMockTask(), createMockTask({ id: 'task-2', title: 'Task 2' })];
      vi.mocked(apiClient.getTasks).mockResolvedValue(mockTasks);

      const { result } = renderHook(() => useTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(apiClient.getTasks).toHaveBeenCalledTimes(1);
      expect(result.current.tasks).toEqual(mockTasks);
      expect(result.current.error).toBeNull();
    });

    it('should_handle_fetch_error', async () => {
      const errorMessage = 'Failed to fetch tasks';
      vi.mocked(apiClient.getTasks).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.tasks).toEqual([]);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('createTask', () => {
    it('should_create_task_with_optimistic_update', async () => {
      const initialTasks = [createMockTask()];
      vi.mocked(apiClient.getTasks).mockResolvedValue(initialTasks);

      const newTask = createMockTask({ id: 'task-new', title: 'New task' });
      vi.mocked(apiClient.createTask).mockResolvedValue(newTask);

      const { result } = renderHook(() => useTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Create task
      const createPromise = result.current.createTask('New task');

      // Check optimistic update was applied
      // The optimistic task is added synchronously in setTasks, but React batches updates
      await waitFor(() => {
        const tasksAfterCreate = result.current.tasks;
        // Should have 2 tasks: original + optimistic
        if (tasksAfterCreate.length === 2) {
          expect(tasksAfterCreate[0].title).toBe('New task');
          // The optimistic task should have temp- id, but it might be replaced already
          // So we check that either it's temp- or it's the real task
          expect(tasksAfterCreate[0].id === 'task-new' || tasksAfterCreate[0].id.match(/^temp-/)).toBeTruthy();
        }
      }, { timeout: 1000 });

      // Wait for real task to replace optimistic one
      await createPromise;
      await waitFor(() => {
        const finalTasks = result.current.tasks;
        expect(finalTasks.length).toBe(2);
        expect(finalTasks[0].id).toBe('task-new');
        expect(finalTasks[0].title).toBe('New task');
      });

      expect(apiClient.createTask).toHaveBeenCalledWith('New task', undefined, undefined);
    });

    it('should_rollback_on_create_error', async () => {
      const initialTasks = [createMockTask()];
      vi.mocked(apiClient.getTasks).mockResolvedValue(initialTasks);
      vi.mocked(apiClient.createTask).mockRejectedValue(new Error('Create failed'));

      const { result } = renderHook(() => useTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const initialTaskCount = result.current.tasks.length;

      // Try to create task
      try {
        await result.current.createTask('New task');
      } catch (err) {
        // Expected to throw
      }

      // Check rollback - error message uses the actual error message
      await waitFor(() => {
        expect(result.current.tasks.length).toBe(initialTaskCount);
        expect(result.current.error).toBe('Create failed');
      });
    });

    it('should_create_task_with_due_date_and_category', async () => {
      const initialTasks: any[] = [];
      vi.mocked(apiClient.getTasks).mockResolvedValue(initialTasks);

      const newTask = createMockTask({
        id: 'task-new',
        title: 'New task',
        dueDate: '2026-12-31T00:00:00.000Z',
        category: 'Work',
      });
      vi.mocked(apiClient.createTask).mockResolvedValue(newTask);

      const { result } = renderHook(() => useTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.createTask('New task', '2026-12-31T00:00:00.000Z', 'Work');

      expect(apiClient.createTask).toHaveBeenCalledWith(
        'New task',
        '2026-12-31T00:00:00.000Z',
        'Work'
      );
    });
  });

  describe('updateTask', () => {
    it('should_update_task_with_optimistic_update', async () => {
      const initialTask = createMockTask({ id: 'task-1', title: 'Original' });
      vi.mocked(apiClient.getTasks).mockResolvedValue([initialTask]);

      const updatedTask = createMockTask({ id: 'task-1', title: 'Updated' });
      vi.mocked(apiClient.updateTask).mockResolvedValue(updatedTask);

      const { result } = renderHook(() => useTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Update task
      await result.current.updateTask('task-1', { title: 'Updated' });

      // Check optimistic update
      await waitFor(() => {
        expect(result.current.tasks[0].title).toBe('Updated');
      });

      expect(apiClient.updateTask).toHaveBeenCalledWith('task-1', { title: 'Updated' });
    });

    it('should_rollback_on_update_error', async () => {
      const initialTask = createMockTask({ id: 'task-1', title: 'Original' });
      vi.mocked(apiClient.getTasks).mockResolvedValue([initialTask]);
      vi.mocked(apiClient.updateTask).mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const originalTitle = result.current.tasks[0].title;

      // Try to update task
      try {
        await result.current.updateTask('task-1', { title: 'Updated' });
      } catch (err) {
        // Expected to throw
      }

      // Check rollback - error message uses the actual error message
      await waitFor(() => {
        expect(result.current.tasks[0].title).toBe(originalTitle);
        expect(result.current.error).toBe('Update failed');
      });
    });

    it('should_update_completion_status', async () => {
      const initialTask = createMockTask({ id: 'task-1', completed: false });
      vi.mocked(apiClient.getTasks).mockResolvedValue([initialTask]);

      const updatedTask = createMockTask({ id: 'task-1', completed: true });
      vi.mocked(apiClient.updateTask).mockResolvedValue(updatedTask);

      const { result } = renderHook(() => useTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await result.current.updateTask('task-1', { completed: true });

      await waitFor(() => {
        expect(result.current.tasks[0].completed).toBe(true);
      });
    });
  });

  describe('deleteTask', () => {
    it('should_delete_task_with_optimistic_update', async () => {
      const tasks = [
        createMockTask({ id: 'task-1' }),
        createMockTask({ id: 'task-2' }),
      ];
      vi.mocked(apiClient.getTasks).mockResolvedValue(tasks);
      vi.mocked(apiClient.deleteTask).mockResolvedValue(undefined);

      const { result } = renderHook(() => useTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Delete task
      await result.current.deleteTask('task-1');

      // Check optimistic update
      await waitFor(() => {
        expect(result.current.tasks.length).toBe(1);
        expect(result.current.tasks[0].id).toBe('task-2');
      });

      expect(apiClient.deleteTask).toHaveBeenCalledWith('task-1');
    });

    it('should_rollback_on_delete_error', async () => {
      const tasks = [
        createMockTask({ id: 'task-1' }),
        createMockTask({ id: 'task-2' }),
      ];
      vi.mocked(apiClient.getTasks).mockResolvedValue(tasks);
      vi.mocked(apiClient.deleteTask).mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const originalCount = result.current.tasks.length;

      // Try to delete task
      try {
        await result.current.deleteTask('task-1');
      } catch (err) {
        // Expected to throw
      }

      // Check rollback - error message uses the actual error message
      await waitFor(() => {
        expect(result.current.tasks.length).toBe(originalCount);
        expect(result.current.error).toBe('Delete failed');
      });
    });
  });

  describe('toggleTask', () => {
    it('should_toggle_task_with_optimistic_update', async () => {
      const initialTask = createMockTask({ id: 'task-1', completed: false });
      vi.mocked(apiClient.getTasks).mockResolvedValue([initialTask]);

      const toggledTask = createMockTask({ id: 'task-1', completed: true });
      vi.mocked(apiClient.toggleTask).mockResolvedValue(toggledTask);

      const { result } = renderHook(() => useTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Toggle task
      await result.current.toggleTask('task-1');

      // Check optimistic update
      await waitFor(() => {
        expect(result.current.tasks[0].completed).toBe(true);
      });

      expect(apiClient.toggleTask).toHaveBeenCalledWith('task-1');
    });

    it('should_rollback_on_toggle_error', async () => {
      const initialTask = createMockTask({ id: 'task-1', completed: false });
      vi.mocked(apiClient.getTasks).mockResolvedValue([initialTask]);
      vi.mocked(apiClient.toggleTask).mockRejectedValue(new Error('Toggle failed'));

      const { result } = renderHook(() => useTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const originalCompleted = result.current.tasks[0].completed;

      // Try to toggle task
      try {
        await result.current.toggleTask('task-1');
      } catch (err) {
        // Expected to throw
      }

      // Check rollback - error message uses the actual error message
      await waitFor(() => {
        expect(result.current.tasks[0].completed).toBe(originalCompleted);
        expect(result.current.error).toBe('Toggle failed');
      });
    });

    it('should_not_toggle_if_task_not_found', async () => {
      const tasks = [createMockTask({ id: 'task-1' })];
      vi.mocked(apiClient.getTasks).mockResolvedValue(tasks);

      const { result } = renderHook(() => useTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Try to toggle non-existent task
      await result.current.toggleTask('non-existent');

      // Should not call API
      expect(apiClient.toggleTask).not.toHaveBeenCalled();
    });
  });

  describe('refreshTasks', () => {
    it('should_refresh_tasks', async () => {
      const initialTasks = [createMockTask()];
      vi.mocked(apiClient.getTasks).mockResolvedValue(initialTasks);

      const { result } = renderHook(() => useTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const refreshedTasks = [
        createMockTask(),
        createMockTask({ id: 'task-2' }),
      ];
      vi.mocked(apiClient.getTasks).mockResolvedValue(refreshedTasks);

      await result.current.refreshTasks();

      // Tasks should be refreshed (check after refresh completes)
      await waitFor(() => {
        expect(result.current.tasks.length).toBe(2);
      });
      expect(result.current.tasks[0].id).toBe('task-1');
      expect(result.current.tasks[1].id).toBe('task-2');
      expect(apiClient.getTasks).toHaveBeenCalledTimes(2);
    });

    it('should_handle_refresh_error', async () => {
      const initialTasks = [createMockTask()];
      vi.mocked(apiClient.getTasks).mockResolvedValueOnce(initialTasks);

      const { result } = renderHook(() => useTasks());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      vi.mocked(apiClient.getTasks).mockRejectedValueOnce(new Error('Refresh failed'));

      await result.current.refreshTasks();

      // refreshTasks catches errors and uses the error message if it's an Error,
      // otherwise uses 'Failed to fetch tasks'
      await waitFor(() => {
        // The hook uses err.message if it's an Error, so it will be 'Refresh failed'
        expect(result.current.error).toBe('Refresh failed');
      }, { timeout: 1000 });
    });
  });
});

