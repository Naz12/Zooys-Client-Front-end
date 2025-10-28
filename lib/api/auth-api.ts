"use client";

import { BaseApiClient } from './base-api-client';
import type { 
  User, 
  AuthResponse, 
  LoginRequest,
  RegisterRequest
} from '../types/api';

export class AuthApiClient extends BaseApiClient {
  // User registration
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    return this.post<AuthResponse>('/register', userData);
  }

  // User login
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return this.post<AuthResponse>('/login', credentials);
  }

  // Get current user
  async getCurrentUser(): Promise<User> {
    return this.get<User>('/user');
  }

  // User logout
  async logout(): Promise<{ message: string }> {
    return this.post<{ message: string }>('/logout');
  }

  // Refresh token (if implemented)
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    return this.post<AuthResponse>('/refresh', { refresh_token: refreshToken });
  }

  // Verify email (if implemented)
  async verifyEmail(token: string): Promise<{ message: string }> {
    return this.post<{ message: string }>('/verify-email', { token });
  }

  // Request password reset (if implemented)
  async requestPasswordReset(email: string): Promise<{ message: string }> {
    return this.post<{ message: string }>('/forgot-password', { email });
  }

  // Reset password (if implemented)
  async resetPassword(token: string, password: string): Promise<{ message: string }> {
    return this.post<{ message: string }>('/reset-password', { token, password });
  }
}

// Create auth API client instance
export const authApi = new AuthApiClient();