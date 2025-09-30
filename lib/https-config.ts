// HTTPS configuration and utilities
export const httpsConfig = {
  // Force HTTPS in production
  forceHttps: process.env.NEXT_PUBLIC_FORCE_HTTPS === 'true',
  
  // HTTPS redirect
  httpsRedirect: process.env.NEXT_PUBLIC_HTTPS_REDIRECT === 'true',
  
  // SSL certificate validation
  strictSSL: process.env.NODE_ENV === 'production',
  
  // HSTS (HTTP Strict Transport Security)
  hsts: {
    enabled: process.env.NODE_ENV === 'production',
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
};

// HTTPS redirect middleware
export function redirectToHttps(request: Request): Response | null {
  if (!httpsConfig.httpsRedirect || process.env.NODE_ENV !== 'production') {
    return null;
  }

  const url = new URL(request.url);
  
  if (url.protocol === 'http:') {
    url.protocol = 'https:';
    return Response.redirect(url.toString(), 301);
  }

  return null;
}

// HSTS headers
export function getHstsHeaders(): Record<string, string> {
  if (!httpsConfig.hsts.enabled) {
    return {};
  }

  const directives = [`max-age=${httpsConfig.hsts.maxAge}`];
  
  if (httpsConfig.hsts.includeSubDomains) {
    directives.push('includeSubDomains');
  }
  
  if (httpsConfig.hsts.preload) {
    directives.push('preload');
  }

  return {
    'Strict-Transport-Security': directives.join('; '),
  };
}

// Security headers for HTTPS
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
    ].join('; '),
    ...getHstsHeaders(),
  };
}

// HTTPS validation
export function validateHttps(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'https:';
  } catch {
    return false;
  }
}

// Force HTTPS for API calls
export function ensureHttps(url: string): string {
  if (httpsConfig.forceHttps && !validateHttps(url)) {
    return url.replace(/^http:/, 'https:');
  }
  return url;
}

// HTTPS configuration for axios
export function getHttpsAxiosConfig() {
  return {
    httpsAgent: process.env.NODE_ENV === 'production' ? {
      rejectUnauthorized: httpsConfig.strictSSL,
    } : undefined,
  };
}
