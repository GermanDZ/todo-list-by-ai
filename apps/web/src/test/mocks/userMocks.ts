import { User } from '../../types/api.js';

/**
 * Create a mock user with optional overrides
 */
export function createMockUser(overrides: Partial<User> = {}): User {
  const now = new Date().toISOString();
  return {
    id: 'user-1',
    email: 'test@example.com',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

