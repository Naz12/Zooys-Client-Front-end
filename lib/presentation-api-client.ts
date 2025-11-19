"use client";

import { ApiClient, apiClient } from './api-client';

// Presentation API Types
export interface PresentationSlide {
  slide_number: number;
  header: string;
  subheaders: string[];
  slide_type: 'title' | 'content' | 'conclusion';
}

export interface PresentationOutline {
  title: string;
  slides: PresentationSlide[];
  estimated_duration: string;
  slide_count: number;
}

export interface GenerateOutlineRequest {
  input_type: 'text' | 'file' | 'url' | 'youtube';
  topic: string;
  language: 'English' | 'Spanish' | 'French' | 'German' | 'Italian' | 'Portuguese' | 'Chinese' | 'Japanese';
  tone: 'Professional' | 'Casual' | 'Academic' | 'Creative' | 'Formal';
  length: 'Short' | 'Medium' | 'Long';
  model?: 'gpt-3.5-turbo' | 'gpt-4';
  file?: File;
  url?: string;
  youtube_url?: string;
}

export interface GenerateOutlineResponse {
  success: boolean;
  job_id: string;
  message: string;
}

export interface JobStatusResponse {
  success: boolean;
  job_id: string;
  tool_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  stage?: string;
  stage_message?: string;
  stage_description?: string;
  created_at?: string;
  updated_at?: string;
  logs?: Array<{
    timestamp: string;
    level: string;
    message: string;
    data: any;
  }>;
  error?: string;
}

export interface JobResultResponse {
  success: boolean;
  job_id: string;
  tool_type: string;
  result?: {
    outline?: PresentationOutline;
    content?: PresentationContent;
    file_id?: number;
    filename?: string;
    download_url?: string;
    file_size?: number;
    slides_count?: number;
    title?: string;
  };
  metadata?: any;
  error?: string;
}

export interface PresentationContent {
  title: string;
  slides: Array<PresentationSlide & { content?: string }>;
}

export interface GenerateContentRequest {
  outline: PresentationOutline;
  tone: 'Professional' | 'Casual' | 'Academic' | 'Creative' | 'Formal';
  detail_level: 'brief' | 'detailed' | 'comprehensive';
}

export interface GenerateContentResponse {
  success: boolean;
  job_id: string;
  message: string;
}

export interface PresentationTemplate {
  name: string;
  description: string;
  color_scheme: string;
  category: string;
}

export interface TemplatesResponse {
  success: boolean;
  templates: Record<string, PresentationTemplate>;
}

export interface ExportPresentationRequest {
  content: PresentationContent;
  template?: string;
  color_scheme?: string;
  font_style?: 'modern' | 'classic' | 'minimalist' | 'creative';
}

export interface ExportPresentationResponse {
  success: boolean;
  job_id: string;
  message: string;
}

export interface Presentation {
  id: number;
  title: string;
  description: string;
  tool_type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PresentationFile {
  id: number;
  user_id: number;
  title: string;
  filename: string;
  file_url: string;
  file_size: number;
  human_file_size: string;
  template: string;
  color_scheme: string;
  font_style: string;
  slides_count: number;
  metadata?: {
    exported_at: string;
    exported_by: string;
  };
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface PresentationsResponse {
  success: boolean;
  data: PresentationFile[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
  };
}

export interface PresentationResponse {
  success: boolean;
  data: {
    presentation: {
      id: number;
      title: string;
      description: string;
      tool_type: string;
      input_data: Record<string, unknown>;
      result_data: Record<string, unknown>;
      metadata: Record<string, unknown>;
      status: string;
      created_at: string;
      updated_at: string;
    };
  };
}

export interface DeletePresentationResponse {
  success: boolean;
  message: string;
}

export interface SavePresentationFileRequest {
  file: File;
  title?: string;
}

export interface SavePresentationFileResponse {
  success: boolean;
  message: string;
  data?: {
    file_id: number;
    filename: string;
    file_url: string;
  };
}

// Presentation API Client
export class PresentationApiClient extends ApiClient {
  constructor() {
    super();
  }

  // Step 1: Generate Outline (Async - returns job_id)
  async generateOutline(request: GenerateOutlineRequest): Promise<GenerateOutlineResponse> {
    if (request.input_type === 'file' && request.file) {
      // File upload - use FormData
      const formData = new FormData();
      formData.append('file', request.file);
      formData.append('input_type', request.input_type);
      formData.append('topic', request.topic);
      formData.append('language', request.language);
      formData.append('tone', request.tone);
      formData.append('length', request.length);
      // Model is optional - backend will use default if not provided

      return this.uploadFile<GenerateOutlineResponse>(
        PRESENTATION_API_ENDPOINTS.GENERATE_OUTLINE,
        request.file,
        {
          input_type: request.input_type,
          topic: request.topic,
          language: request.language,
          tone: request.tone,
          length: request.length,
          // Model is optional - backend will use default if not provided
        }
      );
    } else {
      // Text/URL/YouTube input - use JSON
      const payload: any = {
        input_type: request.input_type,
        topic: request.topic,
        language: request.language,
        tone: request.tone,
        length: request.length,
        // Model is optional - backend will use default if not provided
      };

      if (request.url) payload.url = request.url;
      if (request.youtube_url) payload.youtube_url = request.youtube_url;

      return this.post<GenerateOutlineResponse>(PRESENTATION_API_ENDPOINTS.GENERATE_OUTLINE, payload);
    }
  }

  // Get Job Status
  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    return this.get<JobStatusResponse>(`${PRESENTATION_API_ENDPOINTS.GET_JOB_STATUS}?job_id=${jobId}`);
  }

  // Get Job Result
  async getJobResult(jobId: string): Promise<JobResultResponse> {
    return this.get<JobResultResponse>(`${PRESENTATION_API_ENDPOINTS.GET_JOB_RESULT}?job_id=${jobId}`);
  }

  // Step 2: Get Templates
  async getTemplates(): Promise<TemplatesResponse> {
    return this.get<TemplatesResponse>(PRESENTATION_API_ENDPOINTS.GET_TEMPLATES);
  }

  // Step 3: Generate Content (Async - returns job_id, requires outline)
  async generateContent(request: GenerateContentRequest): Promise<GenerateContentResponse> {
    return this.post<GenerateContentResponse>(PRESENTATION_API_ENDPOINTS.GENERATE_CONTENT, request);
  }

  // Step 4: Export Presentation (Async - returns job_id, requires content)
  async exportPresentation(request: ExportPresentationRequest): Promise<ExportPresentationResponse> {
    return this.post<ExportPresentationResponse>(PRESENTATION_API_ENDPOINTS.EXPORT, request);
  }

  // Management APIs - List Presentation Files
  async getPresentations(perPage: number = 15, search?: string): Promise<PresentationsResponse> {
    const params = new URLSearchParams({
      per_page: perPage.toString(),
      ...(search && { search })
    });
    return this.get<PresentationsResponse>(`${PRESENTATION_API_ENDPOINTS.LIST_FILES}?${params}`);
  }

  async getPresentation(id: number): Promise<PresentationResponse> {
    const endpoint = PRESENTATION_API_ENDPOINTS.GET_PRESENTATION.replace('{id}', id.toString());
    return this.get<PresentationResponse>(endpoint);
  }

  async deletePresentation(id: number): Promise<DeletePresentationResponse> {
    // Use the files endpoint for deleting presentation files
    const endpoint = PRESENTATION_API_ENDPOINTS.DELETE_FILE.replace('{fileId}', id.toString());
    return this.delete<DeletePresentationResponse>(endpoint);
  }

  // Save edited PPT file
  async savePresentationFile(fileId: number, request: SavePresentationFileRequest): Promise<SavePresentationFileResponse> {
    const endpoint = PRESENTATION_API_ENDPOINTS.SAVE_FILE.replace('{fileId}', fileId.toString());
    const additionalData: Record<string, any> = {};
    if (request.title) {
      additionalData.title = request.title;
    }
    return this.uploadFile<SavePresentationFileResponse>(endpoint, request.file, undefined, additionalData);
  }

  // Get presentation file data (for editing)
  async getPresentationFile(fileId: number): Promise<ApiResponse> {
    const endpoint = PRESENTATION_API_ENDPOINTS.GET_FILE.replace('{fileId}', fileId.toString());
    return this.get<ApiResponse>(endpoint);
  }

  // Get presentation file content (for editing) - NEW ENDPOINT
  async getPresentationFileContent(fileId: number): Promise<ApiResponse> {
    const endpoint = PRESENTATION_API_ENDPOINTS.GET_FILE_CONTENT.replace('{fileId}', fileId.toString());
    return this.get<ApiResponse>(endpoint);
  }

  // Download presentation file
  async downloadPresentationFile(fileId: number): Promise<Blob> {
    const endpoint = PRESENTATION_API_ENDPOINTS.DOWNLOAD_FILE.replace('{fileId}', fileId.toString());
    
    // Use the same pattern as ApiClient methods
    // Use the same base URL as ApiClient
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    const url = `${API_BASE_URL}${endpoint}`;
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    const config: RequestInit = {
      method: 'GET',
      headers: {
        'Accept': 'application/octet-stream',
        'Origin': 'http://localhost:3000',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      redirect: 'manual',
    };

    try {
      const response = await fetch(url, config);
      
      // Handle redirect responses
      if (response.status === 0 || (response.type === 'opaqueredirect' && response.status !== 401 && response.status !== 403)) {
        throw new Error('Request was redirected. This usually indicates a network or CORS issue.');
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || `HTTP ${response.status}` };
        }
        throw new Error(errorData.message || `Failed to download file: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error downloading presentation file:', error);
      throw error;
    }
  }

  // System Status
  async checkMicroserviceStatus(): Promise<ApiResponse> {
    return this.get<ApiResponse>(PRESENTATION_API_ENDPOINTS.MICROSERVICE_STATUS);
  }
}

// Create default instance
export const presentationApi = new PresentationApiClient();

// Export API endpoints for reference
export const PRESENTATION_API_ENDPOINTS = {
  GENERATE_OUTLINE: '/presentations/generate-outline',
  GENERATE_CONTENT: '/presentations/generate-content',
  EXPORT: '/presentations/export',
  GET_JOB_STATUS: '/presentations/status',
  GET_JOB_RESULT: '/presentations/result',
  GET_TEMPLATES: '/presentations/templates',
  GET_PRESENTATIONS: '/presentations',
  GET_PRESENTATION: '/presentations/{id}',
  DELETE_PRESENTATION: '/presentations/{id}',
  LIST_FILES: '/presentations/files',
  DELETE_FILE: '/presentations/files/{fileId}',
  DOWNLOAD_FILE: '/presentations/files/{fileId}/download',
  SAVE_FILE: '/presentations/files/{fileId}/save',
  GET_FILE: '/presentations/files/{fileId}',
  GET_FILE_CONTENT: '/presentations/files/{fileId}/content',
} as const;
