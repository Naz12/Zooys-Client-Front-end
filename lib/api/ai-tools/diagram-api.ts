"use client";

import { BaseApiClient } from '../base-api-client';
import type { 
  AsyncSummarizeResponse,
  JobStatusResponse,
  JobResultResponse
} from '../../types/api';

export interface DiagramGenerateRequest {
  prompt: string;
  diagram_type: string;
  language?: string;
}

export interface DiagramGenerateResponse extends AsyncSummarizeResponse {
  job_id: string;
  status: string;
  message?: string;
  poll_url?: string;
  result_url?: string;
}

export interface DiagramResult {
  ai_result_id: number;
  image_url: string;
  image_path: string;
  image_filename: string;
  diagram_type: string;
  prompt: string;
}

export interface DiagramListResponse {
  success: boolean;
  data: Array<{
    id: number;
    title: string;
    result_data: DiagramResult;
    created_at: string;
    updated_at: string;
  }>;
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface DiagramResponse {
  success: boolean;
  data: {
    id: number;
    title: string;
    result_data: DiagramResult;
    metadata?: any;
    created_at: string;
    updated_at: string;
  };
}

export interface DiagramTypesResponse {
  success: boolean;
  data: {
    graph_based: string[];
    chart_based: string[];
    all: string[];
  };
}

export interface HealthResponse {
  success: boolean;
  available: boolean;
  message: string;
}

export class DiagramApiClient extends BaseApiClient {
  // Generate diagram
  async generate(request: DiagramGenerateRequest): Promise<DiagramGenerateResponse> {
    return this.post<DiagramGenerateResponse>('/diagram/generate', {
      prompt: request.prompt,
      diagram_type: request.diagram_type,
      language: request.language || 'en'
    });
  }

  // Get job status
  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    return this.get<JobStatusResponse>(`/diagram/status?job_id=${jobId}`);
  }

  // Get job status by URL (alternative endpoint)
  async getJobStatusByUrl(pollUrl: string): Promise<JobStatusResponse> {
    try {
      const url = new URL(pollUrl);
      let endpoint = url.pathname.replace(/^\/api/, '');
      
      if (url.search) {
        endpoint += url.search;
      } else {
        const pathParts = endpoint.split('/');
        if (pathParts.length >= 3 && pathParts[1] === 'status') {
          const jobId = pathParts[2];
          endpoint = `/diagram/status?job_id=${jobId}`;
        }
      }
      
      return this.get<JobStatusResponse>(endpoint);
    } catch (error) {
      const endpoint = pollUrl.replace(/^http(s)?:\/\/[^/]+/, '').replace(/^\/api/, '');
      return this.get<JobStatusResponse>(endpoint);
    }
  }

  // Get job result
  async getJobResult(jobId: string): Promise<JobResultResponse> {
    return this.get<JobResultResponse>(`/diagram/result?job_id=${jobId}`);
  }

  // Get job result by URL (alternative endpoint)
  async getJobResultByUrl(resultUrl: string): Promise<JobResultResponse> {
    try {
      const url = new URL(resultUrl);
      let endpoint = url.pathname.replace(/^\/api/, '');
      
      if (url.search) {
        endpoint += url.search;
      } else {
        const pathParts = endpoint.split('/');
        if (pathParts.length >= 3 && pathParts[1] === 'result') {
          const jobId = pathParts[2];
          endpoint = `/diagram/result?job_id=${jobId}`;
        }
      }
      
      return this.get<JobResultResponse>(endpoint);
    } catch (error) {
      const endpoint = resultUrl.replace(/^http(s)?:\/\/[^/]+/, '').replace(/^\/api/, '');
      return this.get<JobResultResponse>(endpoint);
    }
  }

  // Alternative status endpoint
  async getStatus(jobId: string): Promise<JobStatusResponse> {
    return this.get<JobStatusResponse>(`/status/diagram?job_id=${jobId}`);
  }

  // Alternative result endpoint
  async getResult(jobId: string): Promise<JobResultResponse> {
    return this.get<JobResultResponse>(`/result/diagram?job_id=${jobId}`);
  }

  // List diagrams
  async list(page: number = 1, perPage: number = 15): Promise<DiagramListResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString()
    });
    return this.get<DiagramListResponse>(`/diagram?${params}`);
  }

  // Get diagram by ID
  async getById(aiResultId: number): Promise<DiagramResponse> {
    return this.get<DiagramResponse>(`/diagram/${aiResultId}`);
  }

  // Delete diagram
  async delete(aiResultId: number): Promise<{ success: boolean; message: string }> {
    return this.delete<{ success: boolean; message: string }>(`/diagram/${aiResultId}`);
  }

  // Get diagram types
  async getTypes(): Promise<DiagramTypesResponse> {
    return this.get<DiagramTypesResponse>('/diagram/types');
  }

  // Check health
  async health(): Promise<HealthResponse> {
    return this.get<HealthResponse>('/diagram/health');
  }

  // Poll job completion
  async pollJobCompletion(
    jobId: string, 
    pollUrl?: string,
    maxAttempts: number = 60, 
    interval: number = 2000
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const status = pollUrl 
          ? await this.getJobStatusByUrl(pollUrl)
          : await this.getJobStatus(jobId);
        
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
