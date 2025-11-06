"use client";

// Import base API client for use in this file
import { BaseApiClient, baseApiClient } from './base-api-client';

// Import API client classes for use in this file
import { AuthApiClient, authApi } from './auth-api';
import { SubscriptionApiClient, subscriptionApi } from './subscription-api';
import { FileApiClient, fileApi } from './file-api';
import { PDFOperationsApiClient, pdfOperationsApi } from './pdf-operations-api';
import { UploadApiClient, uploadApi } from './upload-api';

// Re-export all API clients
export { BaseApiClient, baseApiClient };
export { AuthApiClient, authApi };
export { SubscriptionApiClient, subscriptionApi };
export { FileApiClient, fileApi };
export { PDFOperationsApiClient, pdfOperationsApi };
export { UploadApiClient, uploadApi };

// Export AI tools
export * from './ai-tools';

// Main API client class that combines all specialized clients
export class ApiClient extends BaseApiClient {
  // Core API clients
  public auth: AuthApiClient;
  public subscription: SubscriptionApiClient;
  public file: FileApiClient;
  public pdfOperations: PDFOperationsApiClient;
  public upload: UploadApiClient;

  // AI tools
  public summarizer: any; // Will be imported from ai-tools
  public powerpoint: any;
  public converter: any;
  public math: any;
  public diagram: any;
  public writer: any;
  public flashcard: any;
  public chat: any;

  constructor(baseURL: string = 'http://localhost:8000/api') {
    super(baseURL);
    
    // Initialize core clients
    this.auth = new AuthApiClient(baseURL);
    this.subscription = new SubscriptionApiClient(baseURL);
    this.file = new FileApiClient(baseURL);
    this.pdfOperations = new PDFOperationsApiClient(baseURL);
    this.upload = new UploadApiClient(baseURL);

    // Initialize AI tools clients
    this.summarizer = new (require('./ai-tools/summarizer-api').SummarizerApiClient)(baseURL);
    this.powerpoint = new (require('./ai-tools/powerpoint-api').PowerPointApiClient)(baseURL);
    this.converter = new (require('./ai-tools/converter-api').ConverterApiClient)(baseURL);
    this.math = new (require('./ai-tools/math-api').MathApiClient)(baseURL);
    this.diagram = new (require('./ai-tools/diagram-api').DiagramApiClient)(baseURL);
    this.writer = new (require('./ai-tools/writer-api').WriterApiClient)(baseURL);
    this.flashcard = new (require('./ai-tools/flashcard-api').FlashcardApiClient)(baseURL);
    this.chat = new (require('./ai-tools/chat-api').ChatApiClient)(baseURL);
  }

  // Override setToken to update all specialized clients
  setToken(token: string | null) {
    super.setToken(token);
    
    // Update core clients
    this.auth.setToken(token);
    this.subscription.setToken(token);
    this.file.setToken(token);
    this.pdfOperations.setToken(token);
    this.upload.setToken(token);

    // Update AI tools clients
    this.summarizer.setToken(token);
    this.powerpoint.setToken(token);
    this.converter.setToken(token);
    this.math.setToken(token);
    this.diagram.setToken(token);
    this.writer.setToken(token);
    this.flashcard.setToken(token);
    this.chat.setToken(token);
  }
}

// Create main API client instance
export const apiClient = new ApiClient();

// Re-export AI tools for convenience
export {
  summarizerApi,
  powerpointApi,
  converterApi,
  mathApi,
  diagramApi,
  writerApi,
  flashcardApi,
  chatApi
} from './ai-tools';

// Export types
export type { ApiResponse } from './base-api-client';