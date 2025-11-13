"use client";

import { BaseApiClient } from '../base-api-client';
import type { 
  FlashcardGenerateRequest,
  FlashcardGenerateResponse,
  FlashcardSetsResponse,
  FlashcardSetResponse,
  FlashcardUpdateRequest,
  FlashcardSet,
  AsyncSummarizeResponse,
  JobStatusResponse,
  JobResultResponse
} from '../../types/api';

export interface FlashcardGenerateRequest {
  input?: string;
  file_id?: string | number;
  input_type: 'text' | 'file' | 'url' | 'youtube';
  count?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  style?: 'definition' | 'application' | 'analysis' | 'comparison' | 'mixed';
  model?: string;
}

export interface FlashcardGenerateResponse extends AsyncSummarizeResponse {
  success: boolean;
  message?: string;
  job_id: string;
  status: string;
  poll_url?: string;
  result_url?: string;
  data?: {
    job_id: string;
    status: string;
    flashcards: any[];
  };
}

export class FlashcardApiClient extends BaseApiClient {
  // Unified generate method that routes to appropriate method based on input_type
  async generate(request: FlashcardGenerateRequest): Promise<FlashcardGenerateResponse> {
    const requestData: any = {
      input_type: request.input_type,
      count: request.count,
      difficulty: request.difficulty,
      style: request.style,
      ...(request.model && { model: request.model }),
    };

    // Handle different input types
    if (request.input_type === 'file') {
      if (request.file_id) {
        requestData.file_id = request.file_id;
      } else if (request.input) {
        // Fallback: use input as description if file_id not provided
        requestData.input = request.input;
      }
    } else if (request.input) {
      // For text, url, or youtube
      requestData.input = request.input;
    }

    return this.post<FlashcardGenerateResponse>('/flashcards/generate', requestData);
  }

  // Generate flashcards (text)
  async generateFlashcardsText(request: {
    input: string;
    input_type: 'text';
    count?: number;
    difficulty?: string;
    style?: string;
  }): Promise<FlashcardGenerateResponse> {
    return this.post<FlashcardGenerateResponse>('/flashcards/generate', request);
  }

  // Generate flashcards (file)
  async generateFlashcardsFile(request: {
    file_id: string;
    input_type: 'file';
    count?: number;
    difficulty?: string;
    style?: string;
  }): Promise<FlashcardGenerateResponse> {
    return this.post<FlashcardGenerateResponse>('/flashcards/generate', request);
  }

  // Generate flashcards (URL)
  async generateFlashcardsUrl(request: {
    input: string;
    input_type: 'url';
    count?: number;
    difficulty?: string;
    style?: string;
  }): Promise<FlashcardGenerateResponse> {
    return this.post<FlashcardGenerateResponse>('/flashcards/generate', request);
  }

  // Generate flashcards (YouTube)
  async generateFlashcardsYouTube(request: {
    input: string;
    input_type: 'youtube';
    count?: number;
    difficulty?: string;
    style?: string;
  }): Promise<FlashcardGenerateResponse> {
    return this.post<FlashcardGenerateResponse>('/flashcards/generate', request);
  }

  // Get all flashcard sets
  async getFlashcardSets(): Promise<FlashcardSetsResponse> {
    return this.get<FlashcardSetsResponse>('/flashcards');
  }

  // Get flashcard sets with pagination and search (alias for compatibility)
  async getSets(page: number = 1, perPage: number = 15, search?: string): Promise<FlashcardSetsResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      ...(search && search.trim().length > 0 && { search: search.trim() })
    });
    return this.get<FlashcardSetsResponse>(`/flashcards?${params}`);
  }

  // Get public flashcard sets
  async getPublicFlashcardSets(): Promise<FlashcardSetsResponse> {
    return this.get<FlashcardSetsResponse>('/flashcards/public');
  }

  // Get flashcard set by ID
  async getFlashcardSet(setId: string): Promise<FlashcardSetResponse> {
    return this.get<FlashcardSetResponse>(`/flashcards/${setId}`);
  }

  // Update flashcard set
  async updateFlashcardSet(setId: string, request: FlashcardUpdateRequest): Promise<FlashcardSetResponse> {
    return this.put<FlashcardSetResponse>(`/flashcards/${setId}`, request);
  }

  // Delete flashcard set
  async deleteFlashcardSet(setId: string): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/flashcards/${setId}`);
  }

  // Get job status by input type
  async getJobStatus(jobId: string, inputType: 'text' | 'file' | 'url' | 'youtube' = 'text'): Promise<JobStatusResponse> {
    // Text, URL, and YouTube all use the 'text' endpoint
    const endpointType = (inputType === 'url' || inputType === 'youtube') ? 'text' : inputType;
    return this.get<JobStatusResponse>(`/status/flashcards/${endpointType}?job_id=${jobId}`);
  }

  // Get job result by input type
  async getJobResult(jobId: string, inputType: 'text' | 'file' | 'url' | 'youtube' = 'text'): Promise<JobResultResponse> {
    // Text, URL, and YouTube all use the 'text' endpoint
    const endpointType = (inputType === 'url' || inputType === 'youtube') ? 'text' : inputType;
    return this.get<JobResultResponse>(`/result/flashcards/${endpointType}?job_id=${jobId}`);
  }

  // Get job status by URL (from poll_url in response)
  async getJobStatusByUrl(pollUrl: string): Promise<JobStatusResponse> {
    try {
      const url = new URL(pollUrl);
      let endpoint = url.pathname.replace(/^\/api/, '');
      
      if (url.search) {
        endpoint += url.search;
      } else {
        // If no query params, extract from path
        const pathParts = endpoint.split('/').filter(p => p);
        if (pathParts.length >= 3 && pathParts[0] === 'status' && pathParts[1] === 'flashcards') {
          const endpointType = pathParts[2];
          // Try to extract job_id from path if it exists
          if (pathParts.length >= 4) {
            const jobId = pathParts[3];
            endpoint = `/status/flashcards/${endpointType}?job_id=${jobId}`;
          }
        }
      }
      
      return this.get<JobStatusResponse>(endpoint);
    } catch (error) {
      const endpoint = pollUrl.replace(/^http(s)?:\/\/[^/]+/, '').replace(/^\/api/, '');
      return this.get<JobStatusResponse>(endpoint);
    }
  }

  // Get job result by URL (from result_url in response)
  async getJobResultByUrl(resultUrl: string): Promise<JobResultResponse> {
    try {
      const url = new URL(resultUrl);
      let endpoint = url.pathname.replace(/^\/api/, '');
      
      if (url.search) {
        endpoint += url.search;
      } else {
        // If no query params, extract from path
        const pathParts = endpoint.split('/').filter(p => p);
        if (pathParts.length >= 3 && pathParts[0] === 'result' && pathParts[1] === 'flashcards') {
          const endpointType = pathParts[2];
          // Try to extract job_id from path if it exists
          if (pathParts.length >= 4) {
            const jobId = pathParts[3];
            endpoint = `/result/flashcards/${endpointType}?job_id=${jobId}`;
          }
        }
      }
      
      return this.get<JobResultResponse>(endpoint);
    } catch (error) {
      const endpoint = resultUrl.replace(/^http(s)?:\/\/[^/]+/, '').replace(/^\/api/, '');
      return this.get<JobResultResponse>(endpoint);
    }
  }

  // Tool-specific status checks (for backward compatibility)
  async getTextFlashcardsStatus(jobId: string): Promise<JobStatusResponse> {
    return this.get<JobStatusResponse>(`/status/flashcards/text?job_id=${jobId}`);
  }

  async getTextFlashcardsResult(jobId: string): Promise<JobResultResponse> {
    return this.get<JobResultResponse>(`/result/flashcards/text?job_id=${jobId}`);
  }

  async getFileFlashcardsStatus(jobId: string): Promise<JobStatusResponse> {
    return this.get<JobStatusResponse>(`/status/flashcards/file?job_id=${jobId}`);
  }

  async getFileFlashcardsResult(jobId: string): Promise<JobResultResponse> {
    return this.get<JobResultResponse>(`/result/flashcards/file?job_id=${jobId}`);
  }

  // Poll job completion
  async pollJobCompletion(
    jobId: string,
    inputType: 'text' | 'file' | 'url' | 'youtube' = 'text',
    pollUrl?: string,
    resultUrl?: string,
    maxAttempts: number = 90, 
    interval: number = 2500
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        let status: JobStatusResponse;
        
        if (pollUrl) {
          status = await this.getJobStatusByUrl(pollUrl);
        } else {
          status = await this.getJobStatus(jobId, inputType);
        }
        
        // Handle both wrapped and direct response structures
        const statusData = (status as any).data || status;
        const currentStatus = statusData.status || status.status;
        
        if (currentStatus === 'completed') {
          let result: JobResultResponse;
          if (resultUrl) {
            result = await this.getJobResultByUrl(resultUrl);
          } else {
            result = await this.getJobResult(jobId, inputType);
          }
          return { success: true, result };
        } else if (currentStatus === 'failed') {
          const errorMessage = statusData.error || status.error || 'Job failed';
          return { success: false, error: errorMessage };
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error) {
        console.error(`Poll attempt ${i + 1} failed:`, error);
        if (i === maxAttempts - 1) {
          return { success: false, error: 'Polling failed' };
        }
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    return { success: false, error: 'Job timeout' };
  }
}

// Create flashcard API client instance
export const flashcardApi = new FlashcardApiClient();
