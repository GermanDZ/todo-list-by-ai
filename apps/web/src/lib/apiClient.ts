import {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  RefreshResponse,
  LogoutResponse,
  ApiError,
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
} from '../types/api.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Store access token in memory (not localStorage)
let accessToken: string | null = null;
let refreshPromise: Promise<string> | null = null;

/**
 * Set the access token (called after login/register/refresh)
 */
export function setAccessToken(token: string | null) {
  accessToken = token;
}

/**
 * Get the current access token
 */
export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * Clear the access token (called on logout)
 */
export function clearAccessToken() {
  accessToken = null;
}

/**
 * Refresh the access token using the refresh token cookie
 */
async function refreshAccessToken(): Promise<string> {
  // If there's already a refresh in progress, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include', // Include cookies
      });

      if (!response.ok) {
        const error: ApiError = await response.json();
        throw new Error(error.error || 'Failed to refresh token');
      }

      const data: RefreshResponse = await response.json();
      accessToken = data.accessToken;
      return data.accessToken;
    } catch (error) {
      // Clear token on refresh failure
      accessToken = null;
      throw error;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Make an API request with automatic token management
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Add access token to headers if available
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include cookies for refresh token
  });

  // If 401, try to refresh token and retry
  if (response.status === 401 && accessToken) {
    try {
      const newToken = await refreshAccessToken();
      // Retry request with new token
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
      });
    } catch (refreshError) {
      // Refresh failed, clear token and throw
      accessToken = null;
      throw new Error('Session expired. Please log in again.');
    }
  }

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      error: 'An error occurred',
    }));
    throw new Error(error.error || 'An error occurred');
  }

  return response.json();
}

/**
 * Register a new user
 */
export async function register(
  data: RegisterRequest
): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  // Store access token
  if (response.accessToken) {
    setAccessToken(response.accessToken);
  }

  return response;
}

/**
 * Login with email and password
 */
export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  // Store access token
  if (response.accessToken) {
    setAccessToken(response.accessToken);
  }

  return response;
}

/**
 * Logout and clear tokens
 */
export async function logout(): Promise<LogoutResponse> {
  try {
    const response = await apiRequest<LogoutResponse>('/api/auth/logout', {
      method: 'POST',
    });
    clearAccessToken();
    return response;
  } catch (error) {
    // Clear token even if request fails
    clearAccessToken();
    throw error;
  }
}

/**
 * Generic API request method for other endpoints
 */
export async function api<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  return apiRequest<T>(endpoint, options);
}

/**
 * Create a new task
 */
export async function createTask(title: string): Promise<Task> {
  return apiRequest<Task>('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ title } as CreateTaskRequest),
  });
}

/**
 * Get tasks for the authenticated user
 */
export async function getTasks(completed?: boolean): Promise<Task[]> {
  const queryParam = completed !== undefined ? `?completed=${completed}` : '';
  return apiRequest<Task[]>(`/api/tasks${queryParam}`);
}

/**
 * Update a task
 */
export async function updateTask(
  id: string,
  data: UpdateTaskRequest
): Promise<Task> {
  return apiRequest<Task>(`/api/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Delete a task
 */
export async function deleteTask(id: string): Promise<void> {
  return apiRequest<void>(`/api/tasks/${id}`, {
    method: 'DELETE',
  });
}

/**
 * Toggle task completion status
 */
export async function toggleTask(id: string): Promise<Task> {
  return apiRequest<Task>(`/api/tasks/${id}/toggle`, {
    method: 'PATCH',
  });
}

