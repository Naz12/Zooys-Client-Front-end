"use client";

import { BaseApiClient } from '../base-api-client';
import type { 
  ChatRequest,
  ChatResponse,
  ChatHistoryResponse,
  ChatHistoryItem
} from '../../types/api';

export class ChatApiClient extends BaseApiClient {
  // General chat
  async sendMessage(request: { message: string; session_id?: string }): Promise<ChatResponse> {
    return this.post<ChatResponse>('/chat', request);
  }

  // Create and chat
  async createAndChat(request: { message: string; context?: string }): Promise<ChatResponse> {
    return this.post<ChatResponse>('/chat/create-and-chat', request);
  }

  // Get chat history
  async getChatHistory(): Promise<ChatHistoryResponse> {
    return this.get<ChatHistoryResponse>('/chat/history');
  }

  // Chat sessions
  async getChatSessions(): Promise<ChatHistoryResponse> {
    return this.get<ChatHistoryResponse>('/chat/sessions');
  }

  async createChatSession(request: { title?: string; context?: string }): Promise<{ session_id: string; message: string }> {
    return this.post<{ session_id: string; message: string }>('/chat/sessions', request);
  }

  async getChatSession(sessionId: string): Promise<ChatHistoryItem> {
    return this.get<ChatHistoryItem>(`/chat/sessions/${sessionId}`);
  }

  async updateChatSession(sessionId: string, request: { title?: string; context?: string }): Promise<ChatHistoryItem> {
    return this.put<ChatHistoryItem>(`/chat/sessions/${sessionId}`, request);
  }

  async deleteChatSession(sessionId: string): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/chat/sessions/${sessionId}`);
  }

  async archiveChatSession(sessionId: string): Promise<{ message: string }> {
    return this.post<{ message: string }>(`/chat/sessions/${sessionId}/archive`);
  }

  async restoreChatSession(sessionId: string): Promise<{ message: string }> {
    return this.post<{ message: string }>(`/chat/sessions/${sessionId}/restore`);
  }

  // Chat messages
  async getSessionMessages(sessionId: string): Promise<ChatHistoryResponse> {
    return this.get<ChatHistoryResponse>(`/chat/sessions/${sessionId}/messages`);
  }

  async sendMessageToSession(sessionId: string, request: { message: string; role?: string }): Promise<ChatResponse> {
    return this.post<ChatResponse>(`/chat/sessions/${sessionId}/messages`, request);
  }

  async getSessionHistory(sessionId: string): Promise<ChatHistoryResponse> {
    return this.get<ChatHistoryResponse>(`/chat/sessions/${sessionId}/history`);
  }

  // Document chat
  async chatWithDocument(request: { file_id: string; message: string; session_id?: string }): Promise<ChatResponse> {
    return this.post<ChatResponse>('/chat/document', request);
  }

  async getDocumentChatHistory(documentId: string): Promise<ChatHistoryResponse> {
    return this.get<ChatHistoryResponse>(`/chat/document/${documentId}/history`);
  }
}

// Create chat API client instance
export const chatApi = new ChatApiClient();
