"use client";

import { BaseApiClient } from './base-api-client';
import type { 
  FileUpload,
  FileUploadRequest,
  FileUploadResponse,
  FilesResponse,
  FileResponse,
  FileContentResponse
} from '../types/api';

export class FileApiClient extends BaseApiClient {
  // Upload file
  async uploadFile(request: FileUploadRequest): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', request.file);
    
    if (request.metadata) {
      formData.append('metadata', JSON.stringify(request.metadata));
    }

    return this.post<FileUploadResponse>('/files/upload', formData);
  }

  // Upload file with progress tracking
  async uploadFileWithProgress(
    file: File, 
    onProgress?: (progress: number) => void,
    metadata?: Record<string, any>
  ): Promise<FileUploadResponse> {
    const additionalData = metadata ? { metadata: JSON.stringify(metadata) } : undefined;
    return this.uploadFile('/files/upload', file, onProgress, additionalData);
  }

  // Get all files
  async getFiles(page: number = 1, limit: number = 10): Promise<FilesResponse> {
    return this.get<FilesResponse>('/files');
  }

  // Get file by ID
  async getFile(fileId: string): Promise<FileResponse> {
    return this.get<FileResponse>(`/files/${fileId}`);
  }

  // Get file content
  async getFileContent(fileId: string): Promise<Blob> {
    return this.downloadFile(`/files/${fileId}/content`);
  }

  // Delete file
  async deleteFile(fileId: string): Promise<{ message: string }> {
    return this.delete<{ message: string }>(`/files/${fileId}`);
  }

  // Download file
  async downloadFile(fileId: string): Promise<Blob> {
    return this.downloadFile(`/files/${fileId}/download`);
  }

  // Get file metadata
  async getFileMetadata(fileId: string): Promise<FileUpload> {
    return this.get<FileUpload>(`/files/${fileId}`);
  }

  // Update file metadata
  async updateFileMetadata(fileId: string, metadata: Record<string, any>): Promise<FileResponse> {
    return this.put<FileResponse>(`/files/${fileId}`, metadata);
  }
}

// Create file API client instance
export const fileApi = new FileApiClient();