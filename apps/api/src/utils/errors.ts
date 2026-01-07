import { Prisma } from '@prisma/client';
import { ErrorCode } from '../types/index.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: ErrorCode;
  details?: Record<string, unknown>;
}

/**
 * Create a structured application error
 */
export function createError(
  message: string,
  statusCode: number = 500,
  code: ErrorCode = ErrorCode.INTERNAL_ERROR,
  details?: Record<string, unknown>
): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  return error;
}

/**
 * Handle Prisma validation errors
 */
export function handleValidationError(
  error: unknown
): { message: string; code: ErrorCode; details?: Record<string, unknown> } {
  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      message: 'Invalid data provided',
      code: ErrorCode.VALIDATION_ERROR,
      details: { originalError: error.message },
    };
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle unique constraint violations
    if (error.code === 'P2002') {
      const target = (error.meta?.target as string[]) || [];
      return {
        message: `${target.join(', ')} already exists`,
        code: ErrorCode.CONFLICT,
        details: { field: target },
      };
    }

    // Handle record not found
    if (error.code === 'P2025') {
      return {
        message: 'Record not found',
        code: ErrorCode.NOT_FOUND,
      };
    }

    return {
      message: 'Database operation failed',
      code: ErrorCode.DATABASE_ERROR,
      details: { code: error.code },
    };
  }

  // Default validation error
  return {
    message: 'Validation failed',
    code: ErrorCode.VALIDATION_ERROR,
  };
}

/**
 * Handle database errors
 */
export function handleDatabaseError(error: unknown): AppError {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    const validation = handleValidationError(error);
    return createError(
      validation.message,
      400,
      validation.code,
      validation.details
    );
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return createError(
      'Invalid database query',
      400,
      ErrorCode.VALIDATION_ERROR
    );
  }

  // Generic database error
  return createError(
    'Database operation failed',
    500,
    ErrorCode.DATABASE_ERROR
  );
}

/**
 * Check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return (
    error instanceof Error &&
    'statusCode' in error &&
    'code' in error
  );
}

