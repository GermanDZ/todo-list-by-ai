// Type definitions for the API
// Shared types will be imported from @taskflow/shared once that package is set up

export interface ApiError {
  error: string;
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
