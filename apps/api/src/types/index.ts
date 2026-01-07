// Type definitions for the API
// Shared types will be imported from @taskflow/shared once that package is set up

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

export interface ApiError {
  error: string;
  code?: ErrorCode;
  details?: Record<string, unknown>;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}

// Authentication types
export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
  };
  accessToken: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Express.Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
  };
}

// Task types
export interface Task {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  dueDate: Date | null;
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskRequest {
  title: string;
  dueDate?: string | null;
}

export interface UpdateTaskRequest {
  title?: string;
  completed?: boolean;
  dueDate?: string | null;
}

export interface TaskResponse {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  dueDate: Date | null;
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
}
