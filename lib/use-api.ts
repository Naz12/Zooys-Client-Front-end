"use client";

import { useState, useCallback } from 'react';
import { apiClient } from './api-client';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<T>
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await apiFunction(...args);
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState({ data: null, loading: false, error: errorMessage });
      return null;
    }
  }, [apiFunction]);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Specific hooks for common API operations
export function useAuthApi() {
  const login = useApi(apiClient.post.bind(apiClient, '/login'));
  const register = useApi(apiClient.post.bind(apiClient, '/register'));
  const logout = useApi(apiClient.post.bind(apiClient, '/logout'));

  return { login, register, logout };
}

export function useSubscriptionApi() {
  const getPlans = useApi(apiClient.get.bind(apiClient, '/plans'));
  const getCurrentSubscription = useApi(apiClient.get.bind(apiClient, '/subscription'));
  const getSubscriptionHistory = useApi(apiClient.get.bind(apiClient, '/subscription/history'));

  return { getPlans, getCurrentSubscription, getSubscriptionHistory };
}

export function useAiToolsApi() {
  const summarizeYouTube = useApi(apiClient.post.bind(apiClient, '/youtube/summarize'));
  const summarizePDF = useApi(apiClient.post.bind(apiClient, '/pdf/summarize'));
  const generateContent = useApi(apiClient.post.bind(apiClient, '/writer/run'));
  const solveMath = useApi(apiClient.post.bind(apiClient, '/math/solve'));
  const generateFlashcards = useApi(apiClient.post.bind(apiClient, '/flashcards/generate'));
  const generateDiagram = useApi(apiClient.post.bind(apiClient, '/diagram/generate'));

  return {
    summarizeYouTube,
    summarizePDF,
    generateContent,
    solveMath,
    generateFlashcards,
    generateDiagram,
  };
}

// Hook for file uploads
export function useFileUpload<T = any>() {
  const [uploadState, setUploadState] = useState<{
    uploading: boolean;
    progress: number;
    error: string | null;
    data: T | null;
  }>({
    uploading: false,
    progress: 0,
    error: null,
    data: null,
  });

  const uploadFile = useCallback(async (
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>
  ): Promise<T | null> => {
    setUploadState({
      uploading: true,
      progress: 0,
      error: null,
      data: null,
    });

    try {
      const result = await apiClient.uploadFile<T>(endpoint, file, additionalData);
      setUploadState({
        uploading: false,
        progress: 100,
        error: null,
        data: result,
      });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadState({
        uploading: false,
        progress: 0,
        error: errorMessage,
        data: null,
      });
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setUploadState({
      uploading: false,
      progress: 0,
      error: null,
      data: null,
    });
  }, []);

  return {
    ...uploadState,
    uploadFile,
    reset,
  };
}
