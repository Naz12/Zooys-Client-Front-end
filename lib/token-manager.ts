"use client";

import { environment } from './environment';
import { notifications, notificationMessages } from './notifications';
import { AuthResponse, SessionData } from './types/api';

// Token manager class
export class TokenManager {
  private refreshPromise: Promise<string> | null = null;
  private isRefreshing = false;

  // Get stored token
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(environment.TOKEN_STORAGE_KEY);
    }
    return null;
  }

  // Get stored refresh token
  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refresh_token');
    }
    return null;
  }

  // Set tokens
  setTokens(token: string, refreshToken?: string, expiresIn?: number) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(environment.TOKEN_STORAGE_KEY, token);
      
      if (refreshToken) {
        localStorage.setItem('refresh_token', refreshToken);
      }

      if (expiresIn) {
        const expiresAt = Date.now() + (expiresIn * 1000);
        localStorage.setItem('token_expires_at', expiresAt.toString());
      }
    }
  }

  // Clear all tokens
  clearTokens() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(environment.TOKEN_STORAGE_KEY);
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_expires_at');
      localStorage.removeItem(environment.USER_STORAGE_KEY);
    }
  }

  // Check if token is expired
  isTokenExpired(): boolean {
    const expiresAt = localStorage.getItem('token_expires_at');
    if (!expiresAt) return true;
    
    return Date.now() >= parseInt(expiresAt);
  }

  // Check if token needs refresh (refresh 5 minutes before expiry)
  needsRefresh(): boolean {
    const expiresAt = localStorage.getItem('token_expires_at');
    if (!expiresAt) return true;
    
    const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
    return Date.now() >= (parseInt(expiresAt) - fiveMinutes);
  }

  // Refresh token
  async refreshToken(): Promise<string | null> {
    // If already refreshing, return the existing promise
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performRefresh();

    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  // Perform actual token refresh
  private async performRefresh(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      console.error('No refresh token available');
      this.handleRefreshFailure();
      return null;
    }

    try {
      const response = await fetch(`${environment.API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`Refresh failed with status: ${response.status}`);
      }

      const data: AuthResponse = await response.json();
      
      // Update tokens
      this.setTokens(
        data.token,
        data.refresh_token,
        data.expires_in
      );

      // Update user data if provided
      if (data.user) {
        localStorage.setItem(environment.USER_STORAGE_KEY, JSON.stringify(data.user));
      }

      if (environment.DEBUG_MODE) {
        console.log('Token refreshed successfully');
      }

      return data.token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.handleRefreshFailure();
      return null;
    }
  }

  // Handle refresh failure
  private handleRefreshFailure() {
    this.clearTokens();
    
    notifications.error(
      'Session Expired',
      notificationMessages.auth.tokenRefreshError
    );

    // Dispatch custom event for auth context to handle
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:token-refresh-failed'));
    }
  }

  // Get session data
  getSessionData(): SessionData | null {
    const token = this.getToken();
    const userData = localStorage.getItem(environment.USER_STORAGE_KEY);
    const expiresAt = localStorage.getItem('token_expires_at');
    const lastActivity = localStorage.getItem('last_activity');
    const rememberMe = localStorage.getItem('remember_me') === 'true';

    if (!token || !userData || !expiresAt) {
      return null;
    }

    try {
      const user = JSON.parse(userData);
      return {
        user,
        token,
        refresh_token: this.getRefreshToken() || undefined,
        expires_at: parseInt(expiresAt),
        last_activity: parseInt(lastActivity || '0'),
        remember_me: rememberMe,
      };
    } catch (error) {
      console.error('Failed to parse session data:', error);
      return null;
    }
  }

  // Set session data
  setSessionData(sessionData: SessionData) {
    this.setTokens(
      sessionData.token,
      sessionData.refresh_token,
      Math.floor((sessionData.expires_at - Date.now()) / 1000)
    );

    localStorage.setItem(environment.USER_STORAGE_KEY, JSON.stringify(sessionData.user));
    localStorage.setItem('last_activity', sessionData.last_activity.toString());
    localStorage.setItem('remember_me', sessionData.remember_me.toString());
  }

  // Update last activity
  updateLastActivity() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('last_activity', Date.now().toString());
    }
  }

  // Check if session is valid
  isSessionValid(): boolean {
    const sessionData = this.getSessionData();
    if (!sessionData) return false;

    // Check if token is expired
    if (this.isTokenExpired()) return false;

    // Check if session is within inactivity timeout
    const now = Date.now();
    const timeSinceLastActivity = now - sessionData.last_activity;
    
    if (timeSinceLastActivity > environment.INACTIVITY_TIMEOUT) {
      return false;
    }

    return true;
  }

  // Auto-refresh token if needed
  async autoRefreshIfNeeded(): Promise<string | null> {
    if (this.needsRefresh()) {
      return await this.refreshToken();
    }
    return this.getToken();
  }

  // Start automatic token refresh
  startAutoRefresh() {
    // Check every minute if token needs refresh
    setInterval(async () => {
      if (this.needsRefresh() && !this.isRefreshing) {
        await this.refreshToken();
      }
    }, 60000); // Check every minute
  }

  // Validate token with server
  async validateToken(): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    try {
      const response = await fetch(`${environment.API_BASE_URL}/auth/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }
}

// Create singleton instance
export const tokenManager = new TokenManager();

// Auto-start refresh in browser environment
if (typeof window !== 'undefined') {
  tokenManager.startAutoRefresh();
}
