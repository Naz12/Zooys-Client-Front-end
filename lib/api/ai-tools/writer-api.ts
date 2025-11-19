"use client";

import { BaseApiClient } from '../base-api-client';

// Content Writer API Types
export interface ContentWriteRequest {
  prompt: string;
  mode?: 'creative' | 'professional' | 'academic';
}

export interface ContentRewriteRequest {
  previous_content: string;
  prompt: string;
  mode?: 'creative' | 'professional' | 'academic';
}

export interface ContentJobResponse {
  success: boolean;
  job_id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message: string;
  poll_url?: string;
  result_url?: string;
}

export interface ContentJobStatus {
  success: boolean;
  job_id: string;
  tool_type: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  stage: string;
  stage_message: string;
  stage_description?: string;
  error: string | null;
  created_at: string;
  updated_at: string;
  logs?: any[];
}

export interface ContentJobResult {
  success: boolean;
  job_id: string;
  tool_type: string;
  data: {
    content: string;
    word_count: number;
    character_count: number;
    mode: string;
    metadata: {
      model_used: string;
      model_display: string;
      tokens_used: number;
      processing_time: number;
      is_rewrite: boolean;
    };
  };
  metadata: {
    processing_started_at: string;
    processing_completed_at: string;
    total_processing_time: number;
    tool_type: string;
    mode: string;
    model_used: string;
  };
}

export class WriterApiClient extends BaseApiClient {
  // Write new content
  async writeContent(request: ContentWriteRequest): Promise<ContentJobResponse> {
    return this.post<ContentJobResponse>('/content/write', request);
  }

  // Rewrite existing content
  async rewriteContent(request: ContentRewriteRequest): Promise<ContentJobResponse> {
    return this.post<ContentJobResponse>('/content/rewrite', request);
  }

  // Get job status
  async getJobStatus(jobId: string): Promise<ContentJobStatus> {
    return this.get<ContentJobStatus>(`/content/status?job_id=${jobId}`);
  }

  // Get job result
  async getJobResult(jobId: string): Promise<ContentJobResult> {
    return this.get<ContentJobResult>(`/content/result?job_id=${jobId}`);
  }

  // Poll job completion with progress callback
  async pollJobCompletion(
    jobId: string,
    onProgress?: (progress: number, stage?: string, stageMessage?: string) => void,
    maxAttempts: number = 60,
    interval: number = 2500
  ): Promise<{ success: boolean; result?: ContentJobResult; error?: string }> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const status = await this.getJobStatus(jobId);
        
        // Update progress callback
        if (onProgress) {
          onProgress(
            status.progress || 0,
            status.stage,
            status.stage_message || status.stage_description
          );
        }
        
        if (status.status === 'completed') {
          const result = await this.getJobResult(jobId);
          return { success: true, result };
        } else if (status.status === 'failed') {
          return { success: false, error: status.error || 'Job failed' };
        }
        
        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error) {
        console.error(`Poll attempt ${attempt + 1} failed:`, error);
        if (attempt === maxAttempts - 1) {
          return { success: false, error: 'Polling failed' };
        }
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    return { success: false, error: 'Job timeout' };
  }
}

// Create writer API client instance
export const writerApi = new WriterApiClient();
