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
  PDFSummaryCreateResponse
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
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'http://localhost:3000',
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
      body: config.body ? JSON.parse(config.body as string) : undefined
    });
    
    // Log the full request body separately for better visibility
    if (config.body) {
      console.log('Request Body:', JSON.parse(config.body as string));
    }

    try {
      console.log(`Making request to: ${url}`);
      console.log(`Request config:`, config);
      
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
        
        if (response.status === 404) {
          userMessage = 'The requested resource was not found. Please check if the service is available.';
        } else if (response.status === 401) {
          userMessage = 'Authentication required. Please log in to access this feature.';
        } else if (response.status === 403) {
          userMessage = 'You do not have permission to access this resource.';
        } else if (response.status === 500) {
          userMessage = 'Server error occurred. Please try again later.';
        } else if (response.status >= 400 && response.status < 500) {
          userMessage = 'Invalid request. Please check your input and try again.';
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
              headers: Object.fromEntries(response.headers.entries())
            };
            console.error('API Error Response:', errorInfo);
          }
          
          // Log the error data separately for better visibility (only if not empty)
          // Disabled to prevent empty object logging
          // if (errorData && Object.keys(errorData).length > 0) {
          //   console.error('Backend Error Details:', errorData);
          // }
        }
        
        const error = new Error(userMessage);
        (error as any).status = response.status;
        (error as any).response = errorData;
        (error as any).rawResponse = responseText;
        (error as any).userMessage = userMessage;
        throw error;
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
        
        if (response.status === 404) {
          userMessage = 'The requested resource was not found. Please check if the service is available.';
        } else if (response.status === 401) {
          userMessage = 'Authentication required. Please log in to access this feature.';
        } else if (response.status === 403) {
          userMessage = 'You do not have permission to access this resource.';
        } else if (response.status === 500) {
          userMessage = 'Server error occurred. Please try again later.';
        } else if (response.status >= 400 && response.status < 500) {
          userMessage = 'Invalid request. Please check your input and try again.';
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
              headers: Object.fromEntries(response.headers.entries())
            };
            console.error('API Error Response:', errorInfo);
          }
          
          // Log the error data separately for better visibility (only if not empty)
          // Disabled to prevent empty object logging
          // if (errorData && Object.keys(errorData).length > 0) {
          //   console.error('Backend Error Details:', errorData);
          // }
        }
        
        const error = new Error(userMessage);
        (error as any).status = response.status;
        (error as any).response = errorData;
        (error as any).rawResponse = responseText;
        (error as any).userMessage = userMessage;
        throw error;
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
  USER: '/user',
  
  // Subscription
  PLANS: '/plans',
  SUBSCRIPTION: '/subscription',
  SUBSCRIPTION_HISTORY: '/subscription/history',
  USAGE: '/usage',
  
  // Payment
  CHECKOUT: '/checkout',
  
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
    mode: 'detailed' | 'brief';
    language: string;
    focus?: 'summary' | 'analysis' | 'key_points';
    password?: string;
  };
}

export interface SummarizeResponse {
  summary?: string;
  error?: string;
  metadata: {
    content_type: string;
    processing_time: string;
    tokens_used: number;
    confidence: number;
  };
  source_info: {
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

