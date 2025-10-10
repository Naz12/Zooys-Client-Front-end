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
  model: 'Basic Model' | 'Advanced Model' | 'Premium Model';
  file?: File;
  url?: string;
  youtube_url?: string;
}

export interface GenerateOutlineResponse {
  success: boolean;
  data: {
    outline: PresentationOutline;
    ai_result_id: number;
  };
}

export interface UpdateOutlineRequest {
  outline: PresentationOutline;
}

export interface UpdateOutlineResponse {
  success: boolean;
  data: {
    outline: PresentationOutline;
    ai_result_id: number;
  };
}

export interface PresentationTemplate {
  name: string;
  description: string;
  color_scheme: string;
  category: string;
}

export interface TemplatesResponse {
  success: boolean;
  data: {
    templates: Record<string, PresentationTemplate>;
  };
}

export interface GeneratePowerPointRequest {
  template: string;
  color_scheme: string;
  font_style: 'modern' | 'classic' | 'minimalist' | 'creative';
}

export interface GeneratePowerPointResponse {
  success: boolean;
  data: {
    file_path: string;
    file_size: number;
    download_url: string;
    slide_count: number;
  };
  message?: string;
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

export interface PresentationsResponse {
  success: boolean;
  data: {
    presentations: Presentation[];
    pagination: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
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

// Presentation API Client
export class PresentationApiClient extends ApiClient {
  constructor() {
    super();
  }

  // Step 1: Generate Outline
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
      formData.append('model', request.model);

      return this.uploadFile<GenerateOutlineResponse>(
        PRESENTATION_API_ENDPOINTS.GENERATE_OUTLINE,
        request.file,
        {
          input_type: request.input_type,
          topic: request.topic,
          language: request.language,
          tone: request.tone,
          length: request.length,
          model: request.model
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
        model: request.model
      };

      if (request.url) payload.url = request.url;
      if (request.youtube_url) payload.youtube_url = request.youtube_url;

      return this.post<GenerateOutlineResponse>(PRESENTATION_API_ENDPOINTS.GENERATE_OUTLINE, payload);
    }
  }

  // Step 2: Update Outline
  async updateOutline(aiResultId: number, request: UpdateOutlineRequest): Promise<UpdateOutlineResponse> {
    const endpoint = PRESENTATION_API_ENDPOINTS.UPDATE_OUTLINE.replace('{aiResultId}', aiResultId.toString());
    return this.put<UpdateOutlineResponse>(endpoint, request);
  }

  // Step 3: Get Templates
  async getTemplates(): Promise<TemplatesResponse> {
    return this.get<TemplatesResponse>(PRESENTATION_API_ENDPOINTS.GET_TEMPLATES);
  }

  // Step 3: Generate Content for Slides
  async generateContent(aiResultId: number): Promise<GenerateOutlineResponse> {
    const endpoint = PRESENTATION_API_ENDPOINTS.GENERATE_CONTENT.replace('{aiResultId}', aiResultId.toString());
    return this.post<GenerateOutlineResponse>(endpoint, {});
  }

  // Step 4: Save Presentation Data (JSON-based)
  async savePresentation(aiResultId: number, presentationData: any): Promise<ApiResponse> {
    const endpoint = PRESENTATION_API_ENDPOINTS.SAVE_PRESENTATION.replace('{aiResultId}', aiResultId.toString());
    return this.post<ApiResponse>(endpoint, { presentation_data: presentationData });
  }

  // Get Presentation Data for Editing
  async getPresentationData(aiResultId: number): Promise<ApiResponse> {
    const endpoint = PRESENTATION_API_ENDPOINTS.GET_PRESENTATION_DATA.replace('{aiResultId}', aiResultId.toString());
    return this.get<ApiResponse>(endpoint);
  }

  // Export to PowerPoint (On-demand)
  async exportToPowerPoint(aiResultId: number, presentationData: any, templateOverrides?: any): Promise<GeneratePowerPointResponse> {
    const endpoint = PRESENTATION_API_ENDPOINTS.EXPORT_POWERPOINT.replace('{aiResultId}', aiResultId.toString());
    const requestBody = { presentation_data: presentationData };
    if (templateOverrides) {
      Object.assign(requestBody, templateOverrides);
    }
    return this.post<GeneratePowerPointResponse>(endpoint, requestBody);
  }

  // Management APIs
  async getPresentations(perPage: number = 15, search?: string): Promise<PresentationsResponse> {
    const params = new URLSearchParams({
      per_page: perPage.toString(),
      ...(search && { search })
    });
    return this.get<PresentationsResponse>(`${PRESENTATION_API_ENDPOINTS.GET_PRESENTATIONS}?${params}`);
  }

  async getPresentation(id: number): Promise<PresentationResponse> {
    const endpoint = PRESENTATION_API_ENDPOINTS.GET_PRESENTATION.replace('{id}', id.toString());
    return this.get<PresentationResponse>(endpoint);
  }

  async deletePresentation(id: number): Promise<DeletePresentationResponse> {
    const endpoint = PRESENTATION_API_ENDPOINTS.DELETE_PRESENTATION.replace('{id}', id.toString());
    return this.delete<DeletePresentationResponse>(endpoint);
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
  UPDATE_OUTLINE: '/presentations/{aiResultId}/update-outline',
  GENERATE_CONTENT: '/presentations/{aiResultId}/generate-content',
  SAVE_PRESENTATION: '/presentations/{aiResultId}/save',
  GET_PRESENTATION_DATA: '/presentations/{aiResultId}/data',
  EXPORT_POWERPOINT: '/presentations/{aiResultId}/export',
  GET_TEMPLATES: '/presentations/templates',
  GET_PRESENTATIONS: '/presentations',
  GET_PRESENTATION: '/presentations/{id}',
  DELETE_PRESENTATION: '/presentations/{id}',
  MICROSERVICE_STATUS: '/presentations/microservice-status',
} as const;
