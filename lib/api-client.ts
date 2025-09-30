"use client";

// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// API client class
export class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Set authentication token
  setToken(token: string | null) {
    this.token = token;
  }

  // Get authentication token from localStorage
  private getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  // Make HTTP request
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.token || this.getStoredToken();

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: 'An error occurred' 
        }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Upload file
  async uploadFile<T>(endpoint: string, file: File, additionalData?: Record<string, any>): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.token || this.getStoredToken();

    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const config: RequestInit = {
      method: 'POST',
      body: formData,
    };

    if (token) {
      config.headers = {
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: 'An error occurred' 
        }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }
}

// Create default API client instance
export const apiClient = new ApiClient();

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  LOGIN: '/login',
  REGISTER: '/register',
  LOGOUT: '/logout',
  
  // Subscription
  PLANS: '/plans',
  SUBSCRIPTION: '/subscription',
  SUBSCRIPTION_HISTORY: '/subscription/history',
  STRIPE_WEBHOOK: '/stripe/webhook',
  
  // AI Tools
  YOUTUBE_SUMMARIZE: '/youtube/summarize',
  PDF_SUMMARIZE: '/pdf/summarize',
  WRITER_RUN: '/writer/run',
  MATH_SOLVE: '/math/solve',
  FLASHCARDS_GENERATE: '/flashcards/generate',
  DIAGRAM_GENERATE: '/diagram/generate',
} as const;

// Type definitions for API responses
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  success?: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  limit: number;
}

export interface Subscription {
  plan: SubscriptionPlan;
  price: number;
  currency: string;
  limit: number;
  starts_at: string;
  ends_at: string;
}

// Utility functions for common API operations
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>(API_ENDPOINTS.LOGIN, { email, password }),
  
  register: (name: string, email: string, password: string) =>
    apiClient.post<AuthResponse>(API_ENDPOINTS.REGISTER, { name, email, password }),
  
  logout: () =>
    apiClient.post(API_ENDPOINTS.LOGOUT),
};

export const subscriptionApi = {
  getPlans: () =>
    apiClient.get<SubscriptionPlan[]>(API_ENDPOINTS.PLANS),
  
  getCurrentSubscription: () =>
    apiClient.get<Subscription>(API_ENDPOINTS.SUBSCRIPTION),
  
  getSubscriptionHistory: () =>
    apiClient.get<Subscription[]>(API_ENDPOINTS.SUBSCRIPTION_HISTORY),
};

export const aiToolsApi = {
  summarizeYouTube: (videoUrl: string, language?: string, mode?: string) =>
    apiClient.post<{ summary: string }>(API_ENDPOINTS.YOUTUBE_SUMMARIZE, {
      video_url: videoUrl,
      language,
      mode,
    }),
  
  summarizePDF: (filePath: string) =>
    apiClient.post<{ summary: string }>(API_ENDPOINTS.PDF_SUMMARIZE, {
      file_path: filePath,
    }),
  
  generateContent: (prompt: string, mode?: string) =>
    apiClient.post<{ output: string }>(API_ENDPOINTS.WRITER_RUN, {
      prompt,
      mode,
    }),
  
  solveMath: (problem: string) =>
    apiClient.post<{ solution: string }>(API_ENDPOINTS.MATH_SOLVE, {
      problem,
    }),
  
  generateFlashcards: (topic: string) =>
    apiClient.post<Array<{ question: string; answer: string }>>(
      API_ENDPOINTS.FLASHCARDS_GENERATE,
      { topic }
    ),
  
  generateDiagram: (description: string) =>
    apiClient.post<{ diagram_text: string }>(API_ENDPOINTS.DIAGRAM_GENERATE, {
      description,
    }),
};
