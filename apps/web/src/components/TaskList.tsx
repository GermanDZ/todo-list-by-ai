import { useState, useMemo } from 'react';
import { Task } from '../types/api.js';
import { TaskItem } from './TaskItem.js';
import { TaskListSkeleton } from './TaskListSkeleton.js';
import { isOverdue, isToday } from '../utils/dateFormat.js';

type DueDateFilter = 'all' | 'today' | 'overdue' | 'upcoming';

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
  onToggle: (id: string) => void;
  onUpdate: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export function TaskList({
  tasks,
  loading,
  onToggle,
  onUpdate,
  onDelete,
}: TaskListProps) {
  const [showCompleted, setShowCompleted] = useState(true);
  const [dueDateFilter, setDueDateFilter] = useState<DueDateFilter>('all');

  // Filter tasks by due date
  const filterTasksByDueDate = useMemo(() => {
    if (dueDateFilter === 'all') {
      return tasks;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tasks.filter((task) => {
      if (!task.dueDate) {
        return false; // Tasks without due dates don't match any filter except 'all'
      }

      const due = new Date(task.dueDate);
      due.setHours(0, 0, 0, 0);

      switch (dueDateFilter) {
        case 'today':
          return isToday(task.dueDate);
        case 'overdue':
          return isOverdue(task.dueDate);
        case 'upcoming':
          return !isOverdue(task.dueDate) && !isToday(task.dueDate);
        default:
          return true;
      }
    });
  }, [tasks, dueDateFilter]);

  const activeTasks = filterTasksByDueDate.filter((task) => !task.completed);
  const completedTasks = filterTasksByDueDate.filter((task) => task.completed);

  if (loading) {
    return <TaskListSkeleton />;
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12 text-sm sm:text-base text-gray-500">
        No tasks yet. Add one above to get started!
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center">
        <label htmlFor="dueDateFilter" className="text-sm font-medium text-gray-700">
          Filter by due date:
        </label>
        <select
          id="dueDateFilter"
          value={dueDateFilter}
          onChange={(e) => setDueDateFilter(e.target.value as DueDateFilter)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-h-[44px] sm:min-h-0"
        >
          <option value="all">All tasks</option>
          <option value="today">Due today</option>
          <option value="overdue">Overdue</option>
          <option value="upcoming">Upcoming</option>
        </select>
      </div>
      {/* Active Tasks */}
      {activeTasks.length > 0 && (
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 sm:mb-3">
            Active ({activeTasks.length})
          </h2>
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
            {activeTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={onToggle}
                onUpdate={onUpdate}
                onDelete={onDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* No tasks match filter */}
      {activeTasks.length === 0 && completedTasks.length === 0 && (
        <div className="text-center py-8 sm:py-12 text-sm sm:text-base text-gray-500">
          No tasks match the selected filter.
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">
              Done ({completedTasks.length})
            </h2>
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="text-sm text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-3 py-2 min-h-[44px] sm:min-h-0 sm:px-2 sm:py-1"
            >
              {showCompleted ? 'Hide' : 'Show'}
            </button>
          </div>
          {showCompleted && (
            <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
              {completedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={onToggle}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

