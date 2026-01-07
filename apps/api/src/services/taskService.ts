import prisma from './prismaClient.js';
import { Task } from '../types/index.js';

/**
 * Validate task title
 * @param title - Task title to validate
 * @returns Error message if invalid, null if valid
 */
export function validateTaskTitle(title: string): string | null {
  if (!title || title.trim().length === 0) {
    return 'Task title is required';
  }
  if (title.length > 500) {
    return 'Task title must be 500 characters or less';
  }
  return null;
}

/**
 * Validate due date format
 * @param dueDate - Due date string to validate (ISO 8601 format)
 * @returns Error message if invalid, null if valid
 */
export function validateDueDate(dueDate: string | null | undefined): string | null {
  if (dueDate === null || dueDate === undefined) {
    return null; // null is valid (optional field)
  }

  if (typeof dueDate !== 'string') {
    return 'Due date must be a string';
  }

  // Check if it's a valid ISO 8601 date string
  const date = new Date(dueDate);
  if (isNaN(date.getTime())) {
    return 'Due date must be a valid ISO 8601 date string';
  }

  return null;
}

/**
 * Parse and validate due date, returning Date object or null
 * @param dueDate - Due date string to parse
 * @returns Date object if valid, null if null/undefined/invalid
 */
export function parseDueDate(dueDate: string | null | undefined): Date | null {
  if (!dueDate) {
    return null;
  }

  const date = new Date(dueDate);
  if (isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/**
 * Validate category
 * @param category - Category string to validate
 * @returns Error message if invalid, null if valid
 */
export function validateCategory(category: string | null | undefined): string | null {
  if (category === null || category === undefined) {
    return null; // null is valid (optional field)
  }

  if (typeof category !== 'string') {
    return 'Category must be a string';
  }

  // Trim whitespace and check length
  const trimmed = category.trim();
  if (trimmed.length === 0) {
    return null; // Empty string after trim is treated as null (optional field)
  }

  if (trimmed.length > 50) {
    return 'Category must be 50 characters or less';
  }

  return null;
}

/**
 * Parse and normalize category, returning trimmed string or null
 * @param category - Category string to parse
 * @returns Trimmed string if valid and non-empty, null otherwise
 */
export function parseCategory(category: string | null | undefined): string | null {
  if (!category) {
    return null;
  }

  const trimmed = category.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Verify that a task belongs to a user
 * @param taskId - Task ID
 * @param userId - User ID
 * @returns Task if found and owned by user, null otherwise
 */
export async function verifyTaskOwnership(
  taskId: string,
  userId: string
): Promise<Task | null> {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      userId: userId,
    },
  });

  if (!task) {
    return null;
  }

  return task as Task;
}

