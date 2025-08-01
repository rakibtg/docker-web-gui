import type { ReactNode } from 'react';
import { LoginForm } from './LoginForm';
import { useAuth } from '../contexts/AuthContext';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isAuthRequired, isLoading } = useAuth();

  // Show loading spinner while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // If auth is not required, show the app
  if (!isAuthRequired) {
    return <>{children}</>;
  }

  // If auth is required but user is not authenticated, show login form
  if (isAuthRequired && !isAuthenticated) {
    return <LoginForm />;
  }

  // User is authenticated, show the app
  return <>{children}</>;
}