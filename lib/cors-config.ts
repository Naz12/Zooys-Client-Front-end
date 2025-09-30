// CORS configuration for API requests
export const corsConfig = {
  // Allowed origins
  allowedOrigins: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com', 'https://www.yourdomain.com']
    : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000'],

  // Allowed methods
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

  // Allowed headers
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
  ],

  // Credentials
  credentials: true,

  // Preflight cache duration
  maxAge: 86400, // 24 hours
};

// CORS validation function
export function validateCorsOrigin(origin: string): boolean {
  return corsConfig.allowedOrigins.includes(origin);
}

// CORS headers for API responses
export function getCorsHeaders(origin?: string) {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': corsConfig.allowedMethods.join(', '),
    'Access-Control-Allow-Headers': corsConfig.allowedHeaders.join(', '),
    'Access-Control-Allow-Credentials': corsConfig.credentials.toString(),
    'Access-Control-Max-Age': corsConfig.maxAge.toString(),
  };

  if (origin && validateCorsOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  } else if (process.env.NODE_ENV === 'development') {
    headers['Access-Control-Allow-Origin'] = '*';
  }

  return headers;
}

// CORS preflight handler
export function handleCorsPreflight(request: Request): Response {
  const origin = request.headers.get('Origin');
  const headers = getCorsHeaders(origin || undefined);

  return new Response(null, {
    status: 200,
    headers,
  });
}

// CORS middleware for API routes
export function withCors(handler: Function) {
  return async (request: Request, context?: any) => {
    const origin = request.headers.get('Origin');
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return handleCorsPreflight(request);
    }

    // Add CORS headers to response
    const response = await handler(request, context);
    const corsHeaders = getCorsHeaders(origin || undefined);

    // Add CORS headers to response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}
