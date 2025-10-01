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
  id: number;
  name: string;
  email: string;
  is_active: boolean;
  status: 'active' | 'inactive' | 'suspended';
  suspended_at?: string | null;
  suspension_reason?: string | null;
  created_at: string;
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
  id: number;
  name: string;
  price: string;
  currency: string;
  limit: number;
  is_active: boolean;
}

export interface Subscription {
  status: 'active' | 'none';
  plan?: string;
  price?: string;
  currency?: string;
  limit?: number;
  starts_at?: string;
  ends_at?: string;
  message?: string;
}

export interface SubscriptionHistory {
  plan: string;
  price: string;
  currency: string;
  limit: number;
  active: boolean;
  starts_at: string;
  ends_at: string;
}

// Usage Statistics Types
export interface UsageStats {
  current_usage: number;
  plan_limit: number;
  usage_percentage: number;
  remaining_usage: number;
  reset_date: string;
  by_tool: Record<string, number>;
}

// Payment Types
export interface CheckoutRequest {
  plan_id: number;
  success_url: string;
  cancel_url: string;
}

export interface CheckoutResponse {
  checkout_url: string;
  session_id: string;
}

// AI Tool Types
export interface YouTubeSummarizeRequest {
  video_url: string;
  language?: string;
  mode?: 'brief' | 'detailed' | 'key_points';
}

export interface YouTubeVideoInfo {
  title: string;
  channel: string;
  duration: string;
  views: string;
}

export interface YouTubeSummarizeResponse {
  summary: string;
  video_info: YouTubeVideoInfo;
}

export interface PDFSummarizeRequest {
  file_path: string;
  mode?: 'brief' | 'detailed' | 'key_points';
  language?: string;
}

export interface PDFSummarizeResponse {
  summary: string;
}

export interface WriterRunRequest {
  prompt: string;
  mode?: 'creative' | 'formal' | 'casual' | 'technical';
  length?: 'short' | 'medium' | 'long';
  tone?: string;
}

export interface WriterRunResponse {
  output: string;
}

export interface MathSolveRequest {
  problem: string;
  show_steps?: boolean;
  format?: 'text' | 'latex';
}

export interface MathSolveResponse {
  solution: string;
}

export interface FlashcardGenerateRequest {
  topic: string;
  count?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  subject?: string;
}

export interface Flashcard {
  question: string;
  answer: string;
}

export interface FlashcardGenerateResponse {
  flashcards: Flashcard[];
}

export interface DiagramGenerateRequest {
  description: string;
  type?: 'flowchart' | 'mindmap' | 'sequence' | 'class' | 'network';
  style?: 'simple' | 'detailed' | 'colorful';
}

export interface DiagramGenerateResponse {
  diagram: string;
}

// AI Chat Types
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  conversation_history?: ChatMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

export interface ChatResponse {
  response: string;
  model_used: string;
  timestamp: string;
}

export interface ChatHistoryItem {
  id: number;
  user_id: number;
  tool_id: number;
  input: string;
  output: string;
  created_at: string;
  updated_at: string;
}

export interface ChatHistoryResponse {
  data: ChatHistoryItem[];
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
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
