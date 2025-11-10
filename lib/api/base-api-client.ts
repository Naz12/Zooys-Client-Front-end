"use client";

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { notifications } from '../notifications';

// API base URL
const API_BASE_URL = 'http://localhost:8000/api';

// Retry configuration
interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryCondition: (error: AxiosError) => boolean;
}

// API response wrapper
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  success?: boolean;
  error?: string;
  code?: number;
}

// Base API client class using Axios
export class BaseApiClient {
  protected axiosInstance: AxiosInstance;
  protected token: string | null = null;
  private retryConfig: RetryConfig;

  constructor(baseURL: string = API_BASE_URL) {
    this.axiosInstance = axios.create({
      baseURL,
      timeout: 30000, // 30 seconds default
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });

    // Retry configuration
    this.retryConfig = {
      retries: 3,
      retryDelay: 1000,
      retryCondition: (error: AxiosError) => {
        // Retry on network errors or 5xx server errors
        return !error.response || (error.response.status >= 500 && error.response.status < 600);
      },
    };

    this.setupInterceptors();
  }

  // Set authentication token
  setToken(token: string | null) {
    this.token = token;
    if (token) {
      this.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.axiosInstance.defaults.headers.common['Authorization'];
    }
  }

  // Get authentication token from localStorage
  protected getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  // Setup request and response interceptors
  private setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Add token if available
        const token = this.token || this.getStoredToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Handle FormData - don't set Content-Type, let browser set it with boundary
        if (config.data instanceof FormData) {
          // Remove Content-Type header to let browser set it automatically with boundary
          delete config.headers['Content-Type'];
        }

        // Log request in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
          if (config.data) {
            if (config.data instanceof FormData) {
              console.log('Request Data: FormData');
              // Log FormData entries for debugging
              const entries: string[] = [];
              for (const [key, value] of config.data.entries()) {
                if (value instanceof File) {
                  entries.push(`${key}: File(${value.name}, ${value.size} bytes)`);
                } else {
                  entries.push(`${key}: ${value}`);
                }
              }
              console.log('FormData entries:', entries);
            } else {
              console.log('Request Data:', config.data);
            }
          }
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
      (response: AxiosResponse) => {
        // Log response in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        }
        return response;
      },
      async (error: AxiosError) => {
        // Handle authentication errors
        if (error.response?.status === 401) {
          // Clear token and redirect to login
          this.setToken(null);
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            // Don't redirect automatically - let components handle it
          }
        }

        // Log error in development
        if (process.env.NODE_ENV === 'development') {
          console.error(`❌ API Error: ${error.response?.status} ${error.config?.url}`);
          console.error('Error details:', error.response?.data);
          if (error.response?.data?.messages) {
            console.error('Validation messages:', JSON.stringify(error.response.data.messages, null, 2));
          }
          console.error('Error response:', error.response);
          console.error('Request config:', error.config);
          if (error.config?.data instanceof FormData) {
            console.error('FormData entries:');
            for (const [key, value] of error.config.data.entries()) {
              if (value instanceof File) {
                console.error(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
              } else {
                console.error(`  ${key}: ${value}`);
              }
            }
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Retry logic for failed requests
  private async retryRequest<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    retryCount: number = 0
  ): Promise<AxiosResponse<T>> {
    try {
      return await requestFn();
    } catch (error) {
      if (retryCount < this.retryConfig.retries && this.retryConfig.retryCondition(error as AxiosError)) {
        const delay = this.retryConfig.retryDelay * Math.pow(2, retryCount); // Exponential backoff
        
        console.log(`🔄 Retrying request in ${delay}ms (attempt ${retryCount + 1}/${this.retryConfig.retries})`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retryRequest(requestFn, retryCount + 1);
      }
      throw error;
    }
  }

  // Handle API errors with user-friendly messages
  private handleApiError(error: AxiosError) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;

    switch (status) {
      case 400:
        notifications.error('Bad Request', message);
        break;
      case 401:
        notifications.error('Unauthorized', 'Please log in again');
        break;
      case 403:
        notifications.error('Forbidden', 'You do not have permission to perform this action');
        break;
      case 404:
        notifications.error('Not Found', 'The requested resource was not found');
        break;
      case 422:
        notifications.error('Validation Error', 'Please check your input and try again');
        break;
      case 429:
        notifications.warning('Rate Limited', 'Too many requests. Please wait a moment.');
        break;
      case 500:
        notifications.error('Server Error', 'Something went wrong on our end. Please try again later.');
        break;
      case 502:
      case 503:
      case 504:
        notifications.error('Service Unavailable', 'The service is temporarily unavailable. Please try again later.');
        break;
      default:
        notifications.error('Network Error', 'Please check your connection and try again.');
    }
  }

  // HTTP methods with retry logic and error handling
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.retryRequest(() => this.axiosInstance.get<T>(url, config));
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
      throw error;
    }
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.retryRequest(() => this.axiosInstance.post<T>(url, data, config));
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
      throw error;
    }
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.retryRequest(() => this.axiosInstance.put<T>(url, data, config));
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
      throw error;
    }
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.retryRequest(() => this.axiosInstance.patch<T>(url, data, config));
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
      throw error;
    }
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.retryRequest(() => this.axiosInstance.delete<T>(url, config));
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
      throw error;
    }
  }

  // File upload with progress tracking
  async uploadFile<T = any>(
    url: string,
    file: File,
    onProgress?: (progress: number) => void,
    additionalData?: Record<string, any>
  ): Promise<T> {
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

    try {
      const response = await this.retryRequest(() => this.axiosInstance.post<T>(url, formData, config));
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
      throw error;
    }
  }

  // Download file as blob
  async downloadFile(url: string): Promise<Blob> {
    try {
      const response = await this.retryRequest(() => 
        this.axiosInstance.get(url, { responseType: 'blob' })
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error as AxiosError);
      throw error;
    }
  }
}

// Create default base API client instance
export const baseApiClient = new BaseApiClient();