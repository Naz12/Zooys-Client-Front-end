"use client";

// Export base API client
export { BaseApiClient, baseApiClient } from './base-api-client';

// Export core API clients
export { AuthApiClient, authApi } from './auth-api';
export { SubscriptionApiClient, subscriptionApi } from './subscription-api';
export { FileApiClient, fileApi } from './file-api';
export { PDFEditApiClient, pdfEditApi } from './pdf-edit-api';

// Export AI tools
export * from './ai-tools';

// Main API client class that combines all specialized clients
export class ApiClient extends BaseApiClient {
  // Core API clients
  public auth: AuthApiClient;
  public subscription: SubscriptionApiClient;
  public file: FileApiClient;
  public pdfEdit: PDFEditApiClient;

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
    this.pdfEdit = new PDFEditApiClient(baseURL);

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
    this.pdfEdit.setToken(token);

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

// Export individual API clients for direct access
export { authApi } from './auth-api';
export { subscriptionApi } from './subscription-api';
export { fileApi } from './file-api';
export { pdfEditApi } from './pdf-edit-api';

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