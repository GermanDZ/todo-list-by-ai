import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskItem } from './TaskItem.js';
import { createMockTask } from '../test/mocks/taskMocks.js';

describe('TaskItem', () => {
  it('should_render_task_title', () => {
    const task = createMockTask({ title: 'Test task' });
    render(
      <TaskItem
        task={task}
        onToggle={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Test task')).toBeInTheDocument();
  });

  it('should_render_completed_task_with_strike_through', () => {
    const task = createMockTask({ title: 'Completed task', completed: true });
    render(
      <TaskItem
        task={task}
        onToggle={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const titleElement = screen.getByText('Completed task');
    expect(titleElement).toHaveClass('line-through');
  });

  it('should_call_onToggle_when_checkbox_clicked', async () => {
    const user = userEvent.setup();
    const task = createMockTask({ id: 'task-1' });
    const onToggle = vi.fn();
    render(
      <TaskItem task={task} onToggle={onToggle} onUpdate={vi.fn()} onDelete={vi.fn()} />
    );

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(onToggle).toHaveBeenCalledWith('task-1');
  });

  it('should_enter_edit_mode_on_double_click', async () => {
    const user = userEvent.setup();
    const task = createMockTask({ title: 'Editable task' });
    render(
      <TaskItem
        task={task}
        onToggle={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const titleElement = screen.getByText('Editable task');
    await user.dblClick(titleElement);

    const input = screen.getByDisplayValue('Editable task');
    expect(input).toBeInTheDocument();
  });

  it('should_call_onUpdate_when_editing_and_blurring', async () => {
    const user = userEvent.setup();
    const task = createMockTask({ id: 'task-1', title: 'Original' });
    const onUpdate = vi.fn();
    render(
      <TaskItem task={task} onToggle={vi.fn()} onUpdate={onUpdate} onDelete={vi.fn()} />
    );

    const titleElement = screen.getByText('Original');
    await user.dblClick(titleElement);

    const input = screen.getByDisplayValue('Original');
    await user.clear(input);
    await user.type(input, 'Updated');
    await user.tab(); // Blur

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith('task-1', 'Updated');
    });
  });

  it('should_call_onUpdate_when_editing_and_pressing_enter', async () => {
    const user = userEvent.setup();
    const task = createMockTask({ id: 'task-1', title: 'Original' });
    const onUpdate = vi.fn();
    render(
      <TaskItem task={task} onToggle={vi.fn()} onUpdate={onUpdate} onDelete={vi.fn()} />
    );

    const titleElement = screen.getByText('Original');
    await user.dblClick(titleElement);

    const input = screen.getByDisplayValue('Original');
    await user.clear(input);
    await user.type(input, 'Updated');
    await user.keyboard('{Enter}');

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith('task-1', 'Updated');
    });
  });

  it('should_cancel_editing_when_pressing_escape', async () => {
    const user = userEvent.setup();
    const task = createMockTask({ title: 'Original' });
    const onUpdate = vi.fn();
    render(
      <TaskItem task={task} onToggle={vi.fn()} onUpdate={onUpdate} onDelete={vi.fn()} />
    );

    const titleElement = screen.getByText('Original');
    await user.dblClick(titleElement);

    const input = screen.getByDisplayValue('Original');
    await user.clear(input);
    await user.type(input, 'Changed');
    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.getByText('Original')).toBeInTheDocument();
      expect(onUpdate).not.toHaveBeenCalled();
    });
  });

  it('should_not_call_onUpdate_when_title_unchanged', async () => {
    const user = userEvent.setup();
    const task = createMockTask({ id: 'task-1', title: 'Original' });
    const onUpdate = vi.fn();
    render(
      <TaskItem task={task} onToggle={vi.fn()} onUpdate={onUpdate} onDelete={vi.fn()} />
    );

    const titleElement = screen.getByText('Original');
    await user.dblClick(titleElement);

    const input = screen.getByDisplayValue('Original');
    await user.tab(); // Blur without changes

    await waitFor(() => {
      expect(onUpdate).not.toHaveBeenCalled();
    });
  });

  it('should_call_onDelete_when_delete_button_clicked', async () => {
    const user = userEvent.setup();
    const task = createMockTask({ id: 'task-1' });
    const onDelete = vi.fn();
    render(
      <TaskItem task={task} onToggle={vi.fn()} onUpdate={vi.fn()} onDelete={onDelete} />
    );

    const deleteButton = screen.getByLabelText('Delete task');
    await user.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith('task-1');
  });

  it('should_display_category_when_present', () => {
    const task = createMockTask({ category: 'Work' });
    render(
      <TaskItem
        task={task}
        onToggle={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Work')).toBeInTheDocument();
  });

  it('should_display_due_date_when_present', () => {
    const task = createMockTask({ dueDate: '2026-12-31T00:00:00.000Z' });
    render(
      <TaskItem
        task={task}
        onToggle={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    // Should display formatted due date
    expect(screen.getByText(/Due/)).toBeInTheDocument();
  });

  it('should_display_created_date', () => {
    const task = createMockTask();
    render(
      <TaskItem
        task={task}
        onToggle={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    // Should display formatted date
    const dateElement = screen.getByText(/just now|ago|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/);
    expect(dateElement).toBeInTheDocument();
  });
});

