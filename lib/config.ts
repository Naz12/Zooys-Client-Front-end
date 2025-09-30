// Configuration constants
export const config = {
  // API Configuration
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  
  // Authentication
  TOKEN_STORAGE_KEY: 'auth_token',
  USER_STORAGE_KEY: 'auth_user',
  
  // Session Management
  INACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  ACTIVITY_CHECK_INTERVAL: 60 * 1000, // 1 minute
  
  // File Upload
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['application/pdf', 'text/plain'],
  
  // UI Configuration
  TOAST_DURATION: 5000, // 5 seconds
  DEBOUNCE_DELAY: 300, // 300ms
  
  // Development
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/login',
    REGISTER: '/register',
    LOGOUT: '/logout',
  },
  
  // Subscription
  SUBSCRIPTION: {
    PLANS: '/plans',
    CURRENT: '/subscription',
    HISTORY: '/subscription/history',
    STRIPE_WEBHOOK: '/stripe/webhook',
  },
  
  // AI Tools
  AI_TOOLS: {
    YOUTUBE_SUMMARIZE: '/youtube/summarize',
    PDF_SUMMARIZE: '/pdf/summarize',
    WRITER_RUN: '/writer/run',
    MATH_SOLVE: '/math/solve',
    FLASHCARDS_GENERATE: '/flashcards/generate',
    DIAGRAM_GENERATE: '/diagram/generate',
  },
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  TIMEOUT_ERROR: 'Request timed out. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Successfully logged in!',
  REGISTER_SUCCESS: 'Account created successfully!',
  LOGOUT_SUCCESS: 'Successfully logged out!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  PASSWORD_CHANGED: 'Password changed successfully!',
} as const;
