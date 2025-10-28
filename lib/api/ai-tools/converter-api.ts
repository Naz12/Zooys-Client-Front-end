"use client";

import { BaseApiClient } from '../base-api-client';
import type { 
  ConvertFileRequest,
  ConvertFileResponse,
  ConversionStatusResponse,
  ConversionResultResponse,
  SupportedFormatsResponse,
  AsyncSummarizeResponse,
  JobStatusResponse,
  JobResultResponse
} from '../../types/api';

export class ConverterApiClient extends BaseApiClient {
  // Convert document
  async convertDocument(request: { file_id: string; target_format: string; options?: any }): Promise<AsyncSummarizeResponse> {
    return this.post<AsyncSummarizeResponse>('/file-processing/convert', request);
  }

  // Extract content
  async extractContent(request: { file_id: string; extraction_type: string; options?: any }): Promise<AsyncSummarizeResponse> {
    return this.post<AsyncSummarizeResponse>('/file-processing/extract', request);
  }

  // Get conversion capabilities
  async getConversionCapabilities(): Promise<SupportedFormatsResponse> {
    return this.get<SupportedFormatsResponse>('/file-processing/conversion-capabilities');
  }

  // Get extraction capabilities
  async getExtractionCapabilities(): Promise<SupportedFormatsResponse> {
    return this.get<SupportedFormatsResponse>('/file-processing/extraction-capabilities');
  }

  // Check processing health
  async checkProcessingHealth(): Promise<{ status: string; message: string }> {
    return this.get<{ status: string; message: string }>('/file-processing/health');
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
  async getContentExtractionStatus(jobId: string): Promise<JobStatusResponse> {
    return this.get<JobStatusResponse>(`/status/content_extraction/file?job_id=${jobId}`);
  }

  async getContentExtractionResult(jobId: string): Promise<JobResultResponse> {
    return this.get<JobResultResponse>(`/result/content_extraction/file?job_id=${jobId}`);
  }

  async getDocumentConversionStatus(jobId: string): Promise<JobStatusResponse> {
    return this.get<JobStatusResponse>(`/status/document_conversion/file?job_id=${jobId}`);
  }

  async getDocumentConversionResult(jobId: string): Promise<JobResultResponse> {
    return this.get<JobResultResponse>(`/result/document_conversion/file?job_id=${jobId}`);
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

// Create converter API client instance
export const converterApi = new ConverterApiClient();
