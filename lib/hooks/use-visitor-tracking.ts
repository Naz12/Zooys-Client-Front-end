"use client";

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { apiClient } from '@/lib/api-client';
import type { VisitorLocation, VisitorTrackingRequest } from '@/lib/types/api';

// API base URL for sendBeacon fallback
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Storage keys
const VISITOR_PUBLIC_ID_KEY = 'visitor_public_id';
const VISITOR_SESSION_ID_KEY = 'visitor_session_id';
const LOCATION_CACHE_KEY = 'visitor_location_cache';
const LOCATION_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Tool mapping from routes to tool IDs
const TOOL_ROUTE_MAP: Record<string, string> = {
  '/': 'dashboard',
  '/chat': 'ai_chat',
  '/writer': 'ai_writer',
  '/math-solver': 'ai_math_solver',
  '/flashcards': 'ai_flashcards',
  '/diagrams': 'ai_diagrams',
  '/presentation': 'ai_presentation',
  '/convert-file': 'file_converter',
  '/pdf-editor': 'pdf_editor',
  '/summarizer': 'ai_summarizer',
  '/summarizer/youtube': 'ai_summarizer_youtube',
  '/summarizer/pdf': 'ai_summarizer_pdf',
  '/summarizer/audio-video': 'ai_summarizer_audio_video',
  '/summarizer/text': 'ai_summarizer_text',
};

// Generate UUID v4
function generateUUID(): string {
  if (typeof window !== 'undefined' && 'crypto' in window && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Get or generate public ID
function getOrCreatePublicId(): string {
  if (typeof window === 'undefined') return '';
  
  try {
    let publicId = localStorage.getItem(VISITOR_PUBLIC_ID_KEY);
    if (!publicId) {
      publicId = generateUUID();
      localStorage.setItem(VISITOR_PUBLIC_ID_KEY, publicId);
    }
    return publicId;
  } catch (error) {
    console.warn('Failed to access localStorage for public ID:', error);
    // Fallback to session-only ID
    return generateUUID();
  }
}

// Get or create session ID
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  
  try {
    let sessionId = sessionStorage.getItem(VISITOR_SESSION_ID_KEY);
    if (!sessionId) {
      sessionId = generateUUID();
      sessionStorage.setItem(VISITOR_SESSION_ID_KEY, sessionId);
    }
    return sessionId;
  } catch (error) {
    console.warn('Failed to access sessionStorage for session ID:', error);
    return generateUUID();
  }
}

// Get cached location or fetch new one
async function getLocation(): Promise<VisitorLocation | null> {
  if (typeof window === 'undefined') return null;

  try {
    // Check cache first
    const cached = localStorage.getItem(LOCATION_CACHE_KEY);
    if (cached) {
      const { location, timestamp } = JSON.parse(cached);
      const now = Date.now();
      if (now - timestamp < LOCATION_CACHE_EXPIRY) {
        return location;
      }
    }

    // Fetch location from free geolocation service
    try {
      const response = await fetch('https://ipapi.co/json/', {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const location: VisitorLocation = {
          country: data.country_code || null,
          country_name: data.country_name || null,
          city: data.city || null,
          region: data.region || null,
          timezone: data.timezone || null,
        };

        // Cache the location
        localStorage.setItem(
          LOCATION_CACHE_KEY,
          JSON.stringify({
            location,
            timestamp: Date.now(),
          })
        );

        return location;
      }
    } catch (fetchError) {
      console.warn('Failed to fetch location from ipapi.co:', fetchError);
    }

    // Fallback: try to get timezone from browser
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return {
        country: null,
        country_name: null,
        city: null,
        region: null,
        timezone: timezone || null,
      };
    } catch (timezoneError) {
      console.warn('Failed to get timezone:', timezoneError);
    }

    return null;
  } catch (error) {
    console.warn('Location fetch failed:', error);
    return null;
  }
}

// Identify tool from route path
function identifyTool(routePath: string): string {
  // Check exact matches first
  if (TOOL_ROUTE_MAP[routePath]) {
    return TOOL_ROUTE_MAP[routePath];
  }

  // Check for sub-routes
  for (const [route, toolId] of Object.entries(TOOL_ROUTE_MAP)) {
    if (routePath.startsWith(route) && route !== '/') {
      return toolId;
    }
  }

  // Default fallback
  return 'unknown';
}

// Track visit with debouncing
let lastTrackedPath: string | null = null;
let lastTrackedTime: number = 0;
const TRACK_DEBOUNCE_MS = 2000; // Don't track same route within 2 seconds

export function useVisitorTracking() {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuth();
  const locationRef = useRef<VisitorLocation | null>(null);
  const publicIdRef = useRef<string>('');
  const sessionIdRef = useRef<string>('');
  const isInitializedRef = useRef(false);

  // Initialize tracking data
  useEffect(() => {
    if (typeof window === 'undefined') return;

    publicIdRef.current = getOrCreatePublicId();
    sessionIdRef.current = getOrCreateSessionId();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Visitor tracking initialized:', {
        public_id: publicIdRef.current.substring(0, 8) + '...',
        session_id: sessionIdRef.current.substring(0, 8) + '...',
      });
    }

    // Fetch location asynchronously (don't block)
    getLocation()
      .then((location) => {
        locationRef.current = location;
        if (process.env.NODE_ENV === 'development') {
          console.log('🌍 Location fetched:', location);
        }
      })
      .catch((error) => {
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Location initialization failed:', error);
        }
      });

    isInitializedRef.current = true;
  }, []);

  // Track visit function
  const trackVisit = useCallback(
    async (routePath: string, referrer: string | null = null) => {
      // Skip if not initialized
      if (!isInitializedRef.current) return;

      // Debounce: skip if same path tracked recently
      const now = Date.now();
      if (
        lastTrackedPath === routePath &&
        now - lastTrackedTime < TRACK_DEBOUNCE_MS
      ) {
        return;
      }

      lastTrackedPath = routePath;
      lastTrackedTime = now;

      const toolId = identifyTool(routePath);
      
      // Get user ID - ensure it's a number for the backend
      let userId: number | null = null;
      if (isAuthenticated && user?.id) {
        if (typeof user.id === 'string') {
          const parsed = parseInt(user.id, 10);
          userId = isNaN(parsed) ? null : parsed;
        } else if (typeof user.id === 'number') {
          userId = user.id;
        }
      }

      const trackingData: VisitorTrackingRequest = {
        tool_id: toolId,
        route_path: routePath,
        user_id: userId,
        public_id: publicIdRef.current,
        session_id: sessionIdRef.current,
        timestamp: new Date().toISOString(),
        referrer: referrer,
        location: locationRef.current,
      };

      // Send tracking request (fire and forget - don't block UI)
      // Use setTimeout to avoid blocking the main thread
      setTimeout(async () => {
        try {
          if (process.env.NODE_ENV === 'development') {
            console.log('📊 Tracking visit:', {
              tool_id: toolId,
              route_path: routePath,
              public_id: publicIdRef.current.substring(0, 8) + '...',
              session_id: sessionIdRef.current.substring(0, 8) + '...',
              has_location: !!locationRef.current,
              is_authenticated: isAuthenticated,
              user_id: userId,
              user_id_type: typeof userId,
              raw_user_id: user?.id,
              raw_user_id_type: typeof user?.id,
            });
          }
          
          const result = await apiClient.trackVisit(trackingData);
          
          if (result && process.env.NODE_ENV === 'development') {
            console.log('✅ Visit tracked successfully');
          } else if (!result && process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Visit tracking returned null (endpoint may not exist yet)');
          }
        } catch (error) {
          // This should rarely happen now since trackVisit handles errors internally
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ Visitor tracking error (non-critical):', error);
          }
        }
      }, 0);
    },
    [user, isAuthenticated]
  );

  // Track on route change
  useEffect(() => {
    if (!pathname || !isInitializedRef.current) return;

    // Get referrer from document if available
    const referrer =
      typeof document !== 'undefined' && document.referrer
        ? new URL(document.referrer).pathname
        : null;

    // Small delay to ensure route is fully loaded
    const timeoutId = setTimeout(() => {
      trackVisit(pathname, referrer);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [pathname, trackVisit]);

  // Track page unload (optional - for exit tracking)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeUnload = () => {
      if (pathname && isInitializedRef.current) {
        // Use sendBeacon for reliable delivery on page unload
        // Get user ID - ensure it's a number for the backend
        let userId: number | null = null;
        if (isAuthenticated && user?.id) {
          if (typeof user.id === 'string') {
            const parsed = parseInt(user.id, 10);
            userId = isNaN(parsed) ? null : parsed;
          } else if (typeof user.id === 'number') {
            userId = user.id;
          }
        }
        
        const trackingData: VisitorTrackingRequest = {
          tool_id: identifyTool(pathname),
          route_path: pathname,
          user_id: userId,
          public_id: publicIdRef.current,
          session_id: sessionIdRef.current,
          timestamp: new Date().toISOString(),
          referrer: null,
          location: locationRef.current,
        };

        // Try to send with sendBeacon (more reliable on unload)
        try {
          const blob = new Blob([JSON.stringify(trackingData)], {
            type: 'application/json',
          });
          navigator.sendBeacon(
            `${API_BASE_URL}/visitor-tracking`,
            blob
          );
        } catch (error) {
          // Fallback: try regular fetch with keepalive
          fetch(`${API_BASE_URL}/visitor-tracking`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(trackingData),
            keepalive: true,
          }).catch(() => {
            // Ignore errors on unload
          });
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pathname, user, isAuthenticated]);
}

