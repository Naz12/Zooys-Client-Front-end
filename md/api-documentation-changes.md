# 📋 API Documentation Changes Summary

## Overview
This document summarizes the new features and changes in the API documentation compared to the current codebase implementation.

**Date:** 2025-11-18

---

## 🆕 Major New Features

### 1. **Document Chat API** (`POST /api/document/chat`)

**Status:** ⚠️ **NEW - Not Implemented in Frontend**

This is a completely new endpoint that enables chatting with summarized documents using `doc_id` and `conversation_id` from summarization results.

**Key Differences from Current Implementation:**

| Current | New API |
|---------|---------|
| `/chat/document` | `/api/document/chat` |
| Uses `file_id` | Uses `doc_id` (from summary result) |
| Uses `message` | Uses `query` |
| Uses `session_id` | Uses `conversation_id` |
| No additional params | Has `max_tokens`, `top_k`, `llm_model` |

**New Request Structure:**
```json
{
  "doc_id": "doc_abc123",
  "query": "What are the key points?",
  "conversation_id": "conv_xyz789",
  "llm_model": "deepseek-chat",
  "max_tokens": 512,
  "top_k": 3
}
```

**New Response Structure:**
```json
{
  "success": true,
  "conversation_id": "conv_xyz789",
  "answer": "The key points are...",
  "sources": [
    {
      "doc_id": "doc_abc123",
      "page": 1,
      "score": 0.91
    }
  ],
  "doc_id": "doc_abc123"
}
```

**Prerequisites:**
- Document must have been summarized successfully
- Summary result must include `doc_id` (not null)
- Document Intelligence service must be available (not using AI Manager fallback)

---

### 2. **Enhanced Summary Response Structure**

**Status:** ⚠️ **NEW - Response Structure Not Fully Typed**

The new documentation shows a much more detailed response structure:

**New Fields in Summary Result:**
- `doc_id` - Document ID for Document Intelligence (null if fallback used)
- `conversation_id` - Conversation ID for document chat (null if doc_id is null)
- `confidence_score` - Confidence score (0.0-1.0)
- `model_used` - LLM model used for summarization
- `sources` - Array of source references
- `chapters` - Array of chapter objects with timestamps
- `bundle` - Complete bundle with `article_text`, `json_items`, `transcript_json`
- `metadata.chat_enabled` - Boolean indicating if chat is available
- `metadata.fallback_used` - Boolean indicating if AI Manager fallback was used
- `metadata.fallback_reason` - Reason for fallback (if applicable)

**Example New Response Structure:**
```json
{
  "success": true,
  "job_id": "...",
  "tool_type": "summarize",
  "input_type": "youtube",
  "data": {
    "summary": "...",
    "key_points": [...],
    "chapters": [
      {
        "title": "Introduction",
        "timestamp": "00:00:00",
        "description": "..."
      }
    ],
    "bundle": {
      "article_text": "...",
      "json_items": [...],
      "transcript_json": [...]
    },
    "doc_id": "doc_abc123",
    "conversation_id": "conv_xyz789",
    "confidence_score": 0.9,
    "model_used": "deepseek-chat",
    "sources": [],
    "metadata": {
      "source_type": "youtube",
      "chapters_extracted": true,
      "chapters_count": 2,
      "chat_enabled": true,
      "sources_count": 0,
      "fallback_used": false,
      "fallback_reason": null
    }
  }
}
```

---

### 3. **Type-Specific Status & Result Endpoints**

**Status:** ✅ **Partially Implemented**

The new documentation shows type-specific endpoints that provide better validation:

**New Endpoints:**
- `GET /api/status/summarize/youtube?job_id={job_id}`
- `GET /api/status/summarize/text?job_id={job_id}`
- `GET /api/status/summarize/file?job_id={job_id}`
- `GET /api/status/summarize/audiovideo?job_id={job_id}`
- `GET /api/status/summarize/web?job_id={job_id}`

**Current Implementation:**
- ✅ Already implemented in `specializedSummarizeApi` (lines 890-918 in `lib/api-client.ts`)
- ✅ Already implemented in `SummarizerApiClient` (lines 104-142 in `lib/api/ai-tools/summarizer-api.ts`)

**Enhanced Status Response:**
```json
{
  "job_id": "...",
  "tool_type": "summarize",
  "input_type": "youtube",
  "status": "processing",
  "progress": 50,
  "stage": "extracting_summary",
  "error": null,
  "created_at": "...",
  "updated_at": "..."
}
```

**New Fields:**
- `tool_type` - Always "summarize"
- `input_type` - Type of input (youtube, text, file, audiovideo, web)
- `stage` - Current processing stage (transcribing, ingesting_text, polling_ingestion, extracting_summary, extracting_chapters, finalizing, fallback_ai_manager, failed)

---

### 4. **Enhanced File Summarization Options**

**Status:** ⚠️ **NEW - Options Not Fully Typed**

The new documentation shows more detailed options for file summarization:

**New Options:**
- `ocr` - OCR mode: `auto`, `force`, `skip` (default: "auto")
- `lang` - Document language for OCR (default: "eng")
- `max_tokens` - Maximum response tokens (default: 2000)
- `top_k` - Number of context chunks (default: 10)
- `temperature` - LLM temperature 0.0-1.0 (default: 0.7)
- `force_fallback` - Use remote LLM (default: true)

**Current Implementation:**
- ⚠️ Options are passed as `any` type
- ⚠️ No TypeScript interface for these specific options

---

### 5. **Fallback Mechanism Documentation**

**Status:** ⚠️ **NEW - Not Documented in Current Code**

The new documentation clearly explains the fallback mechanism:

**How It Works:**
1. **Primary**: Document Intelligence (provides `doc_id` and `conversation_id` for chat)
2. **Fallback**: AI Manager (no `doc_id`, no chat available)

**How to Check:**
- Look for `metadata.fallback_used: true` in the result
- Check if `doc_id` is `null` (indicates fallback was used)
- Check `metadata.fallback_reason` for details

**Impact:**
- When fallback is used, summaries and chapters are still generated
- Document chat is **not available** when `doc_id` is `null`
- All other features work normally

---

## 📊 Comparison Table

| Feature | Current Implementation | New Documentation | Status |
|---------|----------------------|-------------------|--------|
| Document Chat Endpoint | `/chat/document` | `/api/document/chat` | ⚠️ Different |
| Document Chat Params | `file_id`, `message`, `session_id` | `doc_id`, `query`, `conversation_id`, `max_tokens`, `top_k`, `llm_model` | ⚠️ Different |
| Summary Response | Basic structure | Enhanced with `doc_id`, `conversation_id`, `chapters`, `bundle`, `metadata` | ⚠️ Needs Update |
| Status Endpoints | Universal + Type-specific | Type-specific with `tool_type`, `input_type`, `stage` | ✅ Implemented |
| File Options | Basic options | Enhanced with `ocr`, `lang`, `max_tokens`, `top_k`, `temperature` | ⚠️ Needs Typing |
| Fallback Mechanism | Not documented | Fully documented | ⚠️ Needs Documentation |

---

## 🔧 Required Frontend Updates

### 1. **Add Document Chat API Client**

**File:** `lib/api-client.ts` or `lib/api/ai-tools/chat-api.ts`

**New Function Needed:**
```typescript
export const documentChatApi = {
  chat: (request: {
    doc_id: string;
    query: string;
    conversation_id?: string;
    llm_model?: string;
    max_tokens?: number;
    top_k?: number;
  }) => apiClient.post<DocumentChatResponse>('/document/chat', request),
};
```

### 2. **Update Type Definitions**

**File:** `lib/api-client.ts` or `lib/types/api.ts`

**New Types Needed:**
```typescript
export interface DocumentChatRequest {
  doc_id: string;
  query: string;
  conversation_id?: string;
  llm_model?: string;
  max_tokens?: number;
  top_k?: number;
}

export interface DocumentChatResponse {
  success: boolean;
  conversation_id: string;
  answer: string;
  sources: Array<{
    doc_id: string;
    page: number;
    score: number;
  }>;
  doc_id: string;
}

export interface EnhancedJobResultResponse {
  success: boolean;
  job_id: string;
  tool_type: "summarize";
  input_type: "youtube" | "text" | "file" | "audiovideo" | "web";
  data: {
    summary: string;
    key_points: string[];
    chapters: Array<{
      title: string;
      timestamp: string | null;
      description: string;
    }>;
    bundle: {
      article_text: string;
      json_items: any[];
      transcript_json: any[];
    };
    doc_id: string | null;
    conversation_id: string | null;
    confidence_score: number;
    model_used: string;
    sources: any[];
    metadata: {
      source_type: string;
      chapters_extracted: boolean;
      chapters_count: number;
      chat_enabled: boolean;
      sources_count: number;
      fallback_used: boolean;
      fallback_reason: string | null;
    };
  };
}
```

### 3. **Update File Summarization Options Type**

**File:** `lib/api-client.ts`

**Enhanced Options Type:**
```typescript
export interface FileSummarizeOptions {
  language?: string;
  format?: string;
  llm_model?: string;
  ocr?: "auto" | "force" | "skip";
  lang?: string;
  max_tokens?: number;
  top_k?: number;
  temperature?: number;
  force_fallback?: boolean;
}
```

### 4. **Update Status Response Type**

**File:** `lib/api-client.ts`

**Enhanced Status Type:**
```typescript
export interface JobStatusResponse {
  job_id: string;
  tool_type?: "summarize";
  input_type?: "youtube" | "text" | "file" | "audiovideo" | "web";
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  stage?: string;
  error?: string | null;
  created_at: string;
  updated_at: string;
}
```

---

## 📝 Notes

1. **Document Chat** is the biggest new feature - it requires `doc_id` from summarization results
2. **Enhanced Response Structure** provides much more information about the summarization process
3. **Type-Specific Endpoints** are already implemented but may need better integration
4. **Fallback Mechanism** needs to be handled in the UI to show when chat is unavailable
5. **File Options** need proper TypeScript typing for better developer experience

---

## ✅ Already Implemented

- ✅ Type-specific status endpoints (`getYouTubeJobStatus`, `getTextJobStatus`, etc.)
- ✅ Type-specific result endpoints (`getYouTubeJobResult`, `getTextJobResult`, etc.)
- ✅ Specialized summarization endpoints (YouTube, Text, File, AudioVideo, Link)
- ✅ Universal status and result endpoints

---

## ⚠️ Needs Implementation

- ⚠️ Document Chat API client (`/api/document/chat`)
- ⚠️ Enhanced response type definitions
- ⚠️ File summarization options typing
- ⚠️ Fallback mechanism handling in UI
- ⚠️ Document chat UI components
- ⚠️ Chapter display with timestamps
- ⚠️ Bundle content display

---

**Last Updated:** 2025-11-18

