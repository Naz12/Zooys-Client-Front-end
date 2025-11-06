"use client";

import React, { useState, useEffect, useRef, memo } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { environment } from '@/lib/environment';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  // Default email for testing
  const defaultEmail = 'test-subscription@example.com';
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const isInitialized = useRef(false);
  const emailRef = useRef<string>(defaultEmail); // Backup ref to preserve email value

  const { login, clearError } = useAuth();
  
  // Keep ref in sync with state
  useEffect(() => {
    if (email) {
      emailRef.current = email;
    }
  }, [email]);

  // Load saved credentials on component mount (only once)
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized.current) {
      const savedEmail = localStorage.getItem('remembered_email');
      const savedRememberMe = localStorage.getItem('remember_me') === 'true';
      
      if (savedEmail && savedRememberMe) {
        setEmail(savedEmail);
        emailRef.current = savedEmail; // Initialize ref as well
        setRememberMe(savedRememberMe);
      } else {
        // Use default email for testing if no saved email
        emailRef.current = defaultEmail;
      }
      isInitialized.current = true;
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setFieldErrors({});

    try {
      await login(email, password, rememberMe);
      
      // Save credentials if remember me is checked
      if (rememberMe) {
        localStorage.setItem('remembered_email', email);
        localStorage.setItem('remember_me', 'true');
      } else {
        localStorage.removeItem('remembered_email');
        localStorage.removeItem('remember_me');
      }
      
      // Clear any previous errors
      clearError();
      
      // The login function will handle the state update and redirect
      // No need to manually redirect here as the ProtectedRoute will handle it
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      
      // Extract field-specific errors if available
      if (err && typeof err === 'object' && 'fieldErrors' in err) {
        const errors = (err as any).fieldErrors;
        if (errors && typeof errors === 'object') {
          setFieldErrors(errors);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    // Only clear local error state, don't call clearError() to avoid unnecessary context updates
    if (error) {
      setError('');
    }
    if (fieldErrors.email) {
      setFieldErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    // Only clear local error state, don't call clearError() to avoid unnecessary context updates
    if (error) {
      setError('');
    }
    if (fieldErrors.password) {
      setFieldErrors(prev => ({ ...prev, password: '' }));
    }
    // Defensive: Restore email if it somehow got cleared (browser compatibility fix)
    if (!email && emailRef.current) {
      // Use setTimeout to avoid state update during render
      setTimeout(() => {
        setEmail(emailRef.current);
      }, 0);
    }
  };

  return (
    <Card className="w-full max-w-md p-6">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Welcome Back</h2>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        <form 
          key="login-form" 
          onSubmit={handleSubmit} 
          className="space-y-4" 
          autoComplete="on"
          onReset={(e) => {
            // Prevent form reset from clearing email
            e.preventDefault();
          }}
        >
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              key="email-input"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={handleEmailChange}
              onBlur={(e) => {
                // Ensure email persists on blur (browser compatibility)
                // If browser cleared the value, restore it from state
                if (!e.target.value && email) {
                  e.target.value = email;
                  emailRef.current = email;
                }
              }}
              required
              disabled={isLoading}
              autoComplete="email"
              className={fieldErrors.email ? 'border-red-500 focus:border-red-500' : ''}
            />
            {fieldErrors.email && (
              <p className="text-sm text-red-600">{fieldErrors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              key="password-input"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={handlePasswordChange}
              onFocus={(e) => {
                // Prevent any form reset behavior when password field is focused
                // Ensure email state is preserved (browser compatibility fix for Cursor's browser)
                if (!email && typeof window !== 'undefined') {
                  const savedEmail = localStorage.getItem('remembered_email');
                  if (savedEmail) {
                    setEmail(savedEmail);
                    emailRef.current = savedEmail;
                  } else if (emailRef.current) {
                    // Restore from ref if available
                    setEmail(emailRef.current);
                  } else {
                    // Fall back to default test email
                    setEmail(defaultEmail);
                    emailRef.current = defaultEmail;
                  }
                } else if (email && email !== emailRef.current) {
                  // Sync ref when email exists
                  emailRef.current = email;
                }
              }}
              required
              disabled={isLoading}
              autoComplete="current-password"
              className={fieldErrors.password ? 'border-red-500 focus:border-red-500' : ''}
            />
            {fieldErrors.password && (
              <p className="text-sm text-red-600">{fieldErrors.password}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              disabled={isLoading}
            />
            <label htmlFor="remember-me" className="text-sm text-muted-foreground">
              Remember me
            </label>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-primary hover:underline font-semibold text-base"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </Card>
  );
}

export default memo(LoginForm);
