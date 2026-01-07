import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthPage } from './components/AuthPage.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import { AddTaskInput } from './components/AddTaskInput.js';
import { TaskList } from './components/TaskList.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { ErrorMessage } from './components/ErrorMessage.js';
import { useAuth } from './hooks/useAuth.js';
import { useTasks } from './hooks/useTasks.js';

function HomePage() {
  const { user, logout } = useAuth();
  const { tasks, loading, error, createTask, updateTask, deleteTask, toggleTask } =
    useTasks();

  const handleUpdateTask = async (id: string, title: string) => {
    await updateTask(id, { title });
  };

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
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px] sm:min-h-0"
              >
                Logout
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <AddTaskInput onCreateTask={createTask} disabled={loading} />
          
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
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
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
