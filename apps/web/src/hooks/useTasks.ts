import { useState, useEffect, useCallback } from 'react';
import {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  toggleTask,
  Task,
} from '../lib/apiClient.js';

interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  createTask: (title: string) => Promise<void>;
  updateTask: (id: string, data: { title?: string; completed?: boolean }) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
}

export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTasks = useCallback(async () => {
    try {
      setError(null);
      const fetchedTasks = await getTasks();
      setTasks(fetchedTasks);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tasks';
      setError(errorMessage);
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshTasks();
  }, [refreshTasks]);

  const handleCreateTask = useCallback(async (title: string) => {
    // Optimistic update
    const optimisticTask: Task = {
      id: `temp-${Date.now()}`,
      userId: '',
      title,
      completed: false,
      dueDate: null,
      category: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTasks((prev) => [optimisticTask, ...prev]);

    try {
      const newTask = await createTask(title);
      // Replace optimistic task with real one
      setTasks((prev) => prev.map((t) => (t.id === optimisticTask.id ? newTask : t)));
    } catch (err) {
      // Rollback on error
      setTasks((prev) => prev.filter((t) => t.id !== optimisticTask.id));
      const errorMessage = err instanceof Error ? err.message : 'Failed to create task';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const handleUpdateTask = useCallback(
    async (id: string, data: { title?: string; completed?: boolean }) => {
      // Optimistic update
      const originalTasks = [...tasks];
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                ...data,
                updatedAt: new Date().toISOString(),
              }
            : t
        )
      );

      try {
        const updatedTask = await updateTask(id, data);
        setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
      } catch (err) {
        // Rollback on error
        setTasks(originalTasks);
        const errorMessage = err instanceof Error ? err.message : 'Failed to update task';
        setError(errorMessage);
        throw err;
      }
    },
    [tasks]
  );

  const handleDeleteTask = useCallback(async (id: string) => {
    // Optimistic update
    const originalTasks = [...tasks];
    setTasks((prev) => prev.filter((t) => t.id !== id));

    try {
      await deleteTask(id);
    } catch (err) {
      // Rollback on error
      setTasks(originalTasks);
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete task';
      setError(errorMessage);
      throw err;
    }
  }, [tasks]);

  const handleToggleTask = useCallback(
    async (id: string) => {
      // Optimistic update
      const task = tasks.find((t) => t.id === id);
      if (!task) return;

      const originalTasks = [...tasks];
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                completed: !t.completed,
                updatedAt: new Date().toISOString(),
              }
            : t
        )
      );

      try {
        const updatedTask = await toggleTask(id);
        setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
      } catch (err) {
        // Rollback on error
        setTasks(originalTasks);
        const errorMessage = err instanceof Error ? err.message : 'Failed to toggle task';
        setError(errorMessage);
        throw err;
      }
    },
    [tasks]
  );

  return {
    tasks,
    loading,
    error,
    createTask: handleCreateTask,
    updateTask: handleUpdateTask,
    deleteTask: handleDeleteTask,
    toggleTask: handleToggleTask,
    refreshTasks,
  };
}

