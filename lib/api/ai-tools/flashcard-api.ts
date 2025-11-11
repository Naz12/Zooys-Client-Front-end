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

export class FlashcardApiClient extends BaseApiClient {
  // Unified generate method that routes to appropriate method based on input_type
  async generate(request: {
    input?: string;
    file_id?: string | number;
    file?: File;
    input_type: 'text' | 'file';
    count?: number;
    difficulty?: string;
    style?: string;
  }): Promise<AsyncSummarizeResponse> {
    // If file is provided, we need to upload it first or use file_id
    // For now, just send the request as-is (the backend should handle file uploads)
    const requestData: any = {
      input_type: request.input_type,
      count: request.count,
      difficulty: request.difficulty,
      style: request.style,
    };

    if (request.input_type === 'text' && request.input) {
      requestData.input = request.input;
    } else if (request.input_type === 'file') {
      if (request.file_id) {
        requestData.file_id = request.file_id;
      } else if (request.input) {
        // Fallback: use input as description if file_id not provided
        requestData.input = request.input;
      }
    }

    return this.post<AsyncSummarizeResponse>('/flashcards/generate', requestData);
  }

  // Generate flashcards (text)
  async generateFlashcardsText(request: {
    input: string;
    input_type: 'text';
    count?: number;
    difficulty?: string;
    style?: string;
  }): Promise<AsyncSummarizeResponse> {
    return this.post<AsyncSummarizeResponse>('/flashcards/generate', request);
  }

  // Generate flashcards (file)
  async generateFlashcardsFile(request: {
    file_id: string;
    input_type: 'file';
    count?: number;
    difficulty?: string;
    style?: string;
  }): Promise<AsyncSummarizeResponse> {
    return this.post<AsyncSummarizeResponse>('/flashcards/generate', request);
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

  // Universal status check
  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    return this.get<JobStatusResponse>(`/status?job_id=${jobId}`);
  }

  // Universal result retrieval
  async getJobResult(jobId: string): Promise<JobResultResponse> {
    return this.get<JobResultResponse>(`/result?job_id=${jobId}`);
  }

  // Tool-specific status checks
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
    maxAttempts: number = 60, 
    interval: number = 2000
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const status = await this.getJobStatus(jobId);
        
        if (status.status === 'completed') {
          const result = await this.getJobResult(jobId);
          return { success: true, result };
        } else if (status.status === 'failed') {
          return { success: false, error: status.error || 'Job failed' };
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
