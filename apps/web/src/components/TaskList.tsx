import { useState } from 'react';
import { Task } from '../types/api.js';
import { TaskItem } from './TaskItem.js';

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

  const activeTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">Loading tasks...</div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No tasks yet. Add one above to get started!
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Tasks */}
      {activeTasks.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
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

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">
              Done ({completedTasks.length})
            </h2>
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="text-sm text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
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

