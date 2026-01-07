import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { getAccessToken } from '../lib/apiClient.js';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = getAccessToken();
  const { isAuthenticated } = useAuth();

  if (!token && !isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

