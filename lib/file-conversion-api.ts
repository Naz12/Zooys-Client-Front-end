"use client";

import { apiClient } from './api-client';
import { uploadApi } from './api/upload-api';

// File conversion API types
export interface FileUploadResponse {
  success: boolean;
  message: string;
  file_upload: {
    id: number;
    user_id: number;
    original_name: string;
    stored_name: string;
    file_path: string;
    mime_type: string;
    file_size: number;
    file_type: string;
    metadata: {
      uploaded_at: string;
      client_ip: string;
      user_agent: string | null;
    };
    is_processed: boolean;
    created_at: string;
    updated_at: string;
  };
  file_url: string;
}

export interface ConversionRequest {
  file_id: string;
  target_format: string;
  options?: {
    quality?: 'low' | 'medium' | 'high';
    include_metadata?: boolean;
    page_range?: string;
  };
}

export interface ConversionResponse {
  success: boolean;
  message: string;
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  poll_url: string;
  result_url: string;
}

export interface ExtractionRequest {
  file_id: string;
  extraction_type?: 'text' | 'metadata' | 'both';
  language?: string;
  include_formatting?: boolean;
  max_pages?: number;
  options?: {
    preserve_layout?: boolean;
    extract_images?: boolean;
  };
}

export interface ExtractionResponse {
  success: boolean;
  message: string;
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  poll_url: string;
  result_url: string;
}

export interface JobStatusResponse {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  stage: string;
  error: string | null;
  tool_type: string;
  created_at: string;
  updated_at: string;
}

export interface ConversionResult {
  success: boolean;
  data: {
    conversion_result: {
      job_id: string;
      status: 'completed' | 'failed';
      progress: number;
      stage: string;
      created_at: number;
      started_at: number;
      completed_at: number;
      error: string | null;
      output_files: string[];
      job_type: string;
    };
    converted_file: {
      path: string;
      url: string;
      filename: string;
    };
    original_file: {
      id: number;
      filename: string | null;
      size: number;
    };
  };
}

export interface ExtractionResult {
  job_id: string;
  status: 'completed' | 'failed';
  result: {
    extracted_content: {
      text: string;
      metadata: {
        title: string;
        author: string;
        pages: number;
        word_count: number;
        language: string;
      };
      formatting: {
        bold: string[];
        headings: string[];
      };
    };
    extraction_info: {
      extraction_type: string;
      pages_processed: number;
      processing_time: string;
    };
  };
}

export interface ConversionCapabilities {
  success: boolean;
  data: {
    supported_formats: {
      input: string[];
      output: string[];
    };
    conversion_options: {
      quality: string[];
      page_range: string;
      include_metadata: boolean;
    };
  };
}

export interface ExtractionCapabilities {
  success: boolean;
  data: {
    supported_formats: string[];
    extraction_types: string[];
    supported_languages: string[];
    max_pages: number;
  };
}

export interface HealthCheckResponse {
  success: boolean;
  data: {
    status: string;
    service: string;
    version: string;
    uptime: string;
  };
}

// File conversion API client
export class FileConversionApiClient {
  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:8000/api') {
    this.baseURL = baseURL;
  }

  // Upload file
  async uploadFile(file: File, metadata?: Record<string, any>): Promise<FileUploadResponse> {
    // Use the dedicated upload API
    const response = await uploadApi.uploadSingleFile(file, undefined, metadata);
    
    // Convert to FileUploadResponse format expected by this API
    return {
      success: response.success,
      message: 'File uploaded successfully',
      file_upload: {
        id: parseInt(response.data.id),
        user_id: 0, // Not available in response
        original_name: response.data.original_filename,
        stored_name: response.data.original_filename,
        file_path: response.data.file_path,
        mime_type: response.data.file_type,
        file_size: response.data.file_size,
        file_type: response.data.file_type,
        metadata: {
          uploaded_at: response.data.created_at,
          client_ip: '',
          user_agent: null,
        },
        is_processed: false,
        created_at: response.data.created_at,
        updated_at: response.data.created_at,
      },
      file_url: response.data.file_path,
    };
  }

  // Convert document
  async convertDocument(request: ConversionRequest): Promise<ConversionResponse> {
    return apiClient.post<ConversionResponse>('/file-processing/convert', request);
  }

  // Extract content
  async extractContent(request: ExtractionRequest): Promise<ExtractionResponse> {
    return apiClient.post<ExtractionResponse>('/file-processing/extract', request);
  }

  // Check conversion job status
  async getConversionStatus(jobId: string): Promise<JobStatusResponse> {
    return apiClient.get<JobStatusResponse>(`/status/document_conversion/file?job_id=${jobId}`);
  }

  // Get conversion job result
  async getConversionResult(jobId: string): Promise<ConversionResult> {
    return apiClient.get<ConversionResult>(`/result/document_conversion/file?job_id=${jobId}`);
  }

  // Check extraction job status
  async getExtractionStatus(jobId: string): Promise<JobStatusResponse> {
    return apiClient.get<JobStatusResponse>(`/status/content_extraction/file?job_id=${jobId}`);
  }

  // Get extraction job result
  async getExtractionResult(jobId: string): Promise<ExtractionResult> {
    return apiClient.get<ExtractionResult>(`/result/content_extraction/file?job_id=${jobId}`);
  }

  // Generic job status (for backward compatibility, uses convert status)
  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    return this.getConversionStatus(jobId);
  }

  // Generic job result (for backward compatibility, tries to get conversion result)
  async getJobResult(jobId: string): Promise<ConversionResult | ExtractionResult> {
    try {
      return await this.getConversionResult(jobId);
    } catch {
      return await this.getExtractionResult(jobId);
    }
  }

  // Get conversion capabilities
  async getConversionCapabilities(): Promise<ConversionCapabilities> {
    return apiClient.get<ConversionCapabilities>('/file-processing/conversion-capabilities');
  }

  // Get extraction capabilities
  async getExtractionCapabilities(): Promise<ExtractionCapabilities> {
    return apiClient.get<ExtractionCapabilities>('/file-processing/extraction-capabilities');
  }

  // Health check
  async getHealthCheck(): Promise<HealthCheckResponse> {
    return apiClient.get<HealthCheckResponse>('/file-processing/health');
  }

  // Poll conversion job completion
  async pollConversionCompletion(
    jobId: string, 
    maxAttempts: number = 60, 
    interval: number = 2000
  ): Promise<ConversionResult> {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getConversionStatus(jobId);
      
      if (status.status === 'completed') {
        return await this.getConversionResult(jobId);
      } else if (status.status === 'failed') {
        throw new Error(status.error || 'Conversion job failed');
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error('Conversion job timeout');
  }

  // Poll extraction job completion
  async pollExtractionCompletion(
    jobId: string, 
    maxAttempts: number = 60, 
    interval: number = 2000
  ): Promise<ExtractionResult> {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getExtractionStatus(jobId);
      
      if (status.status === 'completed') {
        return await this.getExtractionResult(jobId);
      } else if (status.status === 'failed') {
        throw new Error(status.error || 'Extraction job failed');
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error('Extraction job timeout');
  }

  // Generic poll job completion (for backward compatibility)
  async pollJobCompletion(
    jobId: string, 
    maxAttempts: number = 60, 
    interval: number = 2000
  ): Promise<ConversionResult | ExtractionResult> {
    // Try conversion first
    try {
      return await this.pollConversionCompletion(jobId, maxAttempts, interval);
    } catch {
      // If conversion fails, try extraction
      return await this.pollExtractionCompletion(jobId, maxAttempts, interval);
    }
  }

  // Complete workflow: upload, convert, and extract
  async processFile(
    file: File, 
    options: {
      convert?: boolean;
      extract?: boolean;
      targetFormat?: string;
      extractionOptions?: Partial<ExtractionRequest>;
    } = {}
  ): Promise<{
    fileId: number;
    convertResult?: ConversionResult;
    extractResult?: ExtractionResult;
  }> {
    // 1. Upload file
    const uploadResponse = await this.uploadFile(file);
    const fileId = uploadResponse.file_upload.id;

    const results: any = { fileId };

    // 2. Convert if requested
    if (options.convert && options.targetFormat) {
      const convertJobId = await this.convertDocument({
        file_id: fileId.toString(),
        target_format: options.targetFormat,
        options: {
          quality: 'high',
          include_metadata: true
        }
      });
      
      results.convertResult = await this.pollConversionCompletion(convertJobId.job_id);
    }

    // 3. Extract if requested
    if (options.extract) {
      const extractJobId = await this.extractContent({
        file_id: fileId.toString(),
        extraction_type: 'text',
        include_formatting: true,
        ...options.extractionOptions
      });
      
      results.extractResult = await this.pollExtractionCompletion(extractJobId.job_id);
    }

    return results;
  }
}

// Create default instance
export const fileConversionApi = new FileConversionApiClient();

// Export convenience functions
export const fileConversionApiHelpers = {
  // Upload and convert file
  uploadAndConvert: (file: File, targetFormat: string) =>
    fileConversionApi.processFile(file, { convert: true, targetFormat }),

  // Upload and extract content
  uploadAndExtract: (file: File, options?: Partial<ExtractionRequest>) =>
    fileConversionApi.processFile(file, { extract: true, extractionOptions: options }),

  // Upload, convert, and extract
  uploadConvertAndExtract: (file: File, targetFormat: string, options?: Partial<ExtractionRequest>) =>
    fileConversionApi.processFile(file, { 
      convert: true, 
      extract: true, 
      targetFormat, 
      extractionOptions: options 
    }),

  // Get supported formats
  getSupportedFormats: () => fileConversionApi.getConversionCapabilities(),

  // Get extraction capabilities
  getExtractionCapabilities: () => fileConversionApi.getExtractionCapabilities(),

  // Check service health
  checkHealth: () => fileConversionApi.getHealthCheck(),
};
