"use client";

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { environment } from './environment';
import { notifications, notificationMessages } from './notifications';
import { ApiResponse, ApiErrorResponse, RequestConfig, ResponseConfig } from './types/api';

// Retry configuration
interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryCondition: (error: AxiosError) => boolean;
}

// Default retry configuration
const defaultRetryConfig: RetryConfig = {
  retries: 3,
  retryDelay: 1000,
  retryCondition: (error: AxiosError) => {
    // Retry on network errors or 5xx server errors
    return !error.response || (error.response.status >= 500 && error.response.status < 600);
  },
};

// Advanced API Client class
export class AdvancedApiClient {
  private axiosInstance: AxiosInstance;
  private retryConfig: RetryConfig;
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  constructor(baseURL: string = environment.API_BASE_URL, retryConfig?: Partial<RetryConfig>) {
    this.retryConfig = { ...defaultRetryConfig, ...retryConfig };
    
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  // Setup request and response interceptors
  private setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Add authentication token
        const token = this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request timestamp
        config.metadata = { startTime: Date.now() };

        // Log request in development
        if (environment.DEBUG_MODE) {
          console.log('API Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            headers: config.headers,
            data: config.data,
          });
        }

        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Log response in development
        if (environment.DEBUG_MODE) {
          const duration = Date.now() - (response.config.metadata?.startTime || 0);
          console.log('API Response:', {
            status: response.status,
            url: response.config.url,
            duration: `${duration}ms`,
            data: response.data,
          });
        }

        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshToken();
            if (newToken) {
              originalRequest.headers = originalRequest.headers || {};
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            this.handleAuthError();
            return Promise.reject(refreshError);
          }
        }

        // Handle other errors
        this.handleApiError(error);

        return Promise.reject(error);
      }
    );
  }

  // Get stored authentication token
  private getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(environment.TOKEN_STORAGE_KEY);
    }
    return null;
  }

  // Refresh authentication token
  private async refreshToken(): Promise<string | null> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.performTokenRefresh();

    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  // Perform actual token refresh
  private async performTokenRefresh(): Promise<string | null> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${environment.API_BASE_URL}/auth/refresh`, {
        refresh_token: refreshToken,
      });

      const { token, refresh_token } = response.data;
      
      // Store new tokens
      localStorage.setItem(environment.TOKEN_STORAGE_KEY, token);
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }

      notifications.success(
        'Session Refreshed',
        notificationMessages.auth.tokenRefreshSuccess
      );

      return token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.handleAuthError();
      return null;
    }
  }

  // Handle authentication errors
  private handleAuthError() {
    // Clear stored tokens
    localStorage.removeItem(environment.TOKEN_STORAGE_KEY);
    localStorage.removeItem('refresh_token');
    localStorage.removeItem(environment.USER_STORAGE_KEY);

    // Show error notification
    notifications.error(
      'Session Expired',
      notificationMessages.auth.sessionExpired
    );

    // Redirect to login (this would be handled by the auth context)
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }

  // Handle API errors
  private handleApiError(error: AxiosError) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    switch (status) {
      case 400:
        notifications.error('Bad Request', message);
        break;
      case 401:
        notifications.error('Unauthorized', notificationMessages.api.unauthorized);
        break;
      case 403:
        notifications.error('Forbidden', notificationMessages.api.forbidden);
        break;
      case 404:
        notifications.error('Not Found', notificationMessages.api.notFound);
        break;
      case 422:
        notifications.error('Validation Error', notificationMessages.api.validationError);
        break;
      case 429:
        notifications.warning('Rate Limited', 'Too many requests. Please wait a moment.');
        break;
      case 500:
        notifications.error('Server Error', notificationMessages.api.serverError);
        break;
      case 502:
      case 503:
      case 504:
        notifications.error('Service Unavailable', 'Service is temporarily unavailable. Please try again later.');
        break;
      default:
        if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
          notifications.error('Network Error', notificationMessages.api.networkError);
        } else {
          notifications.error('Error', message || notificationMessages.api.unknownError);
        }
    }
  }

  // Retry logic
  private async retryRequest<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    retryCount = 0
  ): Promise<AxiosResponse<T>> {
    try {
      return await requestFn();
    } catch (error) {
      if (retryCount < this.retryConfig.retries && this.retryConfig.retryCondition(error as AxiosError)) {
        const delay = this.retryConfig.retryDelay * Math.pow(2, retryCount); // Exponential backoff
        
        if (environment.DEBUG_MODE) {
          console.log(`Retrying request in ${delay}ms (attempt ${retryCount + 1}/${this.retryConfig.retries})`);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryRequest(requestFn, retryCount + 1);
      }
      throw error;
    }
  }

  // HTTP methods with retry logic
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.retryRequest(() => this.axiosInstance.get<T>(url, config));
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.retryRequest(() => this.axiosInstance.post<T>(url, data, config));
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.retryRequest(() => this.axiosInstance.put<T>(url, data, config));
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.retryRequest(() => this.axiosInstance.patch<T>(url, data, config));
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.retryRequest(() => this.axiosInstance.delete<T>(url, config));
    return response.data;
  }

  // File upload with progress tracking
  async uploadFile<T = any>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void,
    additionalData?: Record<string, any>
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    };

    const response = await this.retryRequest(() => this.axiosInstance.post<T>(url, formData, config));
    return response.data;
  }

  // Set authentication token
  setToken(token: string | null) {
    if (token) {
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.axiosInstance.defaults.headers.common['Authorization'];
    }
  }

  // Update retry configuration
  updateRetryConfig(config: Partial<RetryConfig>) {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  // Get axios instance for advanced usage
  getAxiosInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

// Create default instance
export const advancedApiClient = new AdvancedApiClient();

// Export convenience functions
export const api = {
  get: <T = any>(url: string, config?: AxiosRequestConfig) => advancedApiClient.get<T>(url, config),
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => advancedApiClient.post<T>(url, data, config),
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => advancedApiClient.put<T>(url, data, config),
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig) => advancedApiClient.patch<T>(url, data, config),
  delete: <T = any>(url: string, config?: AxiosRequestConfig) => advancedApiClient.delete<T>(url, config),
  uploadFile: <T = any>(url: string, file: File, onProgress?: (progress: number) => void, additionalData?: Record<string, any>) => 
    advancedApiClient.uploadFile<T>(url, file, onProgress, additionalData),
  setToken: (token: string | null) => advancedApiClient.setToken(token),
};
