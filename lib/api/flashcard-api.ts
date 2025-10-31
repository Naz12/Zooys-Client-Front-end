"use client";

import { BaseApiClient } from './base-api-client';
import type { 
  FlashcardGenerateRequest,
  FlashcardGenerateResponse,
  FlashcardSetsResponse,
  FlashcardSetResponse,
  FlashcardUpdateRequest,
  FlashcardSet
} from '../types/api';

export class FlashcardApiClient extends BaseApiClient {
  // Generate flashcards
  async generateFlashcards(request: FlashcardGenerateRequest): Promise<FlashcardGenerateResponse> {
    const formData = new FormData();
    formData.append('input', request.input);
    formData.append('input_type', request.input_type || 'text');
    formData.append('count', (request.count || 10).toString());
    formData.append('difficulty', request.difficulty || 'intermediate');
    formData.append('style', request.style || 'mixed');
    
    if (request.file) {
      formData.append('file', request.file);
    }

    return this.post<FlashcardGenerateResponse>('/flashcards/generate', formData);
  }

  // Get all flashcard sets
  async getFlashcardSets(page: number = 1, limit: number = 10): Promise<FlashcardSetsResponse> {
    return this.get<FlashcardSetsResponse>(`/flashcards?page=${page}&limit=${limit}`);
  }

  // Get public flashcard sets
  async getPublicFlashcardSets(page: number = 1, limit: number = 10): Promise<FlashcardSetsResponse> {
    return this.get<FlashcardSetsResponse>(`/flashcards/public?page=${page}&limit=${limit}`);
  }

  // Get flashcard set by ID
  async getFlashcardSet(setId: number): Promise<FlashcardSetResponse> {
    return this.get<FlashcardSetResponse>(`/flashcards/${setId}`);
  }

  // Update flashcard set
  async updateFlashcardSet(setId: number, request: FlashcardUpdateRequest): Promise<FlashcardSetResponse> {
    return this.put<FlashcardSetResponse>(`/flashcards/${setId}`, request);
  }

  // Delete flashcard set
  async deleteFlashcardSet(setId: number): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/flashcards/${setId}`);
  }
}

// Create flashcard API client instance
export const flashcardApi = new FlashcardApiClient();



