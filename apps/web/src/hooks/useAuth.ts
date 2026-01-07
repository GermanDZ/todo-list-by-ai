import { useState, useCallback } from 'react';
import { User, RegisterRequest, LoginRequest } from '../types/api.js';
import { register, login, logout, getAccessToken } from '../lib/apiClient.js';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  const setUser = useCallback((user: User | null) => {
    setState((prev) => ({
      ...prev,
      user,
      isAuthenticated: !!user,
      error: null,
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({
      ...prev,
      error,
      isLoading: false,
    }));
  }, []);

  const handleRegister = useCallback(
    async (data: RegisterRequest) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await register(data);
        setUser(response.user);
        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Registration failed';
        setError(errorMessage);
        throw error;
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [setUser, setError]
  );

  const handleLogin = useCallback(
    async (data: LoginRequest) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await login(data);
        setUser(response.user);
        return response;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Login failed';
        setError(errorMessage);
        throw error;
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [setUser, setError]
  );

  const handleLogout = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      await logout();
      setUser(null);
    } catch (error) {
      // Even if logout fails, clear local state
      setUser(null);
      const errorMessage =
        error instanceof Error ? error.message : 'Logout failed';
      setError(errorMessage);
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [setUser, setError]);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Check if user is authenticated (has token)
  const checkAuth = useCallback(() => {
    const token = getAccessToken();
    return !!token;
  }, []);

  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated || checkAuth(),
    isLoading: state.isLoading,
    error: state.error,
    register: handleRegister,
    login: handleLogin,
    logout: handleLogout,
    setUser,
    clearError,
  };
}

