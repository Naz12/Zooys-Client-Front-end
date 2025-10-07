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
export interface FileUpload {
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
}

export interface FileUploadRequest {
  file: File;
  metadata?: {
    tool_type: string;
    description?: string;
  };
}

export interface FileUploadResponse {
  message: string;
  file_upload: FileUpload;
  file_url: string;
}

export interface FilesResponse {
  files: FileUpload[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface FileResponse {
  file: FileUpload & {
    metadata?: {
      tool_type: string;
      uploaded_at: string;
    };
  };
}

export interface FileContentResponse {
  content: string;
  metadata: {
    word_count: number;
    character_count: number;
    pages?: Array<{
      page: number;
      text: string;
    }>;
    total_pages?: number;
  };
}

// AI Results Types
export interface AIResult {
  id: number;
  tool_type: string;
  title: string;
  description: string;
  status: 'completed' | 'processing' | 'failed';
  file_url?: string;
  input_data: {
    input: string;
    input_type: string;
    count?: number;
    difficulty?: string;
    style?: string;
  };
  result_data: any[];
  metadata: {
    generation_method: string;
    file_id?: number;
    file_name?: string;
    [key: string]: any;
  };
  file_upload?: {
    id: number;
    original_name: string;
    file_type: string;
    file_url: string;
  };
  created_at: string;
}

export interface AIResultsResponse {
  ai_results: AIResult[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface AIResultResponse {
  ai_result: AIResult;
}

export interface AIResultUpdateRequest {
  title?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface AIResultStatsResponse {
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
}

// Flashcard Types
export interface Flashcard {
  id: number;
  question: string;
  answer: string;
  order_index: number;
}

export interface FlashcardSet {
  id: number;
  title: string;
  description: string;
  input_type: 'text' | 'url' | 'youtube' | 'file';
  input_content?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  style: 'definition' | 'application' | 'analysis' | 'comparison' | 'mixed';
  total_cards: number;
  is_public: boolean;
  created_at: string;
  updated_at?: string;
  flashcards: Flashcard[];
  source_metadata?: {
    source_type: string;
    word_count?: number;
    character_count?: number;
  };
  user?: {
    id: number;
    name: string;
  };
}

export interface FlashcardGenerateRequest {
  input: string;
  input_type?: 'text' | 'url' | 'youtube' | 'file';
  count?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  style?: 'definition' | 'application' | 'analysis' | 'comparison' | 'mixed';
  file?: File; // For file uploads
}

export interface FlashcardGenerateResponse {
  flashcards: Flashcard[];
  flashcard_set: {
    id: number;
    title: string;
    description: string;
    total_cards: number;
    created_at: string;
  };
  ai_result: {
    id: number;
    title: string;
    file_url?: string;
    created_at: string;
  };
  metadata: {
    total_generated: number;
    input_type: string;
    source_metadata: {
      word_count?: number;
      character_count?: number;
    };
  };
}

export interface FlashcardSetsResponse {
  flashcard_sets: FlashcardSet[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface FlashcardSetResponse {
  flashcard_set: FlashcardSet;
}

export interface FlashcardUpdateRequest {
  title?: string;
  description?: string;
  is_public?: boolean;
}

// PDF Summary Types
export interface PDFSummary {
  id: number;
  title: string;
  description: string;
  file_url?: string;
  summary_content: string;
  source_metadata: {
    title?: string;
    author?: string;
    word_count?: number;
    character_count?: number;
    pages?: number;
  };
  created_at: string;
  updated_at?: string;
  file_upload?: {
    id: number;
    original_name: string;
    file_type: string;
    file_url: string;
  };
}

export interface PDFSummariesResponse {
  pdf_summaries: PDFSummary[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface PDFSummaryResponse {
  pdf_summary: PDFSummary;
}

export interface PDFSummaryCreateRequest {
  file: File;
  language?: string;
  mode?: 'brief' | 'detailed' | 'key_points';
  focus?: 'summary' | 'analysis' | 'key_points';
}

export interface PDFSummaryCreateResponse {
  message: string;
  pdf_summary: PDFSummary;
  ai_result: {
    id: number;
    title: string;
    file_url?: string;
    created_at: string;
  };
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

