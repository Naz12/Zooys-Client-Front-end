"use client";

import { useState, useCallback, useRef } from 'react';
import { summarizerApi } from '@/lib/api';
import type { 
  AsyncSummarizeRequest, 
  JobStatusResponse, 
  JobResultData,
  BundleData 
} from '@/lib/types/api';

export interface AsyncYouTubeState {
  status: 'idle' | 'starting' | 'processing' | 'completed' | 'failed';
  progress: number;
  stage: string;
  logs: string[];
  result: JobResultData | null;
  error: string | null;
  retryCount: number;
}

export interface AsyncYouTubeActions {
  startJob: (videoUrl: string, language?: string, mode?: 'detailed' | 'brief' | 'bundle') => Promise<void>;
  cancelJob: () => void;
  reset: () => void;
}

export interface UseAsyncYouTubeReturn extends AsyncYouTubeState, AsyncYouTubeActions {}

const POLL_INTERVAL = 2000; // 2 seconds - faster polling for better responsiveness
const MAX_RETRIES = 5;
const MAX_POLL_ATTEMPTS = 100; // 5 minutes max

export const useAsyncYouTubeSummarizer = (): UseAsyncYouTubeReturn => {
  const [state, setState] = useState<AsyncYouTubeState>({
    status: 'idle',
    progress: 0,
    stage: '',
    logs: [],
    result: null,
    error: null,
    retryCount: 0,
  });

  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentJobIdRef = useRef<string | null>(null);
  const pollAttemptsRef = useRef<number>(0);

  const reset = useCallback(() => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    
    setState({
      status: 'idle',
      progress: 0,
      stage: '',
      logs: [],
      result: null,
      error: null,
      retryCount: 0,
    });
    
    currentJobIdRef.current = null;
    pollAttemptsRef.current = 0;
  }, []);

  const cancelJob = useCallback(() => {
    if (pollingTimeoutRef.current) {
      clearTimeout(pollingTimeoutRef.current);
      pollingTimeoutRef.current = null;
    }
    
    setState(prev => ({
      ...prev,
      status: 'idle',
      stage: 'Cancelled',
    }));
    
    currentJobIdRef.current = null;
    pollAttemptsRef.current = 0;
  }, []);

  const pollJobStatus = useCallback(async (
    jobId: string, 
    pollUrl: string, 
    resultUrl: string,
    currentRetry: number = 0
  ): Promise<void> => {
    try {
      // Check if we've exceeded max poll attempts
      if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
        setState(prev => ({
          ...prev,
          status: 'failed',
          error: 'Job timeout - exceeded maximum polling attempts',
        }));
        return;
      }

      pollAttemptsRef.current++;

      const statusResponse = await summarizerApi.getJobStatus(pollUrl);
      console.log('Job status response:', statusResponse);

      // Reset retry count on successful request
      setState(prev => ({ ...prev, retryCount: 0 }));

      // The backend returns job data directly or nested under 'data' property
      // Handle both cases: direct response or nested under 'data'
      const statusData = statusResponse.data || statusResponse;
      console.log('Status data:', statusData);

      // Defensive programming - ensure statusData exists
      if (!statusData) {
        console.error('No status data received:', statusResponse);
        throw new Error('No status data received from server');
      }

      // Update progress and stage
      setState(prev => ({
        ...prev,
        progress: statusData.progress || 0,
        stage: statusData.stage || statusData.status || 'Processing...',
      }));

      // Update logs (handle both array and undefined cases)
      const rawLogs = statusData.logs || [];
      const formattedLogs = Array.isArray(rawLogs) ? rawLogs.map((log: any) => {
        if (typeof log === 'string') {
          return log;
        } else if (log && typeof log === 'object' && log.message) {
          return `[${log.level || 'info'}] ${log.message}`;
        }
        return JSON.stringify(log);
      }) : [];

      setState(prev => ({
        ...prev,
        logs: formattedLogs,
      }));

      if (statusData.status === 'completed') {
        // Get the final result
        const resultResponse = await summarizerApi.getJobResult(resultUrl);
        console.log('Job result response:', resultResponse);

        // The backend returns result data directly or nested under 'data' property
        // Handle both cases: direct response or nested under 'data'
        const resultData = resultResponse.data || resultResponse;

        if (!resultData) {
          console.error('No result data received:', resultResponse);
          throw new Error('No result data received from server');
        }

        // Check if the result contains an error
        if (resultData.success === false && resultData.error) {
          console.error('Backend error in result:', resultData.error);
          throw new Error(`Backend processing error: ${resultData.error}`);
        }

        setState(prev => ({
          ...prev,
          status: 'completed',
          result: resultData,
          stage: 'Completed',
        }));

        // Clear polling
        if (pollingTimeoutRef.current) {
          clearTimeout(pollingTimeoutRef.current);
          pollingTimeoutRef.current = null;
        }

      } else if (statusData.status === 'failed') {
        setState(prev => ({
          ...prev,
          status: 'failed',
          error: statusData.error || 'Job failed during processing',
          stage: 'Failed',
        }));

        // Clear polling
        if (pollingTimeoutRef.current) {
          clearTimeout(pollingTimeoutRef.current);
          pollingTimeoutRef.current = null;
        }

      } else {
        // Continue polling with exponential backoff and jitter
        const baseDelay = POLL_INTERVAL;
        const jitter = Math.random() * 1000; // 0-1 second jitter
        const backoffMultiplier = Math.min(1.5, 1 + (pollAttemptsRef.current * 0.1)); // Gradual backoff
        const delay = Math.min(baseDelay * backoffMultiplier + jitter, 10000); // Max 10 seconds

        pollingTimeoutRef.current = setTimeout(() => {
          pollJobStatus(jobId, pollUrl, resultUrl, 0);
        }, delay);
      }

    } catch (error) {
      console.error('Polling error:', error);

      // Handle network errors with retry logic
      if (error instanceof Error && (
        error.message.includes('Failed to fetch') || 
        error.message.includes('Network error')
      )) {
        if (currentRetry < MAX_RETRIES) {
          console.log(`Retrying polling request (${currentRetry + 1}/${MAX_RETRIES})...`);
          
          setState(prev => ({
            ...prev,
            retryCount: currentRetry + 1,
            stage: `Connection issue - Retrying... (${currentRetry + 1}/${MAX_RETRIES})`,
          }));

          // Exponential backoff: 2s, 4s, 8s, 16s, 32s
          const retryDelay = Math.pow(2, currentRetry) * 2000;
          pollingTimeoutRef.current = setTimeout(() => {
            pollJobStatus(jobId, pollUrl, resultUrl, currentRetry + 1);
          }, retryDelay);
          return;
        } else {
          setState(prev => ({
            ...prev,
            status: 'failed',
            error: 'Lost connection to the server. The job may still be processing in the background.',
            stage: 'Connection Failed',
          }));
        }
      } else {
        setState(prev => ({
          ...prev,
          status: 'failed',
          error: `Failed to check job status: ${error instanceof Error ? error.message : 'Unknown error'}`,
          stage: 'Error',
        }));
      }

      // Clear polling after max retries or non-network errors
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
    }
  }, []);

  const startJob = useCallback(async (
    videoUrl: string, 
    language: string = 'en', 
    mode: 'detailed' | 'brief' | 'bundle' = 'bundle'
  ): Promise<void> => {
    try {
      setState(prev => ({
        ...prev,
        status: 'starting',
        progress: 0,
        stage: 'Starting job...',
        logs: [],
        error: null,
        result: null,
      }));

      const request: AsyncSummarizeRequest = {
        content_type: 'link',
        source: {
          type: 'url',
          data: videoUrl,
        },
        options: {
          mode,
          language,
          format: 'bundle',
          focus: 'summary',
        },
      };

      console.log('Starting async YouTube summarization:', request);

      // Use specialized YouTube endpoint
      const asyncResponse = await summarizerApi.summarizeYouTube({
        url: videoUrl,
        options: {
          language: language || 'en',
          format: mode || 'bundle',
          focus: 'summary'
        }
      );
      console.log('Async job started:', asyncResponse);

      if (asyncResponse.job_id) {
        currentJobIdRef.current = asyncResponse.job_id;
        pollAttemptsRef.current = 0;

        setState(prev => ({
          ...prev,
          status: 'processing',
          stage: 'Job started successfully',
        }));

        // Start polling for job completion
        await pollJobStatus(
          asyncResponse.job_id,
          asyncResponse.poll_url,
          asyncResponse.result_url
        );
      } else {
        setState(prev => ({
          ...prev,
          status: 'failed',
          error: 'Failed to start async job. Please try again.',
        }));
      }

    } catch (error) {
      console.error('Start job error:', error);

      let errorMessage = 'Failed to start YouTube summarization. Please check your connection and try again.';

      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Cannot connect to the backend server. Please ensure the server is running on http://localhost:8000';
        } else if (error.message.includes('CORS') || error.message.includes('blocked by CORS policy')) {
          errorMessage = 'CORS configuration error. The backend needs to allow requests from http://localhost:3000';
        } else {
          errorMessage = error.message;
        }
      }

      setState(prev => ({
        ...prev,
        status: 'failed',
        error: errorMessage,
        stage: 'Failed to Start',
      }));
    }
  }, [pollJobStatus]);

  return {
    ...state,
    startJob,
    cancelJob,
    reset,
  };
};
