// API request and response types for frontend

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface LogoutResponse {
  message: string;
}

// Task types
export interface Task {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  dueDate: string | null;
  category: string | null;
  createdAt: string;
  updatedAt: string;
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

