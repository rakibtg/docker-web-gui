export interface AuthUser {
  username: string;
}

export interface AuthState {
  isLoading: boolean;
  user: AuthUser | null;
  isAuthRequired: boolean;
  isAuthenticated: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  token?: string;
  user?: AuthUser;
  success: boolean;
  message?: string;
}