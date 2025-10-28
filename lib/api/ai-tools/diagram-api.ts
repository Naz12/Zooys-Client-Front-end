"use client";

import { BaseApiClient } from '../base-api-client';
import type { 
  DiagramGenerateRequest,
  DiagramGenerateResponse,
  DiagramUpdateRequest,
  DiagramUpdateResponse,
  DiagramListResponse,
  DiagramResponse,
  DiagramExportRequest,
  DiagramExportResponse,
  AsyncSummarizeResponse,
  JobStatusResponse,
  JobResultResponse
} from '../../types/api';

export class DiagramApiClient extends BaseApiClient {
  // Generate diagram
  async generateDiagram(request: {
    description: string;
    diagram_type?: string;
    style?: string;
  }): Promise<AsyncSummarizeResponse> {
    return this.post<AsyncSummarizeResponse>('/diagram/generate', request);
  }

  // Universal status check
  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    return this.get<JobStatusResponse>(`/status?job_id=${jobId}`);
  }

  // Universal result retrieval
  async getJobResult(jobId: string): Promise<JobResultResponse> {
    return this.get<JobResultResponse>(`/result?job_id=${jobId}`);
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

// Create diagram API client instance
export const diagramApi = new DiagramApiClient();
