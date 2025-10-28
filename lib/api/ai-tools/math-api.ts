"use client";

import { BaseApiClient } from '../base-api-client';
import type { 
  MathSolveRequest,
  MathSolveResponse,
  MathGraphRequest,
  MathGraphResponse,
  MathHistoryResponse,
  MathStatsResponse,
  AsyncSummarizeResponse,
  JobStatusResponse,
  JobResultResponse
} from '../../types/api';

export class MathApiClient extends BaseApiClient {
  // Solve math problem (text)
  async solveMathText(request: { problem_text: string; subject_area?: string; difficulty_level?: string }): Promise<AsyncSummarizeResponse> {
    return this.post<AsyncSummarizeResponse>('/math/solve', request);
  }

  // Solve math problem (image)
  async solveMathImage(request: { file_id: string; subject_area?: string; difficulty_level?: string }): Promise<AsyncSummarizeResponse> {
    return this.post<AsyncSummarizeResponse>('/math/solve', request);
  }

  // Get math problems
  async getMathProblems(): Promise<any[]> {
    return this.get<any[]>('/math/problems');
  }

  // Get math problem details
  async getMathProblem(problemId: string): Promise<any> {
    return this.get<any>(`/math/problems/${problemId}`);
  }

  // Get math history
  async getMathHistory(): Promise<MathHistoryResponse> {
    return this.get<MathHistoryResponse>('/math/history');
  }

  // Get math statistics
  async getMathStats(): Promise<MathStatsResponse> {
    return this.get<MathStatsResponse>('/math/stats');
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
  async getTextMathStatus(jobId: string): Promise<JobStatusResponse> {
    return this.get<JobStatusResponse>(`/status/math/text?job_id=${jobId}`);
  }

  async getTextMathResult(jobId: string): Promise<JobResultResponse> {
    return this.get<JobResultResponse>(`/result/math/text?job_id=${jobId}`);
  }

  async getImageMathStatus(jobId: string): Promise<JobStatusResponse> {
    return this.get<JobStatusResponse>(`/status/math/image?job_id=${jobId}`);
  }

  async getImageMathResult(jobId: string): Promise<JobResultResponse> {
    return this.get<JobResultResponse>(`/result/math/image?job_id=${jobId}`);
  }

  // Legacy client endpoints
  async generateMath(request: any): Promise<any> {
    return this.post<any>('/client/math/generate', request);
  }

  async getMathHelp(): Promise<any> {
    return this.post<any>('/client/math/help');
  }

  async getClientMathHistory(): Promise<any> {
    return this.get<any>('/client/math/history');
  }

  async getClientMathStats(): Promise<any> {
    return this.get<any>('/client/math/stats');
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

// Create math API client instance
export const mathApi = new MathApiClient();
