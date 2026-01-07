import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorMessage } from './ErrorMessage.js';

describe('ErrorMessage', () => {
  it('should_render_error_message', () => {
    render(<ErrorMessage message="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should_apply_error_styling_by_default', () => {
    render(<ErrorMessage message="Error message" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-red-50', 'border-red-200', 'text-red-700');
  });

  it('should_apply_warning_styling', () => {
    render(<ErrorMessage message="Warning message" type="warning" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-700');
  });

  it('should_apply_info_styling', () => {
    render(<ErrorMessage message="Info message" type="info" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-blue-50', 'border-blue-200', 'text-blue-700');
  });

  it('should_show_dismiss_button_when_dismissible', () => {
    const onDismiss = vi.fn();
    render(<ErrorMessage message="Dismissible message" dismissible onDismiss={onDismiss} />);
    const dismissButton = screen.getByLabelText('Dismiss');
    expect(dismissButton).toBeInTheDocument();
  });

  it('should_not_show_dismiss_button_when_not_dismissible', () => {
    render(<ErrorMessage message="Non-dismissible message" />);
    expect(screen.queryByLabelText('Dismiss')).not.toBeInTheDocument();
  });

  it('should_call_onDismiss_when_dismiss_button_clicked', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    render(<ErrorMessage message="Dismissible message" dismissible onDismiss={onDismiss} />);

    const dismissButton = screen.getByLabelText('Dismiss');
    await user.click(dismissButton);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('should_hide_message_when_dismissed', async () => {
    const user = userEvent.setup();
    render(<ErrorMessage message="Dismissible message" dismissible />);

    const dismissButton = screen.getByLabelText('Dismiss');
    await user.click(dismissButton);

    expect(screen.queryByText('Dismissible message')).not.toBeInTheDocument();
  });

  it('should_apply_custom_class_name', () => {
    render(<ErrorMessage message="Message" className="custom-class" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('custom-class');
  });
});

