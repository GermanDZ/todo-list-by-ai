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

