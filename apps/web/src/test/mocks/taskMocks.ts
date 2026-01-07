import { Task } from '../../types/api.js';

/**
 * Create a mock task with optional overrides
 */
export function createMockTask(overrides: Partial<Task> = {}): Task {
  const now = new Date().toISOString();
  return {
    id: 'task-1',
    userId: 'user-1',
    title: 'Test task',
    completed: false,
    dueDate: null,
    category: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Create multiple mock tasks
 */
export function createMockTasks(count: number, overrides: Partial<Task>[] = []): Task[] {
  return Array.from({ length: count }, (_, i) => {
    const taskOverrides = overrides[i] || {};
    return createMockTask({
      id: `task-${i + 1}`,
      title: `Test task ${i + 1}`,
      ...taskOverrides,
    });
  });
}

/**
 * Create a completed task
 */
export function createMockCompletedTask(overrides: Partial<Task> = {}): Task {
  return createMockTask({
    completed: true,
    ...overrides,
  });
}

/**
 * Create a task with due date
 */
export function createMockTaskWithDueDate(dueDate: string, overrides: Partial<Task> = {}): Task {
  return createMockTask({
    dueDate,
    ...overrides,
  });
}

/**
 * Create a task with category
 */
export function createMockTaskWithCategory(category: string, overrides: Partial<Task> = {}): Task {
  return createMockTask({
    category,
    ...overrides,
  });
}

