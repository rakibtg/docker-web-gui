import type { ReactNode } from 'react';
import { createContext, useContext, useState, useEffect } from 'react';
import type { AuthState, LoginCredentials, AuthResponse } from '../types/auth';
import { getCsrfToken } from '../helpers/csrf';

interface AuthContextType extends AuthState {
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
  login: (credentials: LoginCredentials) => Promise<AuthResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthRequired: false,
    isAuthenticated: false,
  });

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setAuthState({
          isLoading: false,
          user: data.user || null,
          isAuthRequired: data.isAuthRequired,
          isAuthenticated: data.isAuthenticated,
        });
      } else {
        setAuthState(prev => ({
          ...prev,
          user: null,
          isLoading: false,
          isAuthenticated: false,
        }));
      }
    } catch (error) {
      console.error('Failed to check auth status:', error);
      setAuthState(prev => ({
        ...prev,
        user: null,
        isLoading: false,
        isAuthenticated: false,
      }));
    }
  };

  const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAuthState(prev => ({
          ...prev,
          user: data.user,
          isAuthenticated: true,
        }));
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error occurred' };
    }
  };

  const logout = async () => {
    try {
      const csrfToken = await getCsrfToken();
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken,
        },
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAuthState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
      }));
    }
  };

  useEffect(() => {
    getCsrfToken().catch((error) => {
      console.warn('Failed to preload CSRF token:', error);
    });
    checkAuthStatus();
  }, []);

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
