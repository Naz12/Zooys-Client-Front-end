// Environment configuration
export const environment = {
  // API Configuration
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  
  // Frontend Configuration
  FRONTEND_URL: process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000',
  PORT: process.env.PORT || '3000',
  
  // Stripe Configuration
  STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_...',
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  
  // Authentication
  TOKEN_STORAGE_KEY: process.env.NEXT_PUBLIC_TOKEN_STORAGE_KEY || 'auth_token',
  USER_STORAGE_KEY: process.env.NEXT_PUBLIC_USER_STORAGE_KEY || 'auth_user',
  
  // Session Management
  INACTIVITY_TIMEOUT: parseInt(process.env.NEXT_PUBLIC_INACTIVITY_TIMEOUT || '1800000'), // 30 minutes
  ACTIVITY_CHECK_INTERVAL: parseInt(process.env.NEXT_PUBLIC_ACTIVITY_CHECK_INTERVAL || '60000'), // 1 minute
  
  // File Upload
  MAX_FILE_SIZE: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10485760'), // 10MB
  ALLOWED_FILE_TYPES: (process.env.NEXT_PUBLIC_ALLOWED_FILE_TYPES || 'application/pdf,text/plain').split(','),
  
  // UI Configuration
  TOAST_DURATION: parseInt(process.env.NEXT_PUBLIC_TOAST_DURATION || '5000'), // 5 seconds
  DEBOUNCE_DELAY: parseInt(process.env.NEXT_PUBLIC_DEBOUNCE_DELAY || '300'), // 300ms
  
  // Development
  DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true' || true, // Enable debug mode
  ENABLE_LOGGING: process.env.NEXT_PUBLIC_ENABLE_LOGGING === 'true' || true, // Enable logging
  
  // CORS Configuration
  CORS_ORIGINS: process.env.NEXT_PUBLIC_CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  
  // HTTPS Configuration
  FORCE_HTTPS: process.env.NEXT_PUBLIC_FORCE_HTTPS === 'true',
  HTTPS_REDIRECT: process.env.NEXT_PUBLIC_HTTPS_REDIRECT === 'true',
} as const;

// Validation function
export function validateEnvironment() {
  const errors: string[] = [];
  
  if (!environment.API_BASE_URL) {
    errors.push('API_BASE_URL is required');
  }
  
  if (environment.INACTIVITY_TIMEOUT < 60000) {
    errors.push('INACTIVITY_TIMEOUT must be at least 60 seconds');
  }
  
  if (environment.MAX_FILE_SIZE < 1024) {
    errors.push('MAX_FILE_SIZE must be at least 1KB');
  }
  
  if (errors.length > 0) {
    throw new Error(`Environment validation failed: ${errors.join(', ')}`);
  }
  
  return true;
}

// Log environment info in development
if (environment.IS_DEVELOPMENT && environment.ENABLE_LOGGING) {
  console.log('Environment Configuration:', {
    API_BASE_URL: environment.API_BASE_URL,
    NODE_ENV: environment.NODE_ENV,
    DEBUG_MODE: environment.DEBUG_MODE,
    INACTIVITY_TIMEOUT: environment.INACTIVITY_TIMEOUT,
    MAX_FILE_SIZE: environment.MAX_FILE_SIZE,
  });
}
