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
  tool_type?: string;
  input_type?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  stage: string;
  error: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface ConversionResult {
  success: boolean;
  job_id: string;
  tool_type?: string;
  input_type?: string;
  data: {
    file_path: string;
    file_url: string;
    original_format: string;
    target_format: string;
    file_size: number;
    pages?: number;
    conversion_time?: number;
    metadata?: {
      quality?: string;
      include_metadata?: boolean;
      dpi?: number;
      page_range?: string;
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
    
    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('📤 Upload response structure:', {
        hasResponse: !!response,
        hasData: !!response?.data,
        hasFileUpload: !!response?.file_upload,
        responseKeys: response ? Object.keys(response) : [],
        responseStructure: JSON.stringify(response, null, 2),
        dataId: response?.data?.id,
        fileUploadId: response?.file_upload?.id,
      });
    }
    
    // Check if response has the expected structure
    if (!response) {
      console.error('❌ Invalid upload response:', response);
      throw new Error('Invalid response from upload API. Response is empty.');
    }
    
    // The backend may return the file data in different structures
    // Try to find the file ID in multiple possible locations
    let fileId: string | number | undefined;
    let fileData: any;
    
    // Check if response has file_upload object (backend may return this directly)
    if (response.file_upload) {
      fileData = response.file_upload;
      fileId = fileData.id;
    } 
    // Otherwise check data object
    else if (response.data) {
      fileData = response.data;
      fileId = fileData.id;
    }
    // If neither exists, the response structure is unexpected
    else {
      console.error('❌ Invalid upload response structure:', response);
      throw new Error('Invalid response from upload API. Response structure is unexpected.');
    }
    
    // Validate and parse the file ID
    if (!fileId && fileId !== 0) {
      console.error('❌ Missing file ID in response:', response);
      throw new Error('File upload response is missing file ID.');
    }
    
    const parsedId = typeof fileId === 'string' ? parseInt(fileId, 10) : fileId;
    if (isNaN(parsedId)) {
      console.error('❌ Invalid file ID format:', {
        originalId: fileId,
        idType: typeof fileId,
        response: response,
      });
      throw new Error(`Invalid file ID format: ${fileId}. Expected a number.`);
    }
    
    // Convert to FileUploadResponse format expected by this API
    // Handle both response structures: { data: {...} } or { file_upload: {...} }
    return {
      success: response.success ?? true,
      message: response.message || 'File uploaded successfully',
      file_upload: {
        id: parsedId,
        user_id: fileData.user_id || 0,
        original_name: fileData.original_name || fileData.original_filename || '',
        stored_name: fileData.stored_name || fileData.original_filename || '',
        file_path: fileData.file_path || '',
        mime_type: fileData.mime_type || fileData.file_type || '',
        file_size: fileData.file_size || 0,
        file_type: fileData.file_type || '',
        metadata: {
          uploaded_at: fileData.created_at || fileData.uploaded_at || new Date().toISOString(),
          client_ip: '',
          user_agent: null,
        },
        is_processed: fileData.is_processed || false,
        created_at: fileData.created_at || new Date().toISOString(),
        updated_at: fileData.updated_at || fileData.created_at || new Date().toISOString(),
      },
      file_url: response.file_url || fileData.file_path || '',
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
    return apiClient.get<JobStatusResponse>(`/file-processing/convert/status?job_id=${jobId}`);
  }

  // Get conversion job result
  async getConversionResult(jobId: string): Promise<ConversionResult> {
    return apiClient.get<ConversionResult>(`/file-processing/convert/result?job_id=${jobId}`);
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
