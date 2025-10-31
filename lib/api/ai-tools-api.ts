"use client";

import { BaseApiClient } from './base-api-client';
import type { 
  YouTubeSummarizeRequest,
  YouTubeSummarizeResponse,
  PDFSummarizeRequest,
  PDFSummarizeResponse,
  WriterRunRequest,
  WriterRunResponse,
  MathSolveRequest,
  MathSolveResponse,
  DiagramGenerateRequest,
  DiagramGenerateResponse,
  AsyncSummarizeRequest,
  AsyncSummarizeResponse,
  JobStatusResponse,
  JobResultResponse
} from '../types/api';

export class AiToolsApiClient extends BaseApiClient {
  // YouTube Video Summarization
  async summarizeYouTube(request: YouTubeSummarizeRequest): Promise<YouTubeSummarizeResponse> {
    return this.post<YouTubeSummarizeResponse>('/youtube/summarize', request);
  }

  // PDF Summarization
  async summarizePDF(request: PDFSummarizeRequest): Promise<PDFSummarizeResponse> {
    return this.post<PDFSummarizeResponse>('/pdf/summarize', request);
  }

  // Writer/AI Content Generation
  async runWriter(request: WriterRunRequest): Promise<WriterRunResponse> {
    return this.post<WriterRunResponse>('/writer/run', request);
  }

  // Math Problem Solving
  async solveMath(request: MathSolveRequest): Promise<MathSolveResponse> {
    return this.post<MathSolveResponse>('/math/solve', request);
  }

  // Diagram Generation
  async generateDiagram(request: DiagramGenerateRequest): Promise<DiagramGenerateResponse> {
    return this.post<DiagramGenerateResponse>('/diagram/generate', request);
  }

  // Async Summarization
  async summarizeAsync(request: AsyncSummarizeRequest): Promise<AsyncSummarizeResponse> {
    return this.post<AsyncSummarizeResponse>('/summarize/async', request);
  }

  // Get job status
  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    return this.get<JobStatusResponse>(`/status?job_id=${jobId}`);
  }

  // Get job result
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

// Create AI tools API client instance
export const aiToolsApi = new AiToolsApiClient();



