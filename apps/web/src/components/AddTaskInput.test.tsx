import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { AddTaskInput, AddTaskInputRef } from './AddTaskInput.js';

describe('AddTaskInput', () => {
  it('should_render_input_and_button', () => {
    const onCreateTask = vi.fn();
    render(<AddTaskInput onCreateTask={onCreateTask} />);

    expect(screen.getByPlaceholderText('Add a new task...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add/i })).toBeInTheDocument();
  });

  it('should_call_onCreateTask_when_form_submitted', async () => {
    const user = userEvent.setup();
    const onCreateTask = vi.fn().mockResolvedValue(undefined);
    render(<AddTaskInput onCreateTask={onCreateTask} />);

    const input = screen.getByPlaceholderText('Add a new task...');
    const button = screen.getByRole('button', { name: /Add/i });

    await user.type(input, 'New task');
    await user.click(button);

    await waitFor(() => {
      expect(onCreateTask).toHaveBeenCalledWith('New task', null, null);
    });
  });

  it('should_trim_whitespace_from_title', async () => {
    const user = userEvent.setup();
    const onCreateTask = vi.fn().mockResolvedValue(undefined);
    render(<AddTaskInput onCreateTask={onCreateTask} />);

    const input = screen.getByPlaceholderText('Add a new task...');
    const button = screen.getByRole('button', { name: /Add/i });

    await user.type(input, '  Task with spaces  ');
    await user.click(button);

    await waitFor(() => {
      expect(onCreateTask).toHaveBeenCalledWith('Task with spaces', null, null);
    });
  });

  it('should_not_submit_when_title_is_empty', async () => {
    const user = userEvent.setup();
    const onCreateTask = vi.fn();
    render(<AddTaskInput onCreateTask={onCreateTask} />);

    const button = screen.getByRole('button', { name: /Add/i });
    expect(button).toBeDisabled();

    await user.click(button);

    expect(onCreateTask).not.toHaveBeenCalled();
  });

  it('should_not_submit_when_title_is_only_whitespace', async () => {
    const user = userEvent.setup();
    const onCreateTask = vi.fn();
    render(<AddTaskInput onCreateTask={onCreateTask} />);

    const input = screen.getByPlaceholderText('Add a new task...');
    const button = screen.getByRole('button', { name: /Add/i });

    await user.type(input, '   ');
    expect(button).toBeDisabled();

    await user.click(button);

    expect(onCreateTask).not.toHaveBeenCalled();
  });

  it('should_clear_input_after_successful_submission', async () => {
    const user = userEvent.setup();
    const onCreateTask = vi.fn().mockResolvedValue(undefined);
    render(<AddTaskInput onCreateTask={onCreateTask} />);

    const input = screen.getByPlaceholderText('Add a new task...') as HTMLInputElement;
    const button = screen.getByRole('button', { name: /Add/i });

    await user.type(input, 'New task');
    await user.click(button);

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('should_display_error_when_onCreateTask_fails', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Failed to create task';
    const onCreateTask = vi.fn().mockRejectedValue(new Error(errorMessage));
    render(<AddTaskInput onCreateTask={onCreateTask} />);

    const input = screen.getByPlaceholderText('Add a new task...');
    const button = screen.getByRole('button', { name: /Add/i });

    await user.type(input, 'New task');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should_clear_error_when_user_types', async () => {
    const user = userEvent.setup();
    const onCreateTask = vi.fn().mockRejectedValueOnce(new Error('Error'));
    render(<AddTaskInput onCreateTask={onCreateTask} />);

    const input = screen.getByPlaceholderText('Add a new task...');
    const button = screen.getByRole('button', { name: /Add/i });

    await user.type(input, 'New task');
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    await user.type(input, 'x');

    await waitFor(() => {
      expect(screen.queryByText('Error')).not.toBeInTheDocument();
    });
  });

  it('should_be_disabled_when_disabled_prop_is_true', () => {
    const onCreateTask = vi.fn();
    render(<AddTaskInput onCreateTask={onCreateTask} disabled />);

    const input = screen.getByPlaceholderText('Add a new task...');
    const button = screen.getByRole('button', { name: /Add/i });

    expect(input).toBeDisabled();
    expect(button).toBeDisabled();
  });

  it('should_show_loading_state_during_submission', async () => {
    const user = userEvent.setup();
    const onCreateTask = vi.fn(
      () => new Promise((resolve) => setTimeout(() => resolve(undefined), 100))
    );
    render(<AddTaskInput onCreateTask={onCreateTask} />);

    const input = screen.getByPlaceholderText('Add a new task...');
    const button = screen.getByRole('button', { name: /Add/i });

    await user.type(input, 'New task');
    await user.click(button);

    expect(screen.getByText('Adding...')).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('should_call_onCreateTask_with_due_date_and_category', async () => {
    const user = userEvent.setup();
    const onCreateTask = vi.fn().mockResolvedValue(undefined);
    render(<AddTaskInput onCreateTask={onCreateTask} />);

    const input = screen.getByPlaceholderText('Add a new task...');
    const dateInput = screen.getByLabelText('Due date');
    const categorySelect = screen.getByRole('combobox');

    await user.type(input, 'New task');
    await user.type(dateInput, '2026-12-31');
    await user.selectOptions(categorySelect, 'Work');

    const button = screen.getByRole('button', { name: /Add/i });
    await user.click(button);

    await waitFor(() => {
      expect(onCreateTask).toHaveBeenCalled();
      const callArgs = onCreateTask.mock.calls[0];
      expect(callArgs[0]).toBe('New task');
      expect(callArgs[1]).toBeTruthy(); // Due date (timezone may vary)
      expect(callArgs[2]).toBe('Work');
    });
  });

  it('should_focus_input_when_ref_focus_called', () => {
    const onCreateTask = vi.fn();
    const ref = createRef<AddTaskInputRef>();
    render(<AddTaskInput ref={ref} onCreateTask={onCreateTask} />);

    const input = screen.getByPlaceholderText('Add a new task...');

    // Call focus via ref
    ref.current?.focus();

    expect(document.activeElement).toBe(input);
  });
});

