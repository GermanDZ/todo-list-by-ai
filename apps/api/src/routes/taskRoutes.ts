import { Router, Request, Response } from 'express';
import prisma from '../services/prismaClient.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { validateTaskTitle, verifyTaskOwnership } from '../services/taskService.js';
import {
  CreateTaskRequest,
  UpdateTaskRequest,
  AuthRequest,
  TaskResponse,
} from '../types/index.js';

const router = Router();

// All task routes require authentication
router.use(authenticateToken);

/**
 * POST /api/tasks
 * Create a new task
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { title }: CreateTaskRequest = req.body;
    const userId = (req as AuthRequest).userId!;

    // Validate title
    const titleError = validateTaskTitle(title);
    if (titleError) {
      return res.status(400).json({ error: titleError });
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        userId: userId,
      },
    });

    const response: TaskResponse = {
      id: task.id,
      userId: task.userId,
      title: task.title,
      completed: task.completed,
      dueDate: task.dueDate,
      category: task.category,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };

    return res.status(201).json(response);
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({ error: 'Failed to create task' });
  }
});

/**
 * GET /api/tasks
 * List tasks for the authenticated user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthRequest).userId!;
    const completed = req.query.completed;

    // Build where clause
    const where: { userId: string; completed?: boolean } = {
      userId: userId,
    };

    if (completed === 'true') {
      where.completed = true;
    } else if (completed === 'false') {
      where.completed = false;
    }

    // Fetch tasks
    const tasks = await prisma.task.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    const response: TaskResponse[] = tasks.map((task) => ({
      id: task.id,
      userId: task.userId,
      title: task.title,
      completed: task.completed,
      dueDate: task.dueDate,
      category: task.category,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    }));

    return res.json(response);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

/**
 * PATCH /api/tasks/:id
 * Update a task
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const taskId = req.params.id;
    const userId = (req as AuthRequest).userId!;
    const { title, completed }: UpdateTaskRequest = req.body;

    // Verify task ownership
    const existingTask = await verifyTaskOwnership(taskId, userId);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Validate title if provided
    if (title !== undefined) {
      const titleError = validateTaskTitle(title);
      if (titleError) {
        return res.status(400).json({ error: titleError });
      }
    }

    // Build update data
    const updateData: {
      title?: string;
      completed?: boolean;
    } = {};

    if (title !== undefined) {
      updateData.title = title.trim();
    }
    if (completed !== undefined) {
      updateData.completed = completed;
    }

    // Update task
    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
    });

    const response: TaskResponse = {
      id: task.id,
      userId: task.userId,
      title: task.title,
      completed: task.completed,
      dueDate: task.dueDate,
      category: task.category,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };

    return res.json(response);
  } catch (error) {
    console.error('Error updating task:', error);
    return res.status(500).json({ error: 'Failed to update task' });
  }
});

/**
 * DELETE /api/tasks/:id
 * Delete a task
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const taskId = req.params.id;
    const userId = (req as AuthRequest).userId!;

    // Verify task ownership
    const existingTask = await verifyTaskOwnership(taskId, userId);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Delete task
    await prisma.task.delete({
      where: { id: taskId },
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    return res.status(500).json({ error: 'Failed to delete task' });
  }
});

/**
 * PATCH /api/tasks/:id/toggle
 * Toggle task completion status
 */
router.patch('/:id/toggle', async (req: Request, res: Response) => {
  try {
    const taskId = req.params.id;
    const userId = (req as AuthRequest).userId!;

    // Verify task ownership
    const existingTask = await verifyTaskOwnership(taskId, userId);
    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Toggle completion
    const task = await prisma.task.update({
      where: { id: taskId },
      data: {
        completed: !existingTask.completed,
      },
    });

    const response: TaskResponse = {
      id: task.id,
      userId: task.userId,
      title: task.title,
      completed: task.completed,
      dueDate: task.dueDate,
      category: task.category,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };

    return res.json(response);
  } catch (error) {
    console.error('Error toggling task:', error);
    return res.status(500).json({ error: 'Failed to toggle task' });
  }
});

export default router;

