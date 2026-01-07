import { Router, Request, Response, NextFunction } from 'express';
import prisma from '../services/prismaClient.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
  validateTaskTitle,
  validateDueDate,
  parseDueDate,
  validateCategory,
  parseCategory,
  verifyTaskOwnership,
} from '../services/taskService.js';
import {
  CreateTaskRequest,
  UpdateTaskRequest,
  AuthRequest,
  TaskResponse,
  ErrorCode,
} from '../types/index.js';
import { createError } from '../utils/errors.js';

const router = Router();

// All task routes require authentication
router.use(authenticateToken);

/**
 * POST /api/tasks
 * Create a new task
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, dueDate, category }: CreateTaskRequest = req.body;
    const userId = (req as AuthRequest).userId!;

    // Validate title
    const titleError = validateTaskTitle(title);
    if (titleError) {
      return next(createError(titleError, 400, ErrorCode.VALIDATION_ERROR, { field: 'title' }));
    }

    // Validate due date if provided
    const dueDateError = validateDueDate(dueDate);
    if (dueDateError) {
      return next(
        createError(dueDateError, 400, ErrorCode.VALIDATION_ERROR, { field: 'dueDate' })
      );
    }

    // Validate category if provided
    const categoryError = validateCategory(category);
    if (categoryError) {
      return next(
        createError(categoryError, 400, ErrorCode.VALIDATION_ERROR, { field: 'category' })
      );
    }

    // Parse due date and category
    const parsedDueDate = parseDueDate(dueDate);
    const parsedCategory = parseCategory(category);

    // Create task
    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        userId: userId,
        dueDate: parsedDueDate,
        category: parsedCategory,
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
    next(error);
  }
});

/**
 * GET /api/tasks
 * List tasks for the authenticated user
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
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
    return next(error);
  }
});

/**
 * PATCH /api/tasks/:id
 * Update a task
 */
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.id;
    const userId = (req as AuthRequest).userId!;
    const { title, completed, dueDate, category }: UpdateTaskRequest = req.body;

    // Verify task ownership
    const existingTask = await verifyTaskOwnership(taskId, userId);
    if (!existingTask) {
      return next(createError('Task not found', 404, ErrorCode.NOT_FOUND));
    }

    // Validate title if provided
    if (title !== undefined) {
      const titleError = validateTaskTitle(title);
      if (titleError) {
        return next(createError(titleError, 400, ErrorCode.VALIDATION_ERROR, { field: 'title' }));
      }
    }

    // Validate due date if provided
    if (dueDate !== undefined) {
      const dueDateError = validateDueDate(dueDate);
      if (dueDateError) {
        return next(
          createError(dueDateError, 400, ErrorCode.VALIDATION_ERROR, { field: 'dueDate' })
        );
      }
    }

    // Validate category if provided
    if (category !== undefined) {
      const categoryError = validateCategory(category);
      if (categoryError) {
        return next(
          createError(categoryError, 400, ErrorCode.VALIDATION_ERROR, { field: 'category' })
        );
      }
    }

    // Build update data
    const updateData: {
      title?: string;
      completed?: boolean;
      dueDate?: Date | null;
      category?: string | null;
    } = {};

    if (title !== undefined) {
      updateData.title = title.trim();
    }
    if (completed !== undefined) {
      updateData.completed = completed;
    }
    if (dueDate !== undefined) {
      updateData.dueDate = parseDueDate(dueDate);
    }
    if (category !== undefined) {
      updateData.category = parseCategory(category);
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
    return next(error);
  }
});

/**
 * DELETE /api/tasks/:id
 * Delete a task
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.id;
    const userId = (req as AuthRequest).userId!;

    // Verify task ownership
    const existingTask = await verifyTaskOwnership(taskId, userId);
    if (!existingTask) {
      return next(createError('Task not found', 404, ErrorCode.NOT_FOUND));
    }

    // Delete task
    await prisma.task.delete({
      where: { id: taskId },
    });

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
});

/**
 * PATCH /api/tasks/:id/toggle
 * Toggle task completion status
 */
router.patch('/:id/toggle', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const taskId = req.params.id;
    const userId = (req as AuthRequest).userId!;

    // Verify task ownership
    const existingTask = await verifyTaskOwnership(taskId, userId);
    if (!existingTask) {
      return next(createError('Task not found', 404, ErrorCode.NOT_FOUND));
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
    return next(error);
  }
});

export default router;

