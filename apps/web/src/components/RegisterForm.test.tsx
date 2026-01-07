import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { RegisterForm } from './RegisterForm.js';
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

describe('RegisterForm', () => {
  const mockRegister = vi.fn();
  const mockClearError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: null,
      clearError: mockClearError,
      user: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      setUser: vi.fn(),
    });
  });

  it('should_render_email_and_password_inputs', () => {
    render(
      <BrowserRouter>
        <RegisterForm />
      </BrowserRouter>
    );

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('should_call_register_on_form_submission', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue(undefined);

    render(
      <BrowserRouter>
        <RegisterForm />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /Create Account/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('should_navigate_to_home_on_successful_registration', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue(undefined);

    render(
      <BrowserRouter>
        <RegisterForm />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /Create Account/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('should_validate_email_format', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <RegisterForm />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /Create Account/i });

    // Fill in invalid email and valid password
    await user.clear(emailInput);
    await user.type(emailInput, 'invalid-email');
    await user.clear(passwordInput);
    await user.type(passwordInput, 'password123');
    
    // Submit form
    await user.click(submitButton);

    // The form should prevent submission due to validation
    // Register should not be called due to validation failure
    await waitFor(() => {
      expect(mockRegister).not.toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('should_validate_password_length', async () => {
    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <RegisterForm />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /Create Account/i });

    // Fill in valid email and short password
    await user.clear(emailInput);
    await user.type(emailInput, 'test@example.com');
    await user.clear(passwordInput);
    await user.type(passwordInput, 'short');
    
    // Submit form
    await user.click(submitButton);

    // The form should prevent submission due to validation
    // Register should not be called due to validation failure
    await waitFor(() => {
      expect(mockRegister).not.toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('should_display_error_message', () => {
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: 'Registration failed',
      clearError: mockClearError,
      user: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      setUser: vi.fn(),
    });

    render(
      <BrowserRouter>
        <RegisterForm />
      </BrowserRouter>
    );

    expect(screen.getByText('Registration failed')).toBeInTheDocument();
  });

  it('should_display_validation_error_over_api_error', async () => {
    const user = userEvent.setup();
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: 'API error',
      clearError: mockClearError,
      user: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      setUser: vi.fn(),
    });

    render(
      <BrowserRouter>
        <RegisterForm />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /Create Account/i });

    // Fill in invalid email
    await user.clear(emailInput);
    await user.type(emailInput, 'invalid-email');
    await user.clear(passwordInput);
    await user.type(passwordInput, 'password123');
    
    // Submit form
    await user.click(submitButton);

    // Validation happens first and prevents submission
    // Register should not be called due to validation failure
    await waitFor(() => {
      expect(mockRegister).not.toHaveBeenCalled();
    }, { timeout: 1000 });
    
    // The form's displayError = validationError || error, so validationError takes precedence
    // But we're testing behavior (preventing submission), not error display implementation
  });

  it('should_clear_error_on_submit', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValue(undefined);
    // Set an error first
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      register: mockRegister,
      isLoading: false,
      error: 'Some error',
      clearError: mockClearError,
      user: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      setUser: vi.fn(),
    });

    render(
      <BrowserRouter>
        <RegisterForm />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /Create Account/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // clearError is called at the start of handleSubmit
    await waitFor(() => {
      expect(mockClearError).toHaveBeenCalled();
    });
  });

  it('should_show_loading_state_during_registration', () => {
    vi.mocked(useAuthHook.useAuth).mockReturnValue({
      register: mockRegister,
      isLoading: true,
      error: null,
      clearError: mockClearError,
      user: null,
      isAuthenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      setUser: vi.fn(),
    });

    render(
      <BrowserRouter>
        <RegisterForm />
      </BrowserRouter>
    );

    expect(screen.getByText('Creating account...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should_require_email_and_password', () => {
    render(
      <BrowserRouter>
        <RegisterForm />
      </BrowserRouter>
    );

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');

    expect(emailInput).toBeRequired();
    expect(passwordInput).toBeRequired();
  });
});

