"use client";

import { BaseApiClient } from './base-api-client';
import type { 
  PDFEditRequest,
  PDFEditResponse,
  PDFMergeRequest,
  PDFMergeResponse,
  PDFSplitRequest,
  PDFSplitResponse,
  PDFPreviewRequest,
  PDFPreviewResponse
} from '../types/api';

export class PDFEditApiClient extends BaseApiClient {
  // Merge multiple PDFs
  async mergePDFs(request: PDFMergeRequest): Promise<PDFMergeResponse> {
    const formData = new FormData();
    
    // Add files
    request.files.forEach((file, index) => {
      formData.append(`files`, file);
    });
    
    // Add merge order
    formData.append('merge_order', JSON.stringify(request.merge_order));
    
    // Add page selections if provided
    if (request.page_selections) {
      formData.append('page_selections', JSON.stringify(request.page_selections));
    }
    
    // Add metadata if provided
    if (request.metadata) {
      formData.append('metadata', JSON.stringify(request.metadata));
    }

    return this.post<PDFMergeResponse>('/v1/pdf/merge', formData);
  }

  // Split PDF into multiple files
  async splitPDF(request: PDFSplitRequest): Promise<PDFSplitResponse> {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('split_points', JSON.stringify(request.split_points));
    
    if (request.metadata) {
      formData.append('metadata', JSON.stringify(request.metadata));
    }

    return this.post<PDFSplitResponse>('/v1/pdf/split', formData);
  }

  // Apply edits to PDF
  async applyEdits(request: PDFEditRequest): Promise<PDFEditResponse> {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('operations', JSON.stringify(request.operations));
    
    if (request.metadata) {
      formData.append('metadata', JSON.stringify(request.metadata));
    }

    return this.post<PDFEditResponse>('/v1/pdf/edit', formData);
  }

  // Get PDF preview images
  async getPreview(request: PDFPreviewRequest): Promise<PDFPreviewResponse> {
    const formData = new FormData();
    formData.append('file', request.file);
    
    if (request.page_numbers) {
      formData.append('page_numbers', JSON.stringify(request.page_numbers));
    }
    
    if (request.thumbnail_size) {
      formData.append('thumbnail_size', JSON.stringify(request.thumbnail_size));
    }

    return this.post<PDFPreviewResponse>('/v1/pdf/preview', formData);
  }

  // Upload file with progress tracking (for PDF operations)
  async uploadFileWithProgress(
    file: File, 
    onProgress?: (progress: number) => void,
    metadata?: Record<string, any>
  ): Promise<{ file_url: string; file_id: string }> {
    const additionalData = metadata ? { metadata: JSON.stringify(metadata) } : undefined;
    return this.uploadFile('/files/upload', file, onProgress, additionalData);
  }

  // Download processed PDF
  async downloadPDF(url: string): Promise<Blob> {
    return this.downloadFile(url);
  }

  // Get file info (for existing uploaded files)
  async getFileInfo(fileId: string): Promise<{
    id: string;
    name: string;
    size: number;
    type: string;
    url: string;
    created_at: string;
  }> {
    return this.get(`/files/${fileId}`);
  }
}

// Create PDF edit API client instance
export const pdfEditApi = new PDFEditApiClient();
