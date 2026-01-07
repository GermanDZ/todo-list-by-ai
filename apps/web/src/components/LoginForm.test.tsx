import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { LoginForm } from './LoginForm.js';
import * as useAuthHook from '../hooks/useAuth.js';

// Mock useAuth hook
vi.mock('../hooks/useAuth.js', () => ({
  useAuth: vi.fn(),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LoginForm', () => {
  const mockLogin = vi.fn();
  const mockClearError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: null,
      clearError: mockClearError,
      user: null,
      isAuthenticated: false,
      register: vi.fn(),
      logout: vi.fn(),
      setUser: vi.fn(),
    });
  });

  it('should_render_email_and_password_inputs', () => {
    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('should_call_login_on_form_submission', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(undefined);

    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /Log In/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('should_navigate_to_home_on_successful_login', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(undefined);

    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /Log In/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('should_display_error_message', () => {
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: 'Invalid credentials',
      clearError: mockClearError,
      user: null,
      isAuthenticated: false,
      register: vi.fn(),
      logout: vi.fn(),
      setUser: vi.fn(),
    });

    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });

  it('should_clear_error_on_submit', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValue(undefined);
    // Set an error first
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      login: mockLogin,
      isLoading: false,
      error: 'Some error',
      clearError: mockClearError,
      user: null,
      isAuthenticated: false,
      register: vi.fn(),
      logout: vi.fn(),
      setUser: vi.fn(),
    });

    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /Log In/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // clearError is called at the start of handleSubmit
    await waitFor(() => {
      expect(mockClearError).toHaveBeenCalled();
    });
  });

  it('should_show_loading_state_during_login', () => {
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      login: mockLogin,
      isLoading: true,
      error: null,
      clearError: mockClearError,
      user: null,
      isAuthenticated: false,
      register: vi.fn(),
      logout: vi.fn(),
      setUser: vi.fn(),
    });

    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    expect(screen.getByText('Logging in...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should_require_email_and_password', () => {
    render(
      <BrowserRouter>
        <LoginForm />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');

    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });
});

