// Type definitions for the API
// Shared types will be imported from @taskflow/shared once that package is set up

export interface ApiError {
  error: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}
