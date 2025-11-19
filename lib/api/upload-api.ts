"use client";

import { BaseApiClient } from './base-api-client';

/**
 * File upload response for single file
 * Backend may return either structure:
 * - { success: true, data: { id, ... } }
 * - { success: true, file_upload: { id, ... } }
 */
export interface SingleFileUploadResponse {
  success: boolean;
  message?: string;
  data?: {
    id: string | number;
    original_filename?: string;
    original_name?: string;
    file_size: number;
    file_type?: string;
    mime_type?: string;
    file_path?: string;
    created_at: string;
  };
  file_upload?: {
    id: string | number;
    original_name?: string;
    original_filename?: string;
    stored_name?: string;
    file_size: number;
    file_type?: string;
    mime_type?: string;
    file_path?: string;
    created_at: string;
    updated_at?: string;
  };
  file_url?: string;
  // Also allow direct properties for flexibility
  id?: string | number;
  original_filename?: string;
  original_name?: string;
  file_size?: number;
  file_type?: string;
  mime_type?: string;
  file_path?: string;
  created_at?: string;
}

/**
 * File upload item in multiple file upload response
 */
export interface FileUploadItem {
  file_upload: {
    id: number;
    original_name: string;
    stored_name: string;
    file_type: string;
    file_size: number;
    human_file_size: string;
    mime_type: string;
    is_processed: boolean;
    file_url: string;
    created_at: string;
  };
  file_url: string;
}

/**
 * Multiple file upload response
 */
export interface MultipleFileUploadResponse {
  success: boolean;
  message: string;
  uploaded_count: number;
  error_count: number;
  file_uploads: FileUploadItem[];
  errors: any[];
}

/**
 * Unified file upload response (can be single or multiple)
 */
export type FileUploadResponse = SingleFileUploadResponse | MultipleFileUploadResponse;

/**
 * Upload API Client
 * Handles both single and multiple file uploads with progress tracking
 */
export class UploadApiClient extends BaseApiClient {
  /**
   * Upload a single file
   * @param file File to upload
   * @param onProgress Optional progress callback (0-100)
   * @param metadata Optional metadata to attach
   * @returns Single file upload response
   */
  async uploadSingleFile(
    file: File,
    onProgress?: (progress: number) => void,
    metadata?: Record<string, any>
  ): Promise<SingleFileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const config: any = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    };

    try {
      const response = await this.retryRequest(() => 
        this.axiosInstance.post<SingleFileUploadResponse>('/files/upload', formData, config)
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error as any);
      throw error;
    }
  }

  /**
   * Upload multiple files
   * @param files Array of files to upload
   * @param onProgress Optional progress callback (0-100)
   * @param metadata Optional metadata to attach
   * @returns Multiple file upload response
   */
  async uploadMultipleFiles(
    files: File[],
    onProgress?: (progress: number) => void,
    metadata?: Record<string, any>
  ): Promise<MultipleFileUploadResponse> {
    const formData = new FormData();
    
    // Use files[] array notation for Laravel to receive as array
    files.forEach((file) => {
      formData.append('files[]', file);
    });
    
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const config: any = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: any) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    };

    try {
      const response = await this.retryRequest(() => 
        this.axiosInstance.post<MultipleFileUploadResponse>('/files/upload', formData, config)
      );
      return response.data;
    } catch (error) {
      this.handleApiError(error as any);
      throw error;
    }
  }

  /**
   * Upload one or more files (automatically detects single vs multiple)
   * @param files Single file or array of files
   * @param onProgress Optional progress callback (0-100)
   * @param metadata Optional metadata to attach
   * @returns Upload response (single or multiple)
   */
  async uploadFiles(
    files: File | File[],
    onProgress?: (progress: number) => void,
    metadata?: Record<string, any>
  ): Promise<FileUploadResponse> {
    if (Array.isArray(files)) {
      if (files.length === 1) {
        // Single file in array - upload as single
        return this.uploadSingleFile(files[0], onProgress, metadata);
      } else {
        // Multiple files - upload as array
        return this.uploadMultipleFiles(files, onProgress, metadata);
      }
    } else {
      // Single file
      return this.uploadSingleFile(files, onProgress, metadata);
    }
  }
}

// Create upload API client instance
export const uploadApi = new UploadApiClient();

