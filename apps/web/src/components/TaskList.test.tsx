import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskList } from './TaskList.js';
import { createMockTask, createMockTasks } from '../test/mocks/taskMocks.js';

describe('TaskList', () => {
  it('should_render_loading_skeleton_when_loading', () => {
    render(
      <TaskList
        tasks={[]}
        loading={true}
        onToggle={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByLabelText('Loading tasks')).toBeInTheDocument();
  });

  it('should_render_empty_message_when_no_tasks', () => {
    render(
      <TaskList
        tasks={[]}
        loading={false}
        onToggle={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText(/No tasks yet/)).toBeInTheDocument();
  });

  it('should_render_active_tasks', () => {
    const tasks = createMockTasks(2, [{ completed: false }, { completed: false }]);
    render(
      <TaskList
        tasks={tasks}
        loading={false}
        onToggle={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Active (2)')).toBeInTheDocument();
    expect(screen.getByText('Test task 1')).toBeInTheDocument();
    expect(screen.getByText('Test task 2')).toBeInTheDocument();
  });

  it('should_render_completed_tasks', () => {
    const tasks = createMockTasks(2, [{ completed: true }, { completed: true }]);
    render(
      <TaskList
        tasks={tasks}
        loading={false}
        onToggle={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Done (2)')).toBeInTheDocument();
  });

  it('should_hide_completed_tasks_when_hide_button_clicked', async () => {
    const user = userEvent.setup();
    const tasks = createMockTasks(1, [{ completed: true }]);
    render(
      <TaskList
        tasks={tasks}
        loading={false}
        onToggle={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const hideButton = screen.getByText('Hide');
    await user.click(hideButton);

    expect(screen.queryByText('Test task 1')).not.toBeInTheDocument();
    expect(screen.getByText('Show')).toBeInTheDocument();
  });

  it('should_filter_by_due_date_today', async () => {
    const user = userEvent.setup();
    // Create a date for today at midnight local time
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tasks = [
      createMockTask({ id: 'task-1', title: 'Today task', dueDate: today.toISOString() }),
      createMockTask({ id: 'task-2', title: 'No date task', dueDate: null }),
      createMockTask({ id: 'task-3', title: 'Tomorrow task', dueDate: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString() }),
    ];
    render(
      <TaskList
        tasks={tasks}
        loading={false}
        onToggle={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const filter = screen.getByLabelText(/Filter by due date/);
    await user.selectOptions(filter, 'today');

    await waitFor(() => {
      expect(screen.getByText('Today task')).toBeInTheDocument();
      expect(screen.queryByText('No date task')).not.toBeInTheDocument();
      expect(screen.queryByText('Tomorrow task')).not.toBeInTheDocument();
    });
  });

  it('should_filter_by_due_date_overdue', async () => {
    const user = userEvent.setup();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    const tasks = [
      createMockTask({ id: 'task-1', title: 'Overdue task', dueDate: yesterday.toISOString() }),
      createMockTask({ id: 'task-2', title: 'No date task', dueDate: null }),
      createMockTask({ id: 'task-3', title: 'Today task', dueDate: new Date().toISOString() }),
    ];
    render(
      <TaskList
        tasks={tasks}
        loading={false}
        onToggle={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const filter = screen.getByLabelText(/Filter by due date/);
    await user.selectOptions(filter, 'overdue');

    await waitFor(() => {
      expect(screen.getByText('Overdue task')).toBeInTheDocument();
      expect(screen.queryByText('No date task')).not.toBeInTheDocument();
      expect(screen.queryByText('Today task')).not.toBeInTheDocument();
    });
  });

  it('should_filter_by_category', async () => {
    const user = userEvent.setup();
    const tasks = [
      createMockTask({ id: 'task-1', title: 'Work task', category: 'Work' }),
      createMockTask({ id: 'task-2', title: 'Personal task', category: 'Personal' }),
    ];
    render(
      <TaskList
        tasks={tasks}
        loading={false}
        onToggle={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const categoryFilter = screen.getByLabelText(/Filter by category/);
    await user.selectOptions(categoryFilter, 'Work');

    expect(screen.getByText('Work task')).toBeInTheDocument();
    expect(screen.queryByText('Personal task')).not.toBeInTheDocument();
  });

  it('should_show_no_tasks_message_when_filter_matches_nothing', async () => {
    const user = userEvent.setup();
    // Create tasks with different categories so both appear in the filter
    const tasks = [
      createMockTask({ id: 'task-1', title: 'Work task', category: 'Work' }),
      createMockTask({ id: 'task-2', title: 'Personal task', category: 'Personal' }),
    ];
    render(
      <TaskList
        tasks={tasks}
        loading={false}
        onToggle={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const categoryFilter = screen.getByLabelText(/Filter by category/);
    // Filter by a category that doesn't exist in the tasks
    // But first we need a task with a category that's not in the list
    // Actually, let's filter by due date instead - filter for "today" when no tasks are due today
    const dueDateFilter = screen.getByLabelText(/Filter by due date/);
    await user.selectOptions(dueDateFilter, 'today');

    await waitFor(() => {
      expect(screen.getByText(/No tasks match the selected filter/)).toBeInTheDocument();
    });
  });

  it('should_not_show_category_filter_when_no_categories', () => {
    const tasks = [createMockTask({ category: null })];
    render(
      <TaskList
        tasks={tasks}
        loading={false}
        onToggle={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.queryByLabelText(/Filter by category/)).not.toBeInTheDocument();
  });

  it('should_show_category_filter_when_tasks_have_categories', () => {
    const tasks = [createMockTask({ category: 'Work' })];
    render(
      <TaskList
        tasks={tasks}
        loading={false}
        onToggle={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByLabelText(/Filter by category/)).toBeInTheDocument();
  });

  it('should_call_onToggle_when_task_toggled', async () => {
    const user = userEvent.setup();
    const tasks = [createMockTask({ id: 'task-1' })];
    const onToggle = vi.fn();
    render(
      <TaskList
        tasks={tasks}
        loading={false}
        onToggle={onToggle}
        onUpdate={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    expect(onToggle).toHaveBeenCalledWith('task-1');
  });

  it('should_call_onUpdate_when_task_updated', async () => {
    const user = userEvent.setup();
    const tasks = [createMockTask({ id: 'task-1', title: 'Original' })];
    const onUpdate = vi.fn();
    render(
      <TaskList
        tasks={tasks}
        loading={false}
        onToggle={vi.fn()}
        onUpdate={onUpdate}
        onDelete={vi.fn()}
      />
    );

    const titleElement = screen.getByText('Original');
    await user.dblClick(titleElement);

    const input = screen.getByDisplayValue('Original');
    await user.clear(input);
    await user.type(input, 'Updated');
    await user.keyboard('{Enter}');

    expect(onUpdate).toHaveBeenCalledWith('task-1', 'Updated');
  });

  it('should_call_onDelete_when_task_deleted', async () => {
    const user = userEvent.setup();
    const tasks = [createMockTask({ id: 'task-1' })];
    const onDelete = vi.fn();
    render(
      <TaskList
        tasks={tasks}
        loading={false}
        onToggle={vi.fn()}
        onUpdate={vi.fn()}
        onDelete={onDelete}
      />
    );

    const deleteButton = screen.getByLabelText('Delete task');
    await user.click(deleteButton);

    expect(onDelete).toHaveBeenCalledWith('task-1');
  });
});

