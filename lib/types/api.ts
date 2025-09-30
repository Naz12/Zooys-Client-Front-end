// API Response Types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  success?: boolean;
  error?: string;
  code?: number;
}

export interface ApiError {
  message: string;
  code: number;
  details?: any;
  timestamp?: string;
}

// Authentication Types
export interface User {
  id: string;
  name: string;
  email: string;
  created_at?: string;
  updated_at?: string;
  email_verified?: boolean;
  subscription_id?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  confirm_password?: string;
}

// Subscription Types
export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number;
  currency: string;
  interval: 'monthly' | 'yearly' | 'lifetime';
  limit: number;
  features: string[];
  is_popular?: boolean;
  is_active?: boolean;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: SubscriptionPlan;
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  price: number;
  currency: string;
  limit: number;
  usage: number;
  starts_at: string;
  ends_at: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionHistory {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  price: number;
  currency: string;
  starts_at: string;
  ends_at: string;
  created_at: string;
}

// AI Tool Types
export interface YouTubeSummarizeRequest {
  video_url: string;
  language?: string;
  mode?: 'brief' | 'detailed' | 'key_points';
}

export interface YouTubeSummarizeResponse {
  summary: string;
  video_title?: string;
  video_duration?: string;
  key_points?: string[];
  timestamp?: string;
}

export interface PDFSummarizeRequest {
  file_path: string;
  mode?: 'brief' | 'detailed' | 'key_points';
  language?: string;
}

export interface PDFSummarizeResponse {
  summary: string;
  page_count?: number;
  key_points?: string[];
  timestamp?: string;
}

export interface WriterRunRequest {
  prompt: string;
  mode?: 'creative' | 'formal' | 'casual' | 'technical';
  length?: 'short' | 'medium' | 'long';
  tone?: string;
}

export interface WriterRunResponse {
  output: string;
  word_count?: number;
  reading_time?: number;
  timestamp?: string;
}

export interface MathSolveRequest {
  problem: string;
  show_steps?: boolean;
  format?: 'text' | 'latex';
}

export interface MathSolveResponse {
  solution: string;
  steps?: string[];
  explanation?: string;
  timestamp?: string;
}

export interface FlashcardGenerateRequest {
  topic: string;
  count?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  subject?: string;
}

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  difficulty?: string;
  subject?: string;
}

export interface FlashcardGenerateResponse {
  flashcards: Flashcard[];
  topic: string;
  count: number;
  timestamp?: string;
}

export interface DiagramGenerateRequest {
  description: string;
  type?: 'flowchart' | 'mindmap' | 'sequence' | 'class' | 'network';
  style?: 'simple' | 'detailed' | 'colorful';
}

export interface DiagramGenerateResponse {
  diagram_text: string;
  diagram_type: string;
  mermaid_code?: string;
  timestamp?: string;
}

// File Upload Types
export interface FileUploadRequest {
  file: File;
  type: 'pdf' | 'image' | 'document';
  metadata?: Record<string, any>;
}

export interface FileUploadResponse {
  file_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  file_type: string;
  upload_url?: string;
  timestamp?: string;
}

// Webhook Types
export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: any;
  };
  created: number;
}

export interface WebhookResponse {
  received: boolean;
  processed: boolean;
  message?: string;
}

// Usage and Analytics Types
export interface UsageStats {
  user_id: string;
  tool: string;
  count: number;
  last_used: string;
  total_usage: number;
}

export interface AnalyticsData {
  total_users: number;
  active_users: number;
  total_requests: number;
  popular_tools: Array<{
    tool: string;
    count: number;
  }>;
  usage_by_day: Array<{
    date: string;
    count: number;
  }>;
}

// Error Types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ApiErrorResponse {
  error: string;
  message: string;
  code: number;
  details?: ValidationError[];
  timestamp: string;
}

// Request/Response Interceptor Types
export interface RequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  data?: any;
  params?: Record<string, any>;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export interface ResponseConfig {
  data: any;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: RequestConfig;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Notification Types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: string;
}

// Session Types
export interface SessionData {
  user: User;
  token: string;
  refresh_token?: string;
  expires_at: number;
  last_activity: number;
  remember_me: boolean;
}

// Configuration Types
export interface AppConfig {
  api: {
    base_url: string;
    timeout: number;
    retries: number;
  };
  auth: {
    token_storage_key: string;
    user_storage_key: string;
    inactivity_timeout: number;
  };
  upload: {
    max_file_size: number;
    allowed_types: string[];
  };
  ui: {
    toast_duration: number;
    debounce_delay: number;
  };
}
