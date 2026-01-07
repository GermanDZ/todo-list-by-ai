import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from './ErrorBoundary.js';

// Component that throws an error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundary', () => {
  const originalError = console.error;
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    // Suppress error logging in tests
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalError;
    process.env.NODE_ENV = originalEnv;
  });

  it('should_render_children_when_no_error', () => {
    render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Normal content')).toBeInTheDocument();
  });

  it('should_render_error_fallback_when_error_occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/We're sorry, but something unexpected happened/)).toBeInTheDocument();
  });

  it('should_render_custom_fallback_when_provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom error message</div>}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('should_show_error_details_in_development', () => {
    process.env.NODE_ENV = 'development';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('should_not_show_error_details_in_production', () => {
    process.env.NODE_ENV = 'production';

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.queryByText('Test error')).not.toBeInTheDocument();
  });

  it('should_reload_page_when_reload_button_clicked', async () => {
    const user = userEvent.setup();
    const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const reloadButton = screen.getByText('Reload Page');
    await user.click(reloadButton);

    expect(reloadSpy).toHaveBeenCalled();

    reloadSpy.mockRestore();
  });

  it('should_navigate_home_when_go_home_button_clicked', async () => {
    const user = userEvent.setup();
    // Mock window.location.href
    delete (window as any).location;
    (window as any).location = { href: '' };

    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const goHomeButton = screen.getByText('Go Home');
    await user.click(goHomeButton);

    expect(window.location.href).toBe('/');
  });
});

