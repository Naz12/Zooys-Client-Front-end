"use client";

import React, { createContext, useContext, useReducer, useEffect, useState, ReactNode } from 'react';

// Types
interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  lastActivity: number | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshToken: () => Promise<void>;
  isAuthRestored: boolean;
}

// Action types
type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' }
  | { type: 'AUTH_CLEAR_ERROR' }
  | { type: 'AUTH_UPDATE_ACTIVITY' }
  | { type: 'AUTH_RESTORE'; payload: { user: User; token: string } };

// Initial state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: false,
  error: null,
  lastActivity: null,
};

// Reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        error: null,
        lastActivity: Date.now(),
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: action.payload,
        lastActivity: null,
      };
    case 'AUTH_LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        isLoading: false,
        error: null,
        lastActivity: null,
      };
    case 'AUTH_CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };
    case 'AUTH_UPDATE_ACTIVITY':
      return {
        ...state,
        lastActivity: Date.now(),
      };
    case 'AUTH_RESTORE':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        error: null,
        lastActivity: Date.now(),
      };
    default:
      return state;
  }
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const [isClient, setIsClient] = useState(false);
  const [isAuthRestored, setIsAuthRestored] = useState(false);

  // Set client flag to prevent hydration mismatch
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Restore authentication state on mount
  useEffect(() => {
    // Only run on client side to prevent hydration mismatch
    if (!isClient || typeof window === 'undefined') return;
    
    const restoreAuth = () => {
      try {
        const token = localStorage.getItem('auth_token');
        const userData = localStorage.getItem('auth_user');
        const authCache = localStorage.getItem('auth_cache');
        
        // Check if we have cached auth data that's still valid
        if (authCache) {
          const { timestamp, isAuthenticated } = JSON.parse(authCache);
          const cacheAge = Date.now() - timestamp;
          
          // Use cache if it's less than 5 minutes old
          if (cacheAge < 5 * 60 * 1000 && isAuthenticated && token && userData) {
            const user = JSON.parse(userData);
            dispatch({ type: 'AUTH_RESTORE', payload: { user, token } });
            setIsAuthRestored(true);
            return; // Skip API validation for cached data
          }
        }
        
        if (token && userData) {
          const user = JSON.parse(userData);
          dispatch({ type: 'AUTH_RESTORE', payload: { user, token } });
          
          // Cache the auth state
          localStorage.setItem('auth_cache', JSON.stringify({
            timestamp: Date.now(),
            isAuthenticated: true
          }));
        } else {
          // No auth data found, mark as restored anyway
          setIsAuthRestored(true);
        }
      } catch (error) {
        console.error('Failed to restore auth state:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_cache');
      } finally {
        // Always mark auth restoration as complete
        setIsAuthRestored(true);
      }
    };

    restoreAuth();
  }, [isClient]);

  // Auto-logout on inactivity
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const checkInactivity = () => {
      if (state.lastActivity) {
        const now = Date.now();
        const timeSinceLastActivity = now - state.lastActivity;
        const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

        if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
          logout();
        }
      }
    };

    const interval = setInterval(checkInactivity, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [state.isAuthenticated, state.lastActivity]);

  // Update activity on user interaction
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const updateActivity = () => {
      dispatch({ type: 'AUTH_UPDATE_ACTIVITY' });
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, [state.isAuthenticated]);

  // API helper function
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (state.token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${state.token}`,
      };
    }

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  };

  // Login function
  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    dispatch({ type: 'AUTH_START' });
    
    try {
      const data = await apiCall('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, remember_me: rememberMe }),
      });

      const { user, token, refresh_token, expires_in } = data;
      
      // Store in localStorage
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }
      
      if (expires_in) {
        const expiresAt = Date.now() + (expires_in * 1000);
        localStorage.setItem('token_expires_at', expiresAt.toString());
      }
      
      // Store remember me preference
      localStorage.setItem('remember_me', rememberMe.toString());
      
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string) => {
    dispatch({ type: 'AUTH_START' });
    
    try {
      const data = await apiCall('/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });

      const { user, token } = data;
      
      // Store in localStorage
      localStorage.setItem('auth_token', token);
      localStorage.setItem('auth_user', JSON.stringify(user));
      
      dispatch({ type: 'AUTH_SUCCESS', payload: { user, token } });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      dispatch({ type: 'AUTH_FAILURE', payload: errorMessage });
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      if (state.token) {
        await apiCall('/logout', {
          method: 'POST',
        });
      }
    } catch (error) {
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_expires_at');
      
      // Only clear remember me if user explicitly logs out
      // (not on session expiry)
      const rememberMe = localStorage.getItem('remember_me') === 'true';
      if (!rememberMe) {
        localStorage.removeItem('remembered_email');
        localStorage.removeItem('remember_me');
      }
      
      dispatch({ type: 'AUTH_LOGOUT' });
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: 'AUTH_CLEAR_ERROR' });
  };

  // Refresh token function
  const refreshToken = async () => {
    // This would typically call a refresh endpoint
    // For now, we'll just update the activity timestamp
    dispatch({ type: 'AUTH_UPDATE_ACTIVITY' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
    refreshToken,
    isAuthRestored,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Higher-order component for protected routes
export function withAuth<T extends object>(Component: React.ComponentType<T>) {
  return function AuthenticatedComponent(props: T) {
    const { isAuthenticated, isLoading } = useAuth();
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      // This will be handled by the ProtectedRoute component
      return null;
    }
    
    return <Component {...props} />;
  };
}
