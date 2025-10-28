"use client";

import { BaseApiClient } from './base-api-client';
import type { 
  ChatRequest,
  ChatResponse,
  ChatHistoryResponse,
  ChatHistoryItem
} from '../types/api';

export class ChatApiClient extends BaseApiClient {
  // Send chat message
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    return this.post<ChatResponse>('/chat', request);
  }

  // Get chat history
  async getChatHistory(page: number = 1, limit: number = 20): Promise<ChatHistoryResponse> {
    return this.get<ChatHistoryResponse>(`/chat/history?page=${page}&limit=${limit}`);
  }

  // Get chat session
  async getChatSession(sessionId: number): Promise<ChatHistoryItem> {
    return this.get<ChatHistoryItem>(`/chat/sessions/${sessionId}`);
  }

  // Create new chat session
  async createChatSession(): Promise<{ session_id: number; message: string }> {
    return this.post<{ session_id: number; message: string }>('/chat/sessions');
  }

  // Delete chat session
  async deleteChatSession(sessionId: number): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/chat/sessions/${sessionId}`);
  }
}

// Create chat API client instance
export const chatApi = new ChatApiClient();

