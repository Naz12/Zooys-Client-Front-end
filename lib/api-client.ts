"use client";

import type { 
  User, 
  AuthResponse, 
  SubscriptionPlan, 
  Subscription, 
  UsageStats, 
  CheckoutResponse,
  YouTubeSummarizeResponse,
  ChatRequest,
  ChatResponse,
  ChatHistoryResponse,
  FlashcardGenerateRequest,
  FlashcardGenerateResponse,
  FlashcardSetsResponse,
  FlashcardSetResponse,
  FlashcardUpdateRequest,
  FlashcardSet,
  PDFSummary,
  PDFSummariesResponse,
  PDFSummaryResponse,
  PDFSummaryCreateRequest,
  PDFSummaryCreateResponse,
  AsyncSummarizeRequest,
  AsyncSummarizeResponse,
  JobStatusResponse,
  JobResultResponse
} from './types/api';

// API base URL - Include /api prefix to match backend
const API_BASE_URL = 'http://localhost:8000/api';

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
    console.log('API Request URL:', url); // Debug log
    const token = this.token || this.getStoredToken();
    console.log('API Request Token:', token ? 'Present' : 'Missing'); // Debug log

    const config: RequestInit = {
      headers: {
        'Accept': 'application/json',
        'Origin': 'http://localhost:3000',
        // Don't set Content-Type for FormData - let browser set it
        ...(options.body instanceof FormData ? {} : {
          'Content-Type': 'application/json'
        }),
        ...options.headers,
      },
      redirect: 'manual', // Prevent automatic redirects on 401/403 responses
      ...options,
    };

    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    console.log('API Request Config:', {
      method: config.method || 'GET',
      headers: config.headers,
      body: config.body instanceof FormData ? 'FormData' : (config.body ? JSON.parse(config.body as string) : undefined)
    });
    
    // Log the full request body separately for better visibility
    if (config.body && !(config.body instanceof FormData)) {
      console.log('Request Body:', JSON.parse(config.body as string));
    } else if (config.body instanceof FormData) {
      console.log('Request Body: FormData with entries:');
      for (let [key, value] of config.body.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }
    }

    try {
      console.log(`Making request to: ${url}`);
      console.log(`Request config:`, config);
      
      // Add timeout for API requests (60 seconds for flashcard generation, 120 seconds for async operations, 30 seconds for others)
      const controller = new AbortController();
      let timeoutDuration = 30000; // Default 30 seconds
      
      if (endpoint.includes('/flashcards/generate')) {
        timeoutDuration = 60000; // 60 seconds for flashcard generation
      } else if (endpoint.includes('/summarize/async') || endpoint.includes('/async')) {
        timeoutDuration = 120000; // 120 seconds for async job initialization
      }
      
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Handle redirect responses (status 0 indicates a redirect was blocked)
      // Only treat as redirect if it's actually a redirect, not a 401/403 response
      if (response.status === 0 || (response.type === 'opaqueredirect' && response.status !== 401 && response.status !== 403)) {
        throw new Error('Request was redirected. This usually indicates a network or CORS issue.');
      }
      
      if (!response.ok) {
        let errorData;
        let responseText;
        
        try {
          // First, try to get the response as text to see what we're actually getting
          responseText = await response.text();
          console.log('Raw response text:', responseText);
          
          // Try to parse as JSON
          if (responseText.trim()) {
            errorData = JSON.parse(responseText);
          } else {
            // Empty response body
            errorData = { 
              message: `HTTP error! status: ${response.status} - Empty response body`,
              status: response.status,
              statusText: response.statusText,
              emptyResponse: true
            };
          }
        } catch (parseError) {
          // Response is not valid JSON
          errorData = { 
            message: `HTTP error! status: ${response.status} - Invalid JSON response`,
            status: response.status,
            statusText: response.statusText,
            rawResponse: responseText,
            parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error'
          };
        }
        
        // Create user-friendly error message
        let userMessage = 'Something went wrong. Please try again.';
        
        // Extract specific error message from backend response if available
        if (errorData && typeof errorData === 'object') {
          if (errorData.message) {
            userMessage = errorData.message;
          } else if (errorData.errors) {
            // Handle validation errors - extract first error message
            const errorKeys = Object.keys(errorData.errors);
            if (errorKeys.length > 0) {
              const firstError = errorData.errors[errorKeys[0]];
              if (Array.isArray(firstError) && firstError.length > 0) {
                userMessage = firstError[0];
              } else if (typeof firstError === 'string') {
                userMessage = firstError;
              }
            }
          }
        }
        
        // Fallback to generic messages based on status code
        // For 404, use backend message if available (backend may return 404 with error message)
        if (response.status === 404) {
          if (errorData && (errorData.error || errorData.message)) {
            userMessage = errorData.error || errorData.message;
          } else {
          userMessage = 'The requested resource was not found. Please check if the service is available.';
          }
        } else if (response.status === 401) {
          // For login endpoints, use the backend message if available, otherwise generic
          if (endpoint === '/login' && errorData && errorData.message) {
            userMessage = errorData.message;
          } else {
            userMessage = 'Authentication required. Please log in to access this feature.';
          }
        } else if (response.status === 403) {
          userMessage = 'You do not have permission to access this resource.';
        } else if (response.status === 500) {
          userMessage = 'Server error occurred. Please try again later.';
        } else if (response.status >= 400 && response.status < 500) {
          // For 4xx errors, prefer backend message if available
          if (errorData && errorData.message) {
            userMessage = errorData.message;
          } else {
            userMessage = 'Invalid request. Please check your input and try again.';
          }
        } else if (response.status >= 500) {
          userMessage = 'Server is temporarily unavailable. Please try again later.';
        }
        
        // Log detailed error information for debugging (only in development)
        if (process.env.NODE_ENV === 'development') {
          // Only log if we have meaningful data
          if (response.status || response.statusText || url) {
            const errorInfo = {
              status: response.status,
              statusText: response.statusText,
              url: url,
              errorData: errorData,
              rawResponse: responseText,
              responseTextLength: responseText?.length || 0,
              hasErrorData: errorData && typeof errorData === 'object' && Object.keys(errorData).length > 0,
              headers: Object.fromEntries(response.headers.entries())
            };
            console.error('API Error Response:', errorInfo);
          
            // Log the error data separately if it exists and has content
            if (errorData && typeof errorData === 'object' && Object.keys(errorData).length > 0) {
              console.error('Backend Error Details:', errorData);
            } else if (responseText) {
              console.error('Raw Response Text (not JSON):', responseText.substring(0, 500));
            } else {
              console.error('Empty response body - status:', response.status);
            }
          }
        }
        
        const error = new Error(userMessage);
        (error as any).status = response.status;
        (error as any).response = errorData;
        (error as any).rawResponse = responseText;
        (error as any).userMessage = userMessage;
        (error as any).fieldErrors = errorData?.errors || {};
        throw error;
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        // Handle timeout errors specifically
        if (error.name === 'AbortError') {
          let timeoutMessage = 'Request timeout - The request is taking longer than expected. Please try again.';
          
          if (endpoint.includes('/flashcards/generate')) {
            timeoutMessage = 'Request timeout - Flashcard generation is taking longer than expected. Please try again.';
          } else if (endpoint.includes('/summarize/async') || endpoint.includes('/async')) {
            timeoutMessage = 'Request timeout - Async job initialization is taking longer than expected (2+ minutes). The backend might be processing a heavy workload. Please try again in a few moments.';
          }
          
          throw new Error(timeoutMessage);
        }
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
      body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
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
      redirect: 'manual', // Prevent automatic redirects on 401/403 responses
    };

    if (token) {
      config.headers = {
        Authorization: `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      
      // Handle redirect responses (status 0 indicates a redirect was blocked)
      // Only treat as redirect if it's actually a redirect, not a 401/403 response
      if (response.status === 0 || (response.type === 'opaqueredirect' && response.status !== 401 && response.status !== 403)) {
        throw new Error('Request was redirected. This usually indicates a network or CORS issue.');
      }
      
      if (!response.ok) {
        let errorData;
        let responseText;
        
        try {
          // First, try to get the response as text to see what we're actually getting
          responseText = await response.text();
          console.log('Raw response text:', responseText);
          
          // Try to parse as JSON
          if (responseText.trim()) {
            errorData = JSON.parse(responseText);
          } else {
            // Empty response body
            errorData = { 
              message: `HTTP error! status: ${response.status} - Empty response body`,
              status: response.status,
              statusText: response.statusText,
              emptyResponse: true
            };
          }
        } catch (parseError) {
          // Response is not valid JSON
          errorData = { 
            message: `HTTP error! status: ${response.status} - Invalid JSON response`,
            status: response.status,
            statusText: response.statusText,
            rawResponse: responseText,
            parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error'
          };
        }
        
        // Create user-friendly error message
        let userMessage = 'Something went wrong. Please try again.';
        
        // Extract specific error message from backend response if available
        if (errorData && typeof errorData === 'object') {
          if (errorData.message) {
            userMessage = errorData.message;
          } else if (errorData.errors) {
            // Handle validation errors - extract first error message
            const errorKeys = Object.keys(errorData.errors);
            if (errorKeys.length > 0) {
              const firstError = errorData.errors[errorKeys[0]];
              if (Array.isArray(firstError) && firstError.length > 0) {
                userMessage = firstError[0];
              } else if (typeof firstError === 'string') {
                userMessage = firstError;
              }
            }
          }
        }
        
        // Fallback to generic messages based on status code
        // For 404, use backend message if available (backend may return 404 with error message)
        if (response.status === 404) {
          if (errorData && (errorData.error || errorData.message)) {
            userMessage = errorData.error || errorData.message;
          } else {
          userMessage = 'The requested resource was not found. Please check if the service is available.';
          }
        } else if (response.status === 401) {
          // For login endpoints, use the backend message if available, otherwise generic
          if (endpoint === '/login' && errorData && errorData.message) {
            userMessage = errorData.message;
          } else {
            userMessage = 'Authentication required. Please log in to access this feature.';
          }
        } else if (response.status === 403) {
          userMessage = 'You do not have permission to access this resource.';
        } else if (response.status === 500) {
          userMessage = 'Server error occurred. Please try again later.';
        } else if (response.status >= 400 && response.status < 500) {
          // For 4xx errors, prefer backend message if available
          if (errorData && errorData.message) {
            userMessage = errorData.message;
          } else {
            userMessage = 'Invalid request. Please check your input and try again.';
          }
        } else if (response.status >= 500) {
          userMessage = 'Server is temporarily unavailable. Please try again later.';
        }
        
        // Log detailed error information for debugging (only in development)
        if (process.env.NODE_ENV === 'development') {
          // Only log if we have meaningful data
          if (response.status || response.statusText || url) {
            const errorInfo = {
              status: response.status,
              statusText: response.statusText,
              url: url,
              errorData: errorData,
              rawResponse: responseText,
              responseTextLength: responseText?.length || 0,
              hasErrorData: errorData && typeof errorData === 'object' && Object.keys(errorData).length > 0,
              headers: Object.fromEntries(response.headers.entries())
            };
            console.error('API Error Response:', errorInfo);
          
            // Log the error data separately if it exists and has content
            if (errorData && typeof errorData === 'object' && Object.keys(errorData).length > 0) {
              console.error('Backend Error Details:', errorData);
            } else if (responseText) {
              console.error('Raw Response Text (not JSON):', responseText.substring(0, 500));
            } else {
              console.error('Empty response body - status:', response.status);
            }
          }
        }
        
        const error = new Error(userMessage);
        (error as any).status = response.status;
        (error as any).response = errorData;
        (error as any).rawResponse = responseText;
        (error as any).userMessage = userMessage;
        (error as any).fieldErrors = errorData?.errors || {};
        throw error;
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) {
        // Handle timeout errors specifically
        if (error.name === 'AbortError') {
          let timeoutMessage = 'Request timeout - The request is taking longer than expected. Please try again.';
          
          if (endpoint.includes('/flashcards/generate')) {
            timeoutMessage = 'Request timeout - Flashcard generation is taking longer than expected. Please try again.';
          } else if (endpoint.includes('/summarize/async') || endpoint.includes('/async')) {
            timeoutMessage = 'Request timeout - Async job initialization is taking longer than expected (2+ minutes). The backend might be processing a heavy workload. Please try again in a few moments.';
          }
          
          throw new Error(timeoutMessage);
        }
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
  USER: '/user',
  
  // Subscription
  PLANS: '/plans',
  SUBSCRIPTION: '/subscription',
  SUBSCRIPTION_HISTORY: '/subscription/history',
  SUBSCRIPTION_UPGRADE: '/subscription/upgrade',
  SUBSCRIPTION_DOWNGRADE: '/subscription/downgrade',
  SUBSCRIPTION_CANCEL: '/subscription/cancel',
  USAGE_STATS: '/usage',
  
  // Payment
  CHECKOUT_CREATE: '/checkout',
  
  // AI Tools
  YOUTUBE_SUMMARIZE: '/youtube/summarize',
  PDF_SUMMARIZE: '/pdf/summarize',
  WRITER_RUN: '/writer/run',
  MATH_SOLVE: '/math/solve',
  FLASHCARDS_GENERATE: '/flashcards/generate',
  DIAGRAM_GENERATE: '/diagram/generate',
  
  // Flashcard Management
  FLASHCARDS: '/flashcards',
  FLASHCARDS_PUBLIC: '/flashcards/public',
  
  // File Management
  FILES_UPLOAD: '/files/upload',
  FILES: '/files',
  
  // AI Results Management
  AI_RESULTS: '/ai-results',
  AI_RESULTS_STATS: '/ai-results/stats',
  
  // PDF Summary Management
  PDF_SUMMARIES: '/pdf-summaries',
  
  // Unified Summarization
  SUMMARIZE: '/summarize',
  SUMMARIZE_ASYNC: '/summarize/async',
  SUMMARIZE_STATUS: '/status',
  SUMMARIZE_RESULT: '/result',
  UPLOAD_FILE: '/summarize/upload',
  UPLOAD_STATUS: '/summarize/upload',
  
  // AI Chat
  CHAT: '/chat',
  CHAT_HISTORY: '/chat/history',
  
  // Chat Sessions
  CHAT_SESSIONS: '/chat/sessions',
  CHAT_CREATE_AND_CHAT: '/chat/create-and-chat',
} as const;

// Type definitions for API responses
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  success?: boolean;
}

// Utility functions for common API operations
export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<AuthResponse>(API_ENDPOINTS.LOGIN, { email, password }),
  
  register: (name: string, email: string, password: string) =>
    apiClient.post<AuthResponse>(API_ENDPOINTS.REGISTER, { name, email, password }),
  
  logout: () =>
    apiClient.post<{ message: string }>(API_ENDPOINTS.LOGOUT),
  
  getCurrentUser: () =>
    apiClient.get<User>(API_ENDPOINTS.USER),
};

export const subscriptionApi = {
  getPlans: () =>
    apiClient.get<SubscriptionPlan[]>(API_ENDPOINTS.PLANS),
  
  getCurrentSubscription: () =>
    apiClient.get<Subscription>(API_ENDPOINTS.SUBSCRIPTION),
  
  getSubscriptionHistory: () =>
    apiClient.get<Subscription[]>(API_ENDPOINTS.SUBSCRIPTION_HISTORY),
  
  getUsageStats: () =>
    apiClient.get<UsageStats>(API_ENDPOINTS.USAGE),
};

export const paymentApi = {
  createCheckoutSession: (planId: number, successUrl: string, cancelUrl: string) =>
    apiClient.post<CheckoutResponse>(API_ENDPOINTS.CHECKOUT, {
      plan_id: planId,
      success_url: successUrl,
      cancel_url: cancelUrl,
    }),
};

export const aiToolsApi = {
  summarizeYouTube: (videoUrl: string, language?: string, mode?: string) =>
    apiClient.post<YouTubeSummarizeResponse>(API_ENDPOINTS.YOUTUBE_SUMMARIZE, {
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
    apiClient.post<{ diagram: string }>(API_ENDPOINTS.DIAGRAM_GENERATE, {
      description,
    }),
};

// Async YouTube Summarization API
export const asyncYouTubeApi = {
  // Start async YouTube summarization job
  startJob: (request: AsyncSummarizeRequest) =>
    apiClient.post<AsyncSummarizeResponse>(API_ENDPOINTS.SUMMARIZE_ASYNC, request),
  
  // Check job status
  getJobStatus: (jobId: string) =>
    apiClient.get<JobStatusResponse>(`${API_ENDPOINTS.SUMMARIZE_STATUS}?job_id=${jobId}`),
  
  // Get job result
  getJobResult: (jobId: string) =>
    apiClient.get<JobResultResponse>(`${API_ENDPOINTS.SUMMARIZE_RESULT}?job_id=${jobId}`),
  
  // Helper: use absolute poll/result URLs from backend response
  getJobStatusByUrl: (pollUrl: string) => {
    console.log('asyncYouTubeApi.getJobStatusByUrl called with:', pollUrl);
    try {
      const url = new URL(pollUrl);
      let endpoint = url.pathname.replace(/^\/api/, '');
      
      // Handle both old format (/status/{id}) and new format (/status?job_id={id})
      if (url.search) {
        // New format: has query parameters
        endpoint += url.search;
      } else {
        // Old format: extract job_id from path and convert to query parameter
        const pathParts = endpoint.split('/');
        if (pathParts.length >= 3 && pathParts[1] === 'status') {
          const jobId = pathParts[2];
          endpoint = '/status?job_id=' + jobId;
        }
      }
      
      console.log('Parsed endpoint:', endpoint);
      return apiClient.get<JobStatusResponse>(endpoint);
    } catch (error) {
      console.log('URL parsing failed, using fallback:', error);
      const endpoint = pollUrl.replace(/^http(s)?:\/\/[^/]+/, '').replace(/^\/api/, '');
      console.log('Fallback endpoint:', endpoint);
      return apiClient.get<JobStatusResponse>(endpoint);
    }
  },

  getJobResultByUrl: (resultUrl: string) => {
    console.log('asyncYouTubeApi.getJobResultByUrl called with:', resultUrl);
    try {
      const url = new URL(resultUrl);
      let endpoint = url.pathname.replace(/^\/api/, '');
      
      // Handle both old format (/result/{id}) and new format (/result?job_id={id})
      if (url.search) {
        // New format: has query parameters
        endpoint += url.search;
      } else {
        // Old format: extract job_id from path and convert to query parameter
        const pathParts = endpoint.split('/');
        if (pathParts.length >= 3 && pathParts[1] === 'result') {
          const jobId = pathParts[2];
          endpoint = '/result?job_id=' + jobId;
        }
      }
      
      console.log('Parsed result endpoint:', endpoint);
      return apiClient.get<JobResultResponse>(endpoint);
    } catch (error) {
      console.log('URL parsing failed, using fallback:', error);
      const endpoint = resultUrl.replace(/^http(s)?:\/\/[^/]+/, '').replace(/^\/api/, '');
      console.log('Fallback result endpoint:', endpoint);
      return apiClient.get<JobResultResponse>(endpoint);
    }
  },
};

// Specialized API endpoints for different input types
export const specializedSummarizeApi = {
  // Unified summarize function that routes to appropriate specialized endpoint
  summarize: async (request: SummarizeRequest): Promise<SummarizeResponse | AsyncSummarizeResponse> => {
    const { content_type, source, options } = request;
    
    switch (content_type) {
      case 'text':
        return apiClient.post<SummarizeResponse>('/summarize/async/text', { 
          text: source.data, 
          options 
        });
      
      case 'youtube':
        return apiClient.post<AsyncSummarizeResponse>('/summarize/async/youtube', { 
          url: source.data, 
          options 
        });
      
      case 'link':
        return apiClient.post<AsyncSummarizeResponse>('/summarize/link', { 
          url: source.data, 
          options 
        });
      
      case 'pdf':
      case 'file':
        return apiClient.post<AsyncSummarizeResponse>('/summarize/async/file', {
          file_id: source.data,
          options
        });
      
      case 'audio':
      case 'video':
        return apiClient.post<AsyncSummarizeResponse>('/summarize/async/audiovideo', {
          file_id: source.data,
          options
        });
      
      case 'image':
        return apiClient.post<AsyncSummarizeResponse>('/summarize/async/image', {
          file_id: source.data,
          options
        });
      
      default:
        throw new Error(`Unsupported content type: ${content_type}`);
    }
  },

  // Password-protected summarization
  summarizeWithPassword: async (request: SummarizeRequest & { password: string }): Promise<SummarizeResponse | AsyncSummarizeResponse> => {
    const { content_type, source, options, password } = request;
    const requestWithPassword = {
      content_type,
      source,
      options: {
        ...options,
        password
      }
    };
    
    return specializedSummarizeApi.summarize(requestWithPassword);
  },

  // Poll job completion
  pollJobCompletion: async (
    jobId: string, 
    maxAttempts: number = 60, 
    interval: number = 2000
  ): Promise<{ success: boolean; result?: any; error?: string }> => {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const status = await specializedSummarizeApi.getJobStatus(jobId);
        
        if (status.status === 'completed') {
          const result = await specializedSummarizeApi.getJobResult(jobId);
          return { success: true, result };
        } else if (status.status === 'failed') {
          return { success: false, error: status.error || 'Job failed' };
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error) {
        console.error(`Poll attempt ${i + 1} failed:`, error);
        if (i === maxAttempts - 1) {
          return { success: false, error: 'Polling failed' };
        }
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    return { success: false, error: 'Job timeout' };
  },

  // YouTube Video Summarization
  startYouTubeJob: (url: string, options: any = {}) =>
    apiClient.post<AsyncSummarizeResponse>('/summarize/async/youtube', { url, options }),
  
  // Text Summarization
  startTextJob: (text: string, options: any = {}) =>
    apiClient.post<AsyncSummarizeResponse>('/summarize/async/text', { text, options }),
  
  // Audio/Video File Summarization (uses file_id, not file upload)
  startAudioVideoJob: (file_id: string, options: any = {}) =>
    apiClient.post<AsyncSummarizeResponse>('/summarize/async/audiovideo', { file_id, options }),
  
  // General File Upload Summarization (uses file_id, not file upload)
  startFileJob: (file_id: string, options: any = {}) =>
    apiClient.post<AsyncSummarizeResponse>('/summarize/async/file', { file_id, options }),
  
  // Link Summarization
  startLinkJob: (url: string, options: any = {}) =>
    apiClient.post<AsyncSummarizeResponse>('/summarize/link', { url, options }),
  
  // Image Summarization (uses file_id, not file upload)
  startImageJob: (file_id: string, options: any = {}) =>
    apiClient.post<AsyncSummarizeResponse>('/summarize/async/image', { file_id, options }),
  
  // Universal status and result methods (works for all job types)
  getJobStatus: (jobId: string) =>
    apiClient.get<JobStatusResponse>(`${API_ENDPOINTS.SUMMARIZE_STATUS}?job_id=${jobId}`),
  
  getJobResult: (jobId: string) =>
    apiClient.get<JobResultResponse>(`${API_ENDPOINTS.SUMMARIZE_RESULT}?job_id=${jobId}`),
  
  // Type-specific status methods (provide better validation and include tool_type/input_type)
  getYouTubeJobStatus: (jobId: string) =>
    apiClient.get<JobStatusResponse>(`/status/summarize/youtube?job_id=${jobId}`),
  
  getYouTubeJobResult: (jobId: string) =>
    apiClient.get<JobResultResponse>(`/result/summarize/youtube?job_id=${jobId}`),
  
  getTextJobStatus: (jobId: string) =>
    apiClient.get<JobStatusResponse>(`/status/summarize/text?job_id=${jobId}`),
  
  getTextJobResult: (jobId: string) =>
    apiClient.get<JobResultResponse>(`/result/summarize/text?job_id=${jobId}`),
  
  getFileJobStatus: (jobId: string) =>
    apiClient.get<JobStatusResponse>(`/status/summarize/file?job_id=${jobId}`),
  
  getFileJobResult: (jobId: string) =>
    apiClient.get<JobResultResponse>(`/result/summarize/file?job_id=${jobId}`),
  
  getAudioVideoJobStatus: (jobId: string) =>
    apiClient.get<JobStatusResponse>(`/status/summarize/audiovideo?job_id=${jobId}`),
  
  getAudioVideoJobResult: (jobId: string) =>
    apiClient.get<JobResultResponse>(`/result/summarize/audiovideo?job_id=${jobId}`),
  
  getLinkJobStatus: (jobId: string) =>
    apiClient.get<JobStatusResponse>(`/status/summarize/web?job_id=${jobId}`),
  
  getLinkJobResult: (jobId: string) =>
    apiClient.get<JobResultResponse>(`/result/summarize/web?job_id=${jobId}`),
  
  // Helper: use absolute poll/result URLs from backend response
  getJobStatusByUrl: (pollUrl: string) => {
    console.log('specializedSummarizeApi.getJobStatusByUrl called with:', pollUrl);
    try {
      const url = new URL(pollUrl);
      let endpoint = url.pathname.replace(/^\/api/, '');
      
      // Handle both old format (/status/{id}) and new format (/status?job_id={id} or /status/summarize/{type}?job_id={id})
      if (url.search) {
        // New format: has query parameters
        endpoint += url.search;
      } else {
        // Old format: extract job_id from path and convert to query parameter
        const pathParts = endpoint.split('/');
        if (pathParts.length >= 3 && pathParts[1] === 'status') {
          const jobId = pathParts[2];
          // Check if it's a specific endpoint like /status/summarize/youtube/{id}
          if (pathParts.length >= 4 && pathParts[2] === 'summarize') {
            const type = pathParts[3];
            const id = pathParts[4];
            endpoint = `/status/summarize/${type}?job_id=${id}`;
          } else {
          endpoint = '/status?job_id=' + jobId;
          }
        }
      }
      
      console.log('Parsed endpoint:', endpoint);
      return apiClient.get<JobStatusResponse>(endpoint);
    } catch (error) {
      console.log('URL parsing failed, using fallback:', error);
      const endpoint = pollUrl.replace(/^http(s)?:\/\/[^/]+/, '').replace(/^\/api/, '');
      console.log('Fallback endpoint:', endpoint);
      return apiClient.get<JobStatusResponse>(endpoint);
    }
  },
  
  // Helper: use absolute result URL from backend response
  getJobResultByUrl: (resultUrl: string) => {
    console.log('specializedSummarizeApi.getJobResultByUrl called with:', resultUrl);
    try {
      const url = new URL(resultUrl);
      let endpoint = url.pathname.replace(/^\/api/, '');
      
      // Handle both old format (/result/{id}) and new format (/result?job_id={id} or /result/summarize/{type}?job_id={id})
      if (url.search) {
        // New format: has query parameters
        endpoint += url.search;
      } else {
        // Old format: extract job_id from path and convert to query parameter
        const pathParts = endpoint.split('/');
        if (pathParts.length >= 3 && pathParts[1] === 'result') {
          const jobId = pathParts[2];
          // Check if it's a specific endpoint like /result/summarize/youtube/{id}
          if (pathParts.length >= 4 && pathParts[2] === 'summarize') {
            const type = pathParts[3];
            const id = pathParts[4];
            endpoint = `/result/summarize/${type}?job_id=${id}`;
          } else {
          endpoint = '/result?job_id=' + jobId;
          }
        }
      }
      
      console.log('Parsed result endpoint:', endpoint);
      return apiClient.get<JobResultResponse>(endpoint);
    } catch (error) {
      console.log('URL parsing failed, using fallback:', error);
      const endpoint = resultUrl.replace(/^http(s)?:\/\/[^/]+/, '').replace(/^\/api/, '');
      console.log('Fallback result endpoint:', endpoint);
      return apiClient.get<JobResultResponse>(endpoint);
    }
  }
};

export const chatApi = {
  sendMessage: (request: ChatRequest) =>
    apiClient.post<ChatResponse>(API_ENDPOINTS.CHAT, request),
  
  getChatHistory: (perPage: number = 10, page: number = 1) =>
    apiClient.get<ChatHistoryResponse>(`${API_ENDPOINTS.CHAT_HISTORY}?per_page=${perPage}&page=${page}`),
};

// New summarization API types
export interface SummarizeRequest {
  content_type: 'text' | 'link' | 'pdf' | 'image' | 'audio' | 'video';
  source: {
    type: 'text' | 'url' | 'file';
    data: string;
  };
  options: {
    mode: 'detailed' | 'brief' | 'bundle';
    language: string;
    focus?: 'summary' | 'analysis' | 'key_points';
    password?: string;
  };
}

export interface SummarizeResponse {
  success?: boolean;
  message?: string;
  summary?: string; // For backward compatibility
  error?: string;
  data?: {
    summary?: string;
    metadata?: {
      content_type: string;
      processing_time: string;
      tokens_used: number;
      confidence: number;
    };
    source_info?: {
      word_count?: number;
      character_count?: number;
      duration?: string;
      file_size?: string;
      audio_quality?: string;
      video_quality?: string;
      transcription?: string;
      // PDF specific
      pages?: number;
      title?: string;
      author?: string;
      created_date?: string;
      subject?: string;
      password_protected?: boolean;
      // Link specific
      url?: string;
      title?: string;
      description?: string;
      author?: string;
      published_date?: string;
      // Image specific
      image_resolution?: string;
      file_format?: string;
    };
    ai_result?: {
      id: number;
      title: string;
      file_url?: string;
      created_at: string;
    };
  };
  ui_helpers?: {
    summary_length: number;
    word_count: number;
    estimated_read_time: string;
    can_download: boolean;
    can_share: boolean;
  };
  // Legacy fields for backward compatibility
  metadata?: {
    content_type: string;
    processing_time: string;
    tokens_used: number;
    confidence: number;
  };
  source_info?: {
    word_count?: number;
    character_count?: number;
    duration?: string;
    file_size?: string;
    audio_quality?: string;
    video_quality?: string;
    transcription?: string;
    // PDF specific
    pages?: number;
    title?: string;
    author?: string;
    created_date?: string;
    subject?: string;
    password_protected?: boolean;
    // Link specific
    url?: string;
    title?: string;
    description?: string;
    author?: string;
    published_date?: string;
    // Image specific
    image_resolution?: string;
    file_format?: string;
  };
}

// Async summarization types
export interface AsyncSummarizeResponse {
  job_id: string;
  poll_url: string;
  result_url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  message: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  message: string;
  logs?: string[];
  error?: string;
  created_at: string;
  updated_at: string;
}

export interface JobResultResponse {
  job_id: string;
  status: 'completed' | 'failed';
  result?: SummarizeResponse;
  error?: string;
  completed_at: string;
}

export interface UploadResponse {
  upload_id: number;
  filename: string;
  file_path: string;
  file_size: number;
  content_type: string;
  status: string;
}

export interface UploadStatusResponse {
  upload_id: number;
  status: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

// Chat Session types
export interface ChatSession {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  message_count: number;
  last_activity: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  metadata?: {
    tokens_used?: number;
    processing_time?: string;
  };
  created_at: string;
}

export interface CreateSessionRequest {
  name: string;
  description?: string;
}

export interface CreateAndChatRequest {
  message: string;
  name?: string;
  description?: string;
}

export interface CreateAndChatResponse {
  response: string;
  session_id: number;
  model_used: string;
  timestamp: string;
  metadata: {
    tokens_used: number;
    processing_time: string;
  };
}

export interface SessionMessagesResponse {
  messages: ChatMessage[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface SendMessageRequest {
  content: string;
  conversation_history?: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface SendMessageResponse {
  user_message: ChatMessage;
  ai_message: ChatMessage;
  session: {
    id: number;
    name: string;
    message_count: number;
  };
}

// New summarization API functions
export const summarizeApi = {
  // Unified summarization endpoint
  summarize: (request: SummarizeRequest) =>
    apiClient.post<SummarizeResponse>(API_ENDPOINTS.SUMMARIZE, request),
  
  // Async summarization endpoints
  summarizeAsync: (request: SummarizeRequest) =>
    apiClient.post<AsyncSummarizeResponse>(API_ENDPOINTS.SUMMARIZE_ASYNC, request),
  
  getJobStatus: (jobId: string) =>
    apiClient.get<JobStatusResponse>(`${API_ENDPOINTS.SUMMARIZE_STATUS}?job_id=${jobId}`),
  
  getJobResult: (jobId: string) =>
    apiClient.get<JobResultResponse>(`${API_ENDPOINTS.SUMMARIZE_RESULT}?job_id=${jobId}`),

  // Helpers: use absolute poll/result URLs from backend response
  getJobStatusByUrl: (pollUrl: string) => {
    console.log('summarizeApi.getJobStatusByUrl called with:', pollUrl);
    try {
      const url = new URL(pollUrl);
      let endpoint = url.pathname.replace(/^\/api/, '');
      
      // Handle both old format (/status/{id}) and new format (/status?job_id={id})
      if (url.search) {
        // New format: has query parameters
        endpoint += url.search;
      } else {
        // Old format: extract job_id from path and convert to query parameter
        const pathParts = endpoint.split('/');
        if (pathParts.length >= 3 && pathParts[1] === 'status') {
          const jobId = pathParts[2];
          endpoint = '/status?job_id=' + jobId;
        }
      }
      
      console.log('Parsed endpoint:', endpoint);
      return apiClient.get<JobStatusResponse>(endpoint);
    } catch (error) {
      console.log('URL parsing failed, using fallback:', error);
      // Fallback: assume caller passed a path
      const endpoint = pollUrl.replace(/^http(s)?:\/\/[^/]+/, '').replace(/^\/api/, '');
      console.log('Fallback endpoint:', endpoint);
      return apiClient.get<JobStatusResponse>(endpoint);
    }
  },

  getJobResultByUrl: (resultUrl: string) => {
    console.log('summarizeApi.getJobResultByUrl called with:', resultUrl);
    try {
      const url = new URL(resultUrl);
      let endpoint = url.pathname.replace(/^\/api/, '');
      
      // Handle both old format (/result/{id}) and new format (/result?job_id={id})
      if (url.search) {
        // New format: has query parameters
        endpoint += url.search;
      } else {
        // Old format: extract job_id from path and convert to query parameter
        const pathParts = endpoint.split('/');
        if (pathParts.length >= 3 && pathParts[1] === 'result') {
          const jobId = pathParts[2];
          endpoint = '/result?job_id=' + jobId;
        }
      }
      
      console.log('Parsed result endpoint:', endpoint);
      return apiClient.get<JobResultResponse>(endpoint);
    } catch (error) {
      console.log('URL parsing failed, using fallback:', error);
      const endpoint = resultUrl.replace(/^http(s)?:\/\/[^/]+/, '').replace(/^\/api/, '');
      console.log('Fallback result endpoint:', endpoint);
      return apiClient.get<JobResultResponse>(endpoint);
    }
  },
  
  // File upload
  uploadFile: (file: File, contentType: string) =>
    apiClient.uploadFile<UploadResponse>(API_ENDPOINTS.UPLOAD_FILE, file, {
      content_type: contentType,
    }),
  
  // Check upload status
  getUploadStatus: (uploadId: number) =>
    apiClient.get<UploadStatusResponse>(`${API_ENDPOINTS.UPLOAD_STATUS}/${uploadId}/status`),
};

// Chat Session API functions
export const chatSessionApi = {
  // Get all sessions
  getSessions: (page: number = 1, perPage: number = 20) =>
    apiClient.get<{ sessions: ChatSession[]; pagination: any }>(`${API_ENDPOINTS.CHAT_SESSIONS}?page=${page}&per_page=${perPage}`),
  
  // Create new session
  createSession: (request: CreateSessionRequest) =>
    apiClient.post<{ session: ChatSession }>(API_ENDPOINTS.CHAT_SESSIONS, request),
  
  // Create session and start chatting
  createAndChat: (request: CreateAndChatRequest) =>
    apiClient.post<CreateAndChatResponse>(API_ENDPOINTS.CHAT_CREATE_AND_CHAT, request),
  
  // Get specific session
  getSession: (sessionId: number) =>
    apiClient.get<{ session: ChatSession & { messages: ChatMessage[] } }>(`${API_ENDPOINTS.CHAT_SESSIONS}/${sessionId}`),
  
  // Update session
  updateSession: (sessionId: number, request: CreateSessionRequest) =>
    apiClient.put<{ session: ChatSession }>(`${API_ENDPOINTS.CHAT_SESSIONS}/${sessionId}`, request),
  
  // Delete session
  deleteSession: (sessionId: number) =>
    apiClient.delete<{ message: string }>(`${API_ENDPOINTS.CHAT_SESSIONS}/${sessionId}`),
  
  // Archive session
  archiveSession: (sessionId: number) =>
    apiClient.post<{ message: string }>(`${API_ENDPOINTS.CHAT_SESSIONS}/${sessionId}/archive`),
  
  // Restore session
  restoreSession: (sessionId: number) =>
    apiClient.post<{ message: string }>(`${API_ENDPOINTS.CHAT_SESSIONS}/${sessionId}/restore`),
  
  // Send message to session
  sendMessage: (sessionId: number, request: SendMessageRequest) =>
    apiClient.post<SendMessageResponse>(`${API_ENDPOINTS.CHAT_SESSIONS}/${sessionId}/messages`, request),
  
  // Get session messages
  getSessionMessages: (sessionId: number, page: number = 1, perPage: number = 50) =>
    apiClient.get<SessionMessagesResponse>(`${API_ENDPOINTS.CHAT_SESSIONS}/${sessionId}/messages?page=${page}&per_page=${perPage}`),
  
  // Get conversation history
  getConversationHistory: (sessionId: number) =>
    apiClient.get<{ session_id: number; session_name: string; conversation: ChatMessage[]; total_messages: number }>(`${API_ENDPOINTS.CHAT_SESSIONS}/${sessionId}/history`),
};

// Flashcard API functions
export const flashcardApi = {
  // Generate flashcards (supports file uploads)
  generate: (request: FlashcardGenerateRequest) => {
    if (request.file) {
      // File upload - use FormData
      const formData = new FormData();
      formData.append('file', request.file);
      formData.append('input_type', request.input_type || 'file');
      formData.append('count', (request.count || 5).toString());
      formData.append('difficulty', request.difficulty || 'intermediate');
      formData.append('style', request.style || 'mixed');
      
      return apiClient.uploadFile<FlashcardGenerateResponse>(
        API_ENDPOINTS.FLASHCARDS_GENERATE, 
        request.file, 
        {
          input_type: request.input_type || 'file',
          count: request.count || 5,
          difficulty: request.difficulty || 'intermediate',
          style: request.style || 'mixed'
        }
      );
    } else {
      // Text/URL input - use JSON
      return apiClient.post<FlashcardGenerateResponse>(API_ENDPOINTS.FLASHCARDS_GENERATE, request);
    }
  },
  
  // Get user's flashcard sets
  getSets: (page: number = 1, perPage: number = 15, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      ...(search && { search })
    });
    return apiClient.get<FlashcardSetsResponse>(`${API_ENDPOINTS.FLASHCARDS}?${params}`);
  },
  
  // Get specific flashcard set
  getSet: (id: number) =>
    apiClient.get<FlashcardSetResponse>(`${API_ENDPOINTS.FLASHCARDS}/${id}`),
  
  // Update flashcard set
  updateSet: (id: number, request: FlashcardUpdateRequest) =>
    apiClient.put<{ message: string; flashcard_set: FlashcardSet }>(`${API_ENDPOINTS.FLASHCARDS}/${id}`, request),
  
  // Delete flashcard set
  deleteSet: (id: number) =>
    apiClient.delete<{ message: string }>(`${API_ENDPOINTS.FLASHCARDS}/${id}`),
  
  // Get public flashcard sets
  getPublicSets: (page: number = 1, perPage: number = 15, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      ...(search && { search })
    });
    return apiClient.get<FlashcardSetsResponse>(`${API_ENDPOINTS.FLASHCARDS_PUBLIC}?${params}`);
  },
};

// File Management API functions
export const fileApi = {
  // Validate file before upload
  validate: (file: File, contentType: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('content_type', contentType);
    return apiClient.uploadFile<{
      success: boolean;
      validation: {
        is_valid: boolean;
        errors: string[];
        warnings: string[];
        file_info: {
          name: string;
          size: number;
          human_size: string;
          type: string;
          extension: string;
        };
      };
      can_upload: boolean;
      message: string;
    }>('/summarize/validate', file, { content_type: contentType });
  },

  // Upload file using original endpoint (more reliable)
  upload: (file: File, metadata?: { tool_type: string; description?: string }) => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }
    return apiClient.uploadFile<{
      message: string;
      file_upload: {
        id: number;
        original_name: string;
        stored_name: string;
        file_type: string;
        file_size: number;
        human_file_size: string;
        mime_type: string;
        is_processed: boolean;
        created_at: string;
      };
      file_url: string;
    }>('/files/upload', file, metadata);
  },
  
  // Get user's files
  getFiles: (search?: string, page: number = 1, perPage: number = 15) => {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      ...(search && { search })
    });
    return apiClient.get<{
      files: Array<{
        id: number;
        original_name: string;
        stored_name: string;
        file_type: string;
        file_size: number;
        human_file_size: string;
        mime_type: string;
        is_processed: boolean;
        file_url: string;
        created_at: string;
      }>;
      pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
      };
    }>(`/files?${params}`);
  },
  
  // Get specific file
  getFile: (id: number) =>
    apiClient.get<{
      file: {
        id: number;
        original_name: string;
        stored_name: string;
        file_type: string;
        file_size: number;
        human_file_size: string;
        mime_type: string;
        is_processed: boolean;
        file_url: string;
        metadata?: {
          tool_type: string;
          uploaded_at: string;
        };
        created_at: string;
      };
    }>(`/files/${id}`),
  
  // Get file content
  getFileContent: (id: number) =>
    apiClient.get<{
      content: string;
      metadata: {
        word_count: number;
        character_count: number;
        pages: Array<{
          page: number;
          text: string;
        }>;
        total_pages: number;
      };
    }>(`/files/${id}/content`),
  
  // Delete file
  deleteFile: (id: number) =>
    apiClient.delete<{ message: string }>(`/files/${id}`),
};

// AI Results Management API functions
export const aiResultsApi = {
  // Get AI results
  getResults: (toolType?: string, search?: string, page: number = 1, perPage: number = 15) => {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      ...(toolType && { tool_type: toolType }),
      ...(search && { search })
    });
    return apiClient.get<{
      ai_results: Array<{
        id: number;
        tool_type: string;
        title: string;
        description: string;
        status: string;
        file_url?: string;
        input_data: any;
        result_data: any;
        metadata: any;
        created_at: string;
      }>;
      pagination: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
      };
    }>(`/ai-results?${params}`);
  },
  
  // Get specific AI result
  getResult: (id: number) =>
    apiClient.get<{
      ai_result: {
        id: number;
        tool_type: string;
        title: string;
        description: string;
        status: string;
        file_url?: string;
        file_upload?: {
          id: number;
          original_name: string;
          file_type: string;
          file_url: string;
        };
        input_data: any;
        result_data: any;
        metadata: any;
        created_at: string;
      };
    }>(`/ai-results/${id}`),
  
  // Update AI result
  updateResult: (id: number, data: { title?: string; description?: string; metadata?: any }) =>
    apiClient.put<{
      message: string;
      ai_result: {
        id: number;
        title: string;
        description: string;
        updated_at: string;
      };
    }>(`/ai-results/${id}`, data),
  
  // Delete AI result
  deleteResult: (id: number) =>
    apiClient.delete<{ message: string }>(`/ai-results/${id}`),
  
  // Get AI results statistics
  getStats: () =>
    apiClient.get<{
      stats: {
        total_results: number;
        results_by_tool: Record<string, number>;
        recent_results: Array<{
          id: number;
          title: string;
          tool_type: string;
          created_at: string;
        }>;
      };
    }>('/ai-results/stats'),
};

// PDF Summary API functions
export const pdfSummaryApi = {
  // Get user's PDF summaries
  getSummaries: (page: number = 1, perPage: number = 15, search?: string) => {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      ...(search && { search })
    });
    return apiClient.get<PDFSummariesResponse>(`${API_ENDPOINTS.PDF_SUMMARIES}?${params}`);
  },
  
  // Get specific PDF summary
  getSummary: (id: number) =>
    apiClient.get<PDFSummaryResponse>(`${API_ENDPOINTS.PDF_SUMMARIES}/${id}`),
  
  // Create PDF summary
  createSummary: (request: PDFSummaryCreateRequest) => {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('language', request.language || 'en');
    formData.append('mode', request.mode || 'detailed');
    formData.append('focus', request.focus || 'summary');
    
    return apiClient.uploadFile<PDFSummaryCreateResponse>(
      `${API_ENDPOINTS.PDF_SUMMARIES}/create`, 
      request.file, 
      {
        language: request.language || 'en',
        mode: request.mode || 'detailed',
        focus: request.focus || 'summary'
      }
    );
  },
  
  // Update PDF summary
  updateSummary: (id: number, request: { title?: string; description?: string }) =>
    apiClient.put<{ message: string; pdf_summary: PDFSummary }>(`${API_ENDPOINTS.PDF_SUMMARIES}/${id}`, request),
  
  // Delete PDF summary
  deleteSummary: (id: number) =>
    apiClient.delete<{ message: string }>(`${API_ENDPOINTS.PDF_SUMMARIES}/${id}`),
};

