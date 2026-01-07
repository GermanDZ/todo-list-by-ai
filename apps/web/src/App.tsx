import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useRef, useState, lazy, Suspense } from 'react';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import { LoadingSpinner } from './components/LoadingSpinner.js';
import { AddTaskInput, AddTaskInputRef } from './components/AddTaskInput.js';
import { TaskList } from './components/TaskList.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { ErrorMessage } from './components/ErrorMessage.js';
import { KeyboardShortcuts } from './components/KeyboardShortcuts.js';
import { useAuth } from './hooks/useAuth.js';
import { useTasks } from './hooks/useTasks.js';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts.js';

// Lazy load AuthPage to reduce initial bundle size
const AuthPage = lazy(() => import('./components/AuthPage.js').then(module => ({ default: module.AuthPage })));

function HomePage() {
  const { user, logout } = useAuth();
  const { tasks, loading, error, createTask, updateTask, deleteTask, toggleTask } =
    useTasks();
  const taskInputRef = useRef<AddTaskInputRef>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const handleUpdateTask = async (id: string, title: string) => {
    await updateTask(id, { title });
  };

  const handleFocusTaskInput = () => {
    taskInputRef.current?.focus();
  };

  const handleShowHelp = () => {
    setShowShortcuts(true);
  };

  // Set up keyboard shortcuts
  useKeyboardShortcuts({
    onFocusTaskInput: handleFocusTaskInput,
    onShowHelp: handleShowHelp,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">TaskFlow</h1>
            <p className="mt-2 text-sm sm:text-base text-gray-600">
              A high-performance, minimalist To-Do application
            </p>
          </div>
          {user && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <span className="text-xs sm:text-sm text-gray-600">{user.email}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowShortcuts(true)}
                  className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] sm:min-h-0"
                  aria-label="Show keyboard shortcuts"
                  title="Keyboard shortcuts (?)"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] sm:min-h-0"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <AddTaskInput ref={taskInputRef} onCreateTask={createTask} disabled={loading} />
          
          {error && (
            <ErrorMessage
              message={error}
              type="error"
              dismissible
              onDismiss={() => {
                // Clear error from useTasks hook if it has a clearError method
                // For now, errors are cleared on new operations
              }}
            />
          )}

          <TaskList
            tasks={tasks}
            loading={loading}
            onToggle={toggleTask}
            onUpdate={handleUpdateTask}
            onDelete={deleteTask}
          />
        </div>
      </div>
      <KeyboardShortcuts isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route
            path="/auth"
            element={
              <Suspense fallback={<LoadingSpinner />}>
                <AuthPage />
              </Suspense>
            }
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
