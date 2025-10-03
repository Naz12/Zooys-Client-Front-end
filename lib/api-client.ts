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
  ChatHistoryResponse
} from './types/api';

// API base URL - Hardcoded to fix double /api issue
const API_BASE_URL = 'http://localhost:8000';

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
  LOGIN: '/api/login',
  REGISTER: '/api/register',
  LOGOUT: '/api/logout',
  USER: '/api/user',
  
  // Subscription
  PLANS: '/api/plans',
  SUBSCRIPTION: '/api/subscription',
  SUBSCRIPTION_HISTORY: '/api/subscription/history',
  USAGE: '/api/usage',
  
  // Payment
  CHECKOUT: '/api/checkout',
  
  // AI Tools
  YOUTUBE_SUMMARIZE: '/api/youtube/summarize',
  PDF_SUMMARIZE: '/api/pdf/summarize',
  WRITER_RUN: '/api/writer/run',
  MATH_SOLVE: '/api/math/solve',
  FLASHCARDS_GENERATE: '/api/flashcards/generate',
  DIAGRAM_GENERATE: '/api/diagram/generate',
  
  // Unified Summarization
  SUMMARIZE: '/api/summarize',
  UPLOAD_FILE: '/api/summarize/upload',
  UPLOAD_STATUS: '/api/summarize/upload',
  
  // AI Chat
  CHAT: '/api/chat',
  CHAT_HISTORY: '/api/chat/history',
  
  // Chat Sessions
  CHAT_SESSIONS: '/api/chat/sessions',
  CHAT_CREATE_AND_CHAT: '/api/chat/create-and-chat',
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
