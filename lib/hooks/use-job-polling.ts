"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PDFJobStatus } from '../types/api';

export interface UseJobPollingOptions {
  /** Polling interval in milliseconds (default: 3000) */
  interval?: number;
  /** Maximum number of polling attempts (default: 60) */
  maxAttempts?: number;
  /** Enable automatic polling on mount (default: true) */
  autoStart?: boolean;
}

export interface UseJobPollingReturn {
  /** Current job status */
  status: PDFJobStatus | null;
  /** Progress percentage (0-100) */
  progress: number;
  /** Whether polling is active */
  isPolling: boolean;
  /** Error message if any */
  error: string | null;
  /** Start polling manually */
  startPolling: () => void;
  /** Stop polling manually */
  stopPolling: () => void;
  /** Reset polling state */
  reset: () => void;
}

/**
 * Hook for polling PDF operation job status
 * Automatically polls status endpoint and returns progress
 */
export function useJobPolling(
  getStatusFn: (job_id: string) => Promise<PDFJobStatus>,
  job_id: string | null,
  options: UseJobPollingOptions = {}
): UseJobPollingReturn {
  const {
    interval = 3000,
    maxAttempts = 60,
    autoStart = true,
  } = options;

  const [status, setStatus] = useState<PDFJobStatus | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const attemptCountRef = useRef<number>(0);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const isPollingRef = useRef<boolean>(false);

  // Poll status
  const pollStatus = useCallback(async () => {
    if (!job_id || !isMountedRef.current || !isPollingRef.current) return;

    try {
      const statusData = await getStatusFn(job_id);
      
      if (!isMountedRef.current) return;

      console.log('=== POLLING STATUS UPDATE ===');
      console.log('Status Data:', statusData);
      console.log('Status:', statusData.status);
      console.log('Progress:', statusData.progress);
      console.log('Error:', statusData.error);
      console.log('Stage:', statusData.stage);
      console.log('================================');
      
      setStatus(statusData);
      setProgress(statusData.progress || 0);
      setError(null);

      // Check if job is complete or failed - STOP POLLING
      if (statusData.status === 'completed' || statusData.status === 'failed') {
        console.log('=== JOB FINISHED - STOPPING POLLING ===');
        console.log('Final Status:', statusData.status);
        console.log('========================================');
        isPollingRef.current = false;
        setIsPolling(false);
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
          intervalIdRef.current = null;
        }

        if (statusData.status === 'failed') {
          setError(statusData.error || 'Job failed');
        }
        // Return early to prevent further polling
        return;
      }

      // Increment attempt count
      attemptCountRef.current += 1;

      // Check max attempts
      if (attemptCountRef.current >= maxAttempts) {
        isPollingRef.current = false;
        setIsPolling(false);
        setError('Polling timeout: Maximum attempts reached');
        if (intervalIdRef.current) {
          clearInterval(intervalIdRef.current);
          intervalIdRef.current = null;
        }
        return;
      }
    } catch (err: any) {
      if (!isMountedRef.current) return;

      isPollingRef.current = false;
      setIsPolling(false);
      setError(err.message || 'Failed to get job status');
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    }
  }, [job_id, getStatusFn, maxAttempts]);

  // Start polling
  const startPolling = useCallback(() => {
    if (!job_id || isPollingRef.current) return;

    isPollingRef.current = true;
    setIsPolling(true);
    setError(null);
    attemptCountRef.current = 0;

    // Clear any existing interval first
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    // Poll immediately
    pollStatus().then(() => {
      // Only set up interval if still polling after initial check
      if (isMountedRef.current && isPollingRef.current && !intervalIdRef.current) {
        intervalIdRef.current = setInterval(() => {
          // Check if still polling before each poll using ref
          if (isPollingRef.current && isMountedRef.current) {
            pollStatus();
          } else {
            if (intervalIdRef.current) {
              clearInterval(intervalIdRef.current);
              intervalIdRef.current = null;
            }
          }
        }, interval);
      }
    });
  }, [job_id, pollStatus, interval]);

  // Stop polling
  const stopPolling = useCallback(() => {
    isPollingRef.current = false;
    setIsPolling(false);
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  }, []);

  // Reset state
  const reset = useCallback(() => {
    stopPolling();
    setStatus(null);
    setProgress(0);
    setError(null);
    attemptCountRef.current = 0;
    isPollingRef.current = false;
  }, [stopPolling]);

  // Auto-start polling when job_id is provided (only if not already completed/failed)
  useEffect(() => {
    if (autoStart && job_id && !isPollingRef.current) {
      // Check if status is already completed or failed - don't restart polling
      if (status?.status === 'completed' || status?.status === 'failed') {
        return;
      }
      startPolling();
    }
  }, [autoStart, job_id, startPolling, status?.status]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, []);

  return {
    status,
    progress,
    isPolling,
    error,
    startPolling,
    stopPolling,
    reset,
  };
}

