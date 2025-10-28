"use client";

import { BaseApiClient } from '../base-api-client';
import type { 
  PresentationGenerateRequest,
  PresentationGenerateResponse,
  PresentationUpdateRequest,
  PresentationUpdateResponse,
  PresentationExportRequest,
  PresentationExportResponse,
  PresentationListResponse,
  PresentationResponse,
  AsyncSummarizeResponse,
  JobStatusResponse,
  JobResultResponse
} from '../../types/api';

export class PowerPointApiClient extends BaseApiClient {
  // Generate presentation outline (text)
  async generatePresentationText(request: {
    input_type: 'text';
    topic: string;
    language?: string;
    tone?: string;
    length?: string;
    model?: string;
  }): Promise<AsyncSummarizeResponse> {
    return this.post<AsyncSummarizeResponse>('/presentations/generate-outline', request);
  }

  // Generate presentation outline (file)
  async generatePresentationFile(request: {
    input_type: 'file';
    file_id: string;
    language?: string;
    tone?: string;
    length?: string;
    model?: string;
  }): Promise<AsyncSummarizeResponse> {
    return this.post<AsyncSummarizeResponse>('/presentations/generate-outline', request);
  }

  // Get presentation templates
  async getTemplates(): Promise<{ templates: any[] }> {
    return this.get<{ templates: any[] }>('/presentations/templates');
  }

  // Get presentation details
  async getPresentation(aiResultId: string): Promise<PresentationResponse> {
    return this.get<PresentationResponse>(`/presentations/${aiResultId}`);
  }

  // Update presentation outline
  async updatePresentationOutline(aiResultId: string, request: { outline: string }): Promise<PresentationUpdateResponse> {
    return this.put<PresentationUpdateResponse>(`/presentations/${aiResultId}/update-outline`, request);
  }

  // Generate presentation content
  async generatePresentationContent(aiResultId: string): Promise<AsyncSummarizeResponse> {
    return this.post<AsyncSummarizeResponse>(`/presentations/${aiResultId}/generate-content`);
  }

  // Generate PowerPoint file
  async generatePowerPointFile(aiResultId: string): Promise<AsyncSummarizeResponse> {
    return this.post<AsyncSummarizeResponse>(`/presentations/${aiResultId}/generate-powerpoint`);
  }

  // Get presentation status
  async getPresentationStatus(aiResultId: string): Promise<JobStatusResponse> {
    return this.get<JobStatusResponse>(`/presentations/${aiResultId}/status`);
  }

  // Export presentation
  async exportPresentation(aiResultId: string): Promise<PresentationExportResponse> {
    return this.post<PresentationExportResponse>(`/presentations/${aiResultId}/export`);
  }

  // Save presentation
  async savePresentation(aiResultId: string): Promise<{ message: string }> {
    return this.post<{ message: string }>(`/presentations/${aiResultId}/save`);
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
  async getTextPresentationStatus(jobId: string): Promise<JobStatusResponse> {
    return this.get<JobStatusResponse>(`/status/presentations/text?job_id=${jobId}`);
  }

  async getTextPresentationResult(jobId: string): Promise<JobResultResponse> {
    return this.get<JobResultResponse>(`/result/presentations/text?job_id=${jobId}`);
  }

  async getFilePresentationStatus(jobId: string): Promise<JobStatusResponse> {
    return this.get<JobStatusResponse>(`/status/presentations/file?job_id=${jobId}`);
  }

  async getFilePresentationResult(jobId: string): Promise<JobResultResponse> {
    return this.get<JobResultResponse>(`/result/presentations/file?job_id=${jobId}`);
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

// Create PowerPoint API client instance
export const powerpointApi = new PowerPointApiClient();