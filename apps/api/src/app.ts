import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import {
  handleDatabaseError,
  isAppError,
  handleValidationError,
} from './utils/errors.js';
import { ErrorCode, AuthRequest } from './types/index.js';
import { Prisma } from '@prisma/client';

dotenv.config();

const app = express();

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Task routes
app.use('/api/tasks', taskRoutes);

// 404 handler for unknown routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    code: ErrorCode.NOT_FOUND,
    path: req.path,
  });
});

// Error handling middleware (must be last)
app.use(
  (
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
  ) => {
    // Log error with context
    console.error('Error:', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      userId: (req as AuthRequest).userId || 'anonymous',
    });

    // Handle known error types
    if (isAppError(err)) {
      return res.status(err.statusCode || 500).json({
        error: err.message,
        code: err.code,
        ...(err.details && { details: err.details }),
      });
    }

    // Handle Prisma errors
    if (err instanceof Prisma.PrismaClientKnownRequestError ||
        err instanceof Prisma.PrismaClientValidationError) {
      const handled = handleValidationError(err);
      return res.status(400).json({
        error: handled.message,
        code: handled.code,
        ...(handled.details && { details: handled.details }),
      });
    }

    // Handle database errors
    if (err.name === 'PrismaClientKnownRequestError' ||
        err.name === 'PrismaClientValidationError') {
      const dbError = handleDatabaseError(err);
      return res.status(dbError.statusCode || 500).json({
        error: dbError.message,
        code: dbError.code,
        ...(dbError.details && { details: dbError.details }),
      });
    }

    // Default error response
    return res.status(500).json({
      error: 'Internal server error',
      code: ErrorCode.INTERNAL_ERROR,
    });
  }
);

export default app;
