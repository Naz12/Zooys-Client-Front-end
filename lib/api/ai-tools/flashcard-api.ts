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
