"use client";

import { BaseApiClient } from '../base-api-client';
import type { 
  SummarizeRequest,
  SummarizeResponse,
  AsyncSummarizeRequest,
  AsyncSummarizeResponse,
  JobStatusResponse,
  JobResultResponse,
  YouTubeSummarizeRequest,
  YouTubeSummarizeResponse,
  PDFSummarizeRequest,
  PDFSummarizeResponse
} from '../../types/api';

export class SummarizerApiClient extends BaseApiClient {
  // Text summarization
  async summarizeText(request: { text: string; options?: any }): Promise<AsyncSummarizeResponse> {
    return this.post<AsyncSummarizeResponse>('/summarize/async/text', request);
  }

  // YouTube video summarization
  async summarizeYouTube(request: { url: string; options?: any }): Promise<AsyncSummarizeResponse> {
    return this.post<AsyncSummarizeResponse>('/summarize/async/youtube', request);
  }

  // File summarization
  async summarizeFile(request: { file_id: string; options?: any }): Promise<AsyncSummarizeResponse> {
    return this.post<AsyncSummarizeResponse>('/summarize/async/file', request);
  }

  // Image summarization
  async summarizeImage(request: { file_id: string; options?: any }): Promise<AsyncSummarizeResponse> {
    return this.post<AsyncSummarizeResponse>('/summarize/async/image', request);
  }

  // Audio/Video summarization
  async summarizeAudioVideo(request: { file_id: string; options?: any }): Promise<AsyncSummarizeResponse> {
    return this.post<AsyncSummarizeResponse>('/summarize/async/audiovideo', request);
  }

  // Link summarization
  async summarizeLink(request: { url: string; options?: any }): Promise<AsyncSummarizeResponse> {
    return this.post<AsyncSummarizeResponse>('/summarize/link', request);
  }

  // Unified summarize function that routes to appropriate endpoint
  async summarize(request: SummarizeRequest): Promise<AsyncSummarizeResponse> {
    const { content_type, source, options } = request;
    
    switch (content_type) {
      case 'text':
        return this.summarizeText({ text: source.data, options });
      
      case 'youtube':
        return this.summarizeYouTube({ url: source.data, options });
      
      case 'link':
        return this.summarizeLink({ url: source.data, options });
      
      case 'pdf':
      case 'file':
        return this.summarizeFile({ file_id: source.data, options });
      
      case 'image':
        return this.summarizeImage({ file_id: source.data, options });
      
      case 'audio':
      case 'video':
        return this.summarizeAudioVideo({ file_id: source.data, options });
      
      default:
        throw new Error(`Unsupported content type: ${content_type}`);
    }
  }

  // Summarize with password protection
  async summarizeWithPassword(request: SummarizeRequest & { password: string }): Promise<AsyncSummarizeResponse> {
    const { content_type, source, options, password } = request;
    const requestWithPassword = {
      content_type,
      source,
      options: {
        ...options,
        password
      }
    };
    
    return this.summarize(requestWithPassword);
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
  async getTextSummarizeStatus(jobId: string): Promise<JobStatusResponse> {
    return this.get<JobStatusResponse>(`/status/summarize/text?job_id=${jobId}`);
  }

  async getTextSummarizeResult(jobId: string): Promise<JobResultResponse> {
    return this.get<JobResultResponse>(`/result/summarize/text?job_id=${jobId}`);
  }

  async getYouTubeSummarizeStatus(jobId: string): Promise<JobStatusResponse> {
    return this.get<JobStatusResponse>(`/status/summarize/youtube?job_id=${jobId}`);
  }

  async getYouTubeSummarizeResult(jobId: string): Promise<JobResultResponse> {
    return this.get<JobResultResponse>(`/result/summarize/youtube?job_id=${jobId}`);
  }

  async getFileSummarizeStatus(jobId: string): Promise<JobStatusResponse> {
    return this.get<JobStatusResponse>(`/status/summarize/file?job_id=${jobId}`);
  }

  async getFileSummarizeResult(jobId: string): Promise<JobResultResponse> {
    return this.get<JobResultResponse>(`/result/summarize/file?job_id=${jobId}`);
  }

  async getAudioVideoSummarizeStatus(jobId: string): Promise<JobStatusResponse> {
    return this.get<JobStatusResponse>(`/status/summarize/audiovideo?job_id=${jobId}`);
  }

  async getAudioVideoSummarizeResult(jobId: string): Promise<JobResultResponse> {
    return this.get<JobResultResponse>(`/result/summarize/audiovideo?job_id=${jobId}`);
  }

  async getWebSummarizeStatus(jobId: string): Promise<JobStatusResponse> {
    return this.get<JobStatusResponse>(`/status/summarize/web?job_id=${jobId}`);
  }

  async getWebSummarizeResult(jobId: string): Promise<JobResultResponse> {
    return this.get<JobResultResponse>(`/result/summarize/web?job_id=${jobId}`);
  }

  // Helper: use absolute poll/result URLs from backend response
  async getJobStatusByUrl(pollUrl: string): Promise<JobStatusResponse> {
    console.log('summarizerApi.getJobStatusByUrl called with:', pollUrl);
    try {
      const url = new URL(pollUrl);
      let endpoint = url.pathname.replace(/^\/api/, '');
      
      // Handle both old format (/status/{id}) and new format (/status?job_id={id} or /status/summarize/{type}?job_id={id})
      if (url.search) {
        // New format: has query parameters
        endpoint += url.search;
      } else {
        // Old format: extract job_id from path and convert to query parameter
        const pathParts = endpoint.split('/');
        if (pathParts.length >= 3 && pathParts[1] === 'status') {
          const jobId = pathParts[2];
          // Check if it's a specific endpoint like /status/summarize/youtube/{id}
          if (pathParts.length >= 4 && pathParts[2] === 'summarize') {
            const type = pathParts[3];
            const id = pathParts[4];
            endpoint = `/status/summarize/${type}?job_id=${id}`;
          } else {
            endpoint = '/status?job_id=' + jobId;
          }
        }
      }
      
      console.log('Parsed endpoint:', endpoint);
      return this.get<JobStatusResponse>(endpoint);
    } catch (error) {
      console.log('URL parsing failed, using fallback:', error);
      const endpoint = pollUrl.replace(/^http(s)?:\/\/[^/]+/, '').replace(/^\/api/, '');
      console.log('Fallback endpoint:', endpoint);
      return this.get<JobStatusResponse>(endpoint);
    }
  }

  // Helper: use absolute result URL from backend response
  async getJobResultByUrl(resultUrl: string): Promise<JobResultResponse> {
    console.log('summarizerApi.getJobResultByUrl called with:', resultUrl);
    try {
      const url = new URL(resultUrl);
      let endpoint = url.pathname.replace(/^\/api/, '');
      
      // Handle both old format (/result/{id}) and new format (/result?job_id={id} or /result/summarize/{type}?job_id={id})
      if (url.search) {
        // New format: has query parameters
        endpoint += url.search;
      } else {
        // Old format: extract job_id from path and convert to query parameter
        const pathParts = endpoint.split('/');
        if (pathParts.length >= 3 && pathParts[1] === 'result') {
          const jobId = pathParts[2];
          // Check if it's a specific endpoint like /result/summarize/youtube/{id}
          if (pathParts.length >= 4 && pathParts[2] === 'summarize') {
            const type = pathParts[3];
            const id = pathParts[4];
            endpoint = `/result/summarize/${type}?job_id=${id}`;
          } else {
            endpoint = '/result?job_id=' + jobId;
          }
        }
      }
      
      console.log('Parsed result endpoint:', endpoint);
      return this.get<JobResultResponse>(endpoint);
    } catch (error) {
      console.log('URL parsing failed, using fallback:', error);
      const endpoint = resultUrl.replace(/^http(s)?:\/\/[^/]+/, '').replace(/^\/api/, '');
      console.log('Fallback result endpoint:', endpoint);
      return this.get<JobResultResponse>(endpoint);
    }
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

// Create summarizer API client instance
export const summarizerApi = new SummarizerApiClient();
