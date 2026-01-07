import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute.js';
import * as apiClient from '../lib/apiClient.js';
import * as useAuthHook from '../hooks/useAuth.js';

// Mock API client
vi.mock('../lib/apiClient.js', () => ({
  getAccessToken: vi.fn(),
}));

// Mock useAuth hook
vi.mock('../hooks/useAuth.js', () => ({
  useAuth: vi.fn(),
}));

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should_render_children_when_authenticated', () => {
    vi.mocked(apiClient.getAccessToken).mockReturnValue('valid-token');
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      isAuthenticated: true,
      user: null,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      setUser: vi.fn(),
      clearError: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should_render_children_when_token_exists', () => {
    vi.mocked(apiClient.getAccessToken).mockReturnValue('valid-token');
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      setUser: vi.fn(),
      clearError: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should_redirect_to_auth_when_not_authenticated', () => {
    vi.mocked(apiClient.getAccessToken).mockReturnValue(null);
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      setUser: vi.fn(),
      clearError: vi.fn(),
    });

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    // Should redirect (Navigate component doesn't render children)
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});

