"use client";

import { BaseApiClient } from './base-api-client';
import { uploadApi, type SingleFileUploadResponse } from './upload-api';
import type {
  PDFJobStatus,
  PDFJobSubmitResponse,
  MergeParams,
  MergeResult,
  SplitParams,
  SplitResult,
  CompressParams,
  CompressResult,
  WatermarkParams,
  WatermarkResult,
  PageNumbersParams,
  PageNumbersResult,
  AnnotateParams,
  AnnotateResult,
  ProtectParams,
  ProtectResult,
  UnlockParams,
  UnlockResult,
  PreviewParams,
  PreviewResult,
  EditPDFParams,
  EditPDFResult,
} from '../types/api';

/**
 * PDF Operations API Client
 * Extends BaseApiClient to use axios for all PDF operations
 * Uses file_id-based workflow: upload file → get file_id → submit job → poll status → get result
 */
export class PDFOperationsApiClient extends BaseApiClient {
  // ============================================================================
  // File Upload
  // ============================================================================

  /**
   * Upload a single PDF file and get file_id
   * @param file File to upload
   * @param onProgress Optional progress callback
   * @returns File upload response with file_id
   */
  async uploadPDFFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<SingleFileUploadResponse> {
    return uploadApi.uploadSingleFile(file, onProgress);
  }

  /**
   * Upload multiple PDF files and get file_ids
   * @param files Array of files to upload
   * @param onProgress Optional progress callback
   * @returns Multiple file upload response with file_ids
   */
  async uploadMultiplePDFFiles(
    files: File[],
    onProgress?: (progress: number) => void
  ): Promise<any> {
    return uploadApi.uploadMultipleFiles(files, onProgress);
  }

  // ============================================================================
  // Merge Operation (Multi-file)
  // ============================================================================

  /**
   * Submit merge job
   * @param file_ids Array of file IDs to merge
   * @param params Merge parameters
   * @returns Job submission response with job_id
   */
  async merge(
    file_ids: string[],
    params: MergeParams = {}
  ): Promise<PDFJobSubmitResponse> {
    return this.post<PDFJobSubmitResponse>('/pdf/edit/merge', {
      file_ids,
      params,
    });
  }

  /**
   * Get merge job status
   * @param job_id Job ID from merge submission
   * @returns Job status with progress
   */
  async getMergeStatus(job_id: string): Promise<PDFJobStatus> {
    return this.get<PDFJobStatus>(`/pdf/edit/merge/status?job_id=${job_id}`);
  }

  /**
   * Get merge job result
   * @param job_id Job ID from merge submission
   * @returns Merge result with download_urls
   */
  async getMergeResult(job_id: string): Promise<MergeResult> {
    return this.get<MergeResult>(`/pdf/edit/merge/result?job_id=${job_id}`);
  }

  // ============================================================================
  // Split Operation
  // ============================================================================

  async split(
    file_id: string,
    params: SplitParams
  ): Promise<PDFJobSubmitResponse> {
    return this.post<PDFJobSubmitResponse>('/pdf/edit/split', {
      file_id,
      params,
    });
  }

  async getSplitStatus(job_id: string): Promise<PDFJobStatus> {
    return this.get<PDFJobStatus>(`/pdf/edit/split/status?job_id=${job_id}`);
  }

  async getSplitResult(job_id: string): Promise<SplitResult> {
    return this.get<SplitResult>(`/pdf/edit/split/result?job_id=${job_id}`);
  }

  // ============================================================================
  // Compress Operation
  // ============================================================================

  async compress(
    file_id: string,
    params: CompressParams
  ): Promise<PDFJobSubmitResponse> {
    return this.post<PDFJobSubmitResponse>('/pdf/edit/compress', {
      file_id,
      params,
    });
  }

  async getCompressStatus(job_id: string): Promise<PDFJobStatus> {
    return this.get<PDFJobStatus>(
      `/pdf/edit/compress/status?job_id=${job_id}`
    );
  }

  async getCompressResult(job_id: string): Promise<CompressResult> {
    return this.get<CompressResult>(
      `/pdf/edit/compress/result?job_id=${job_id}`
    );
  }

  // ============================================================================
  // Watermark Operation
  // ============================================================================

  async watermark(
    file_id: string,
    params: WatermarkParams
  ): Promise<PDFJobSubmitResponse> {
    return this.post<PDFJobSubmitResponse>('/pdf/edit/watermark', {
      file_id,
      params,
    });
  }

  async getWatermarkStatus(job_id: string): Promise<PDFJobStatus> {
    return this.get<PDFJobStatus>(
      `/pdf/edit/watermark/status?job_id=${job_id}`
    );
  }

  async getWatermarkResult(job_id: string): Promise<WatermarkResult> {
    return this.get<WatermarkResult>(
      `/pdf/edit/watermark/result?job_id=${job_id}`
    );
  }

  // ============================================================================
  // Page Numbers Operation
  // ============================================================================

  async addPageNumbers(
    file_id: string,
    params: PageNumbersParams
  ): Promise<PDFJobSubmitResponse> {
    return this.post<PDFJobSubmitResponse>('/pdf/edit/page_numbers', {
      file_id,
      params,
    });
  }

  async getPageNumbersStatus(job_id: string): Promise<PDFJobStatus> {
    return this.get<PDFJobStatus>(
      `/pdf/edit/page_numbers/status?job_id=${job_id}`
    );
  }

  async getPageNumbersResult(job_id: string): Promise<PageNumbersResult> {
    return this.get<PageNumbersResult>(
      `/pdf/edit/page_numbers/result?job_id=${job_id}`
    );
  }

  // ============================================================================
  // Annotate Operation
  // ============================================================================

  async annotate(
    file_id: string,
    params: AnnotateParams
  ): Promise<PDFJobSubmitResponse> {
    return this.post<PDFJobSubmitResponse>('/pdf/edit/annotate', {
      file_id,
      params,
    });
  }

  async getAnnotateStatus(job_id: string): Promise<PDFJobStatus> {
    return this.get<PDFJobStatus>(
      `/pdf/edit/annotate/status?job_id=${job_id}`
    );
  }

  async getAnnotateResult(job_id: string): Promise<AnnotateResult> {
    return this.get<AnnotateResult>(
      `/pdf/edit/annotate/result?job_id=${job_id}`
    );
  }

  // ============================================================================
  // Protect Operation
  // ============================================================================

  async protect(
    file_id: string,
    params: ProtectParams
  ): Promise<PDFJobSubmitResponse> {
    return this.post<PDFJobSubmitResponse>('/pdf/edit/protect', {
      file_id,
      params,
    });
  }

  async getProtectStatus(job_id: string): Promise<PDFJobStatus> {
    return this.get<PDFJobStatus>(`/pdf/edit/protect/status?job_id=${job_id}`);
  }

  async getProtectResult(job_id: string): Promise<ProtectResult> {
    return this.get<ProtectResult>(`/pdf/edit/protect/result?job_id=${job_id}`);
  }

  // ============================================================================
  // Unlock Operation
  // ============================================================================

  async unlock(
    file_id: string,
    params: UnlockParams
  ): Promise<PDFJobSubmitResponse> {
    return this.post<PDFJobSubmitResponse>('/pdf/edit/unlock', {
      file_id,
      params,
    });
  }

  async getUnlockStatus(job_id: string): Promise<PDFJobStatus> {
    return this.get<PDFJobStatus>(`/pdf/edit/unlock/status?job_id=${job_id}`);
  }

  async getUnlockResult(job_id: string): Promise<UnlockResult> {
    return this.get<UnlockResult>(`/pdf/edit/unlock/result?job_id=${job_id}`);
  }

  // ============================================================================
  // Preview Operation
  // ============================================================================

  async preview(
    file_id: string,
    params: PreviewParams = {}
  ): Promise<PDFJobSubmitResponse> {
    return this.post<PDFJobSubmitResponse>('/pdf/edit/preview', {
      file_id,
      params,
    });
  }

  async getPreviewStatus(job_id: string): Promise<PDFJobStatus> {
    return this.get<PDFJobStatus>(`/pdf/edit/preview/status?job_id=${job_id}`);
  }

  async getPreviewResult(job_id: string): Promise<PreviewResult> {
    return this.get<PreviewResult>(`/pdf/edit/preview/result?job_id=${job_id}`);
  }

  // ============================================================================
  // Edit PDF Operation
  // ============================================================================

  async editPDF(
    file_id: string,
    params: EditPDFParams
  ): Promise<PDFJobSubmitResponse> {
    return this.post<PDFJobSubmitResponse>('/pdf/edit/edit_pdf', {
      file_id,
      params,
    });
  }

  async getEditPDFStatus(job_id: string): Promise<PDFJobStatus> {
    return this.get<PDFJobStatus>(
      `/pdf/edit/edit_pdf/status?job_id=${job_id}`
    );
  }

  async getEditPDFResult(job_id: string): Promise<EditPDFResult> {
    return this.get<EditPDFResult>(
      `/pdf/edit/edit_pdf/result?job_id=${job_id}`
    );
  }

  // ============================================================================
  // Generic Status/Result Methods (for dynamic operation handling)
  // ============================================================================

  /**
   * Get status for any operation (generic method)
   * @param operation Operation name (e.g., 'merge', 'split', 'compress')
   * @param job_id Job ID
   * @returns Job status
   */
  async getStatus(operation: string, job_id: string): Promise<PDFJobStatus> {
    return this.get<PDFJobStatus>(
      `/pdf/edit/${operation}/status?job_id=${job_id}`
    );
  }

  /**
   * Download file from URL (handles download_urls from results)
   * @param url Download URL
   * @returns File blob
   */
  async downloadFromUrl(url: string): Promise<Blob> {
    return this.downloadFile(url);
  }
}

// Create and export default instance
export const pdfOperationsApi = new PDFOperationsApiClient();

