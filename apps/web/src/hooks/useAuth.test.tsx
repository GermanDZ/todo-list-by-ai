import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAuth } from './useAuth.js';
import * as apiClient from '../lib/apiClient.js';
import { createMockUser } from '../test/mocks/userMocks.js';

// Mock the API client
vi.mock('../lib/apiClient.js', () => ({
  register: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
  getAccessToken: vi.fn(),
}));

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.getAccessToken).mockReturnValue(null);
  });

  describe('initial_state', () => {
    it('should_start_with_no_user', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should_be_authenticated_if_token_exists', () => {
      vi.mocked(apiClient.getAccessToken).mockReturnValue('valid-token');

      const { result } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe('register', () => {
    it('should_register_user_successfully', async () => {
      const mockUser = createMockUser();
      const mockResponse = {
        user: mockUser,
        accessToken: 'access-token',
      };
      vi.mocked(apiClient.register).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth());

      const registerData = { email: 'test@example.com', password: 'password123' };
      await result.current.register(registerData);

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.error).toBeNull();
      });

      expect(apiClient.register).toHaveBeenCalledWith(registerData);
    });

    it('should_handle_registration_error', async () => {
      const errorMessage = 'Registration failed';
      vi.mocked(apiClient.register).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAuth());

      const registerData = { email: 'test@example.com', password: 'password123' };

      try {
        await result.current.register(registerData);
      } catch (err) {
        // Expected to throw
      }

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.error).toBe(errorMessage);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should_set_loading_state_during_registration', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(apiClient.register).mockReturnValue(promise as any);

      const { result } = renderHook(() => useAuth());

      const registerData = { email: 'test@example.com', password: 'password123' };
      const registerPromise = result.current.register(registerData);

      // Check loading state immediately (before promise resolves)
      // Note: In React 18+, state updates are batched, so we need to check after a microtask
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      resolvePromise!({
        user: createMockUser(),
        accessToken: 'token',
      });

      await registerPromise;

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('login', () => {
    it('should_login_user_successfully', async () => {
      const mockUser = createMockUser();
      const mockResponse = {
        user: mockUser,
        accessToken: 'access-token',
      };
      vi.mocked(apiClient.login).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAuth());

      const loginData = { email: 'test@example.com', password: 'password123' };
      await result.current.login(loginData);

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.error).toBeNull();
      });

      expect(apiClient.login).toHaveBeenCalledWith(loginData);
    });

    it('should_handle_login_error', async () => {
      const errorMessage = 'Invalid credentials';
      vi.mocked(apiClient.login).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAuth());

      const loginData = { email: 'test@example.com', password: 'wrongpassword' };

      try {
        await result.current.login(loginData);
      } catch (err) {
        // Expected to throw
      }

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.error).toBe(errorMessage);
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should_set_loading_state_during_login', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(apiClient.login).mockReturnValue(promise as any);

      const { result } = renderHook(() => useAuth());

      const loginData = { email: 'test@example.com', password: 'password123' };
      const loginPromise = result.current.login(loginData);

      // Check loading state immediately (before promise resolves)
      // Note: In React 18+, state updates are batched
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      resolvePromise!({
        user: createMockUser(),
        accessToken: 'token',
      });

      await loginPromise;

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('logout', () => {
    it('should_logout_user_successfully', async () => {
      const mockUser = createMockUser();
      vi.mocked(apiClient.login).mockResolvedValue({
        user: mockUser,
        accessToken: 'token',
      });
      vi.mocked(apiClient.logout).mockResolvedValue({ message: 'Logged out' });

      const { result } = renderHook(() => useAuth());

      // Login first
      await result.current.login({ email: 'test@example.com', password: 'password123' });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      // Logout
      await result.current.logout();

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
        expect(result.current.error).toBeNull();
      });

      expect(apiClient.logout).toHaveBeenCalled();
    });

    it('should_clear_user_even_if_logout_fails', async () => {
      const mockUser = createMockUser();
      vi.mocked(apiClient.login).mockResolvedValue({
        user: mockUser,
        accessToken: 'token',
      });
      vi.mocked(apiClient.logout).mockRejectedValue(new Error('Logout failed'));

      const { result } = renderHook(() => useAuth());

      // Login first
      await result.current.login({ email: 'test@example.com', password: 'password123' });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      // Logout (should fail but clear user)
      await result.current.logout();

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.isAuthenticated).toBe(false);
      });
    });

    it('should_set_loading_state_during_logout', async () => {
      const mockUser = createMockUser();
      vi.mocked(apiClient.login).mockResolvedValue({
        user: mockUser,
        accessToken: 'token',
      });
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(apiClient.logout).mockReturnValue(promise as any);

      const { result } = renderHook(() => useAuth());

      // Login first
      await result.current.login({ email: 'test@example.com', password: 'password123' });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });

      // Logout
      const logoutPromise = result.current.logout();

      // Check loading state immediately (before promise resolves)
      // Note: In React 18+, state updates are batched
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      resolvePromise!({ message: 'Logged out' });

      await logoutPromise;

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('setUser', () => {
    it('should_set_user_manually', () => {
      const { result } = renderHook(() => useAuth());

      const mockUser = createMockUser();
      act(() => {
        result.current.setUser(mockUser);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should_clear_user_when_set_to_null', () => {
      const { result } = renderHook(() => useAuth());

      const mockUser = createMockUser();
      result.current.setUser(mockUser);
      result.current.setUser(null);

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('clearError', () => {
    it('should_clear_error', async () => {
      vi.mocked(apiClient.login).mockRejectedValue(new Error('Login failed'));

      const { result } = renderHook(() => useAuth());

      try {
        await result.current.login({ email: 'test@example.com', password: 'wrong' });
      } catch (err) {
        // Expected to throw
      }

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('checkAuth', () => {
    it('should_return_true_when_token_exists', () => {
      vi.mocked(apiClient.getAccessToken).mockReturnValue('valid-token');

      const { result } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should_return_false_when_no_token', () => {
      vi.mocked(apiClient.getAccessToken).mockReturnValue(null);

      const { result } = renderHook(() => useAuth());

      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});

