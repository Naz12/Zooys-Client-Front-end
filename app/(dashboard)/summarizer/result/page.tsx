"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { summarizerApi, diagramApi, documentChatApi } from "@/lib/api";
import { parseSummarizationResult } from "@/lib/result-parser";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications";
import {
  ArrowLeft,
  Loader2,
  FileText,
  Youtube,
  Music2,
  Link as LinkIcon,
  Type,
  Copy,
  Download,
  RefreshCw,
  MessageSquare,
  Network,
  Send,
  AlertCircle,
  RotateCw,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { JobStatusResponse, JobResultResponse } from "@/lib/types/api";
import type { DocumentChatRequest, DocumentChatResponse } from "@/lib/api";

type ContentType = "youtube" | "pdf" | "audio" | "link" | "text";

interface ResultData {
  contentType: ContentType;
  originalContent: string;
  jobId?: string;
  pollUrl?: string;
  resultUrl?: string;
  result?: any;
  request?: any;
}

export default function SummarizerResultPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const router = useRouter();
  
  const [resultData, setResultData] = useState<ResultData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>("");
  const [stage, setStage] = useState<string>("");
  const [finalResult, setFinalResult] = useState<any>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Mind map state
  const [mindMapImageUrl, setMindMapImageUrl] = useState<string | null>(null);
  const [isGeneratingMindMap, setIsGeneratingMindMap] = useState(false);
  const [mindMapError, setMindMapError] = useState<string | null>(null);
  const [mindMapRotation, setMindMapRotation] = useState(0);
  const [mindMapZoom, setMindMapZoom] = useState(100);
  const [isMindMapFullscreen, setIsMindMapFullscreen] = useState(false);
  
  // Document chat state
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  useEffect(() => {
    // Load data from sessionStorage
    const stored = sessionStorage.getItem('summarizerResult');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setResultData(data);
        
        // If we have a jobId, start polling
        if (data.jobId) {
          startPolling(data.jobId, data.pollUrl, data.resultUrl);
        } else if (data.result) {
          // Direct result, no polling needed
          setFinalResult(data.result);
          setIsLoading(false);
        } else {
          showError("Error", "No result data found");
          router.push('/summarizer');
        }
      } catch (error) {
        console.error('Error parsing stored data:', error);
        showError("Error", "Failed to load result data");
        router.push('/summarizer');
      }
    } else {
      showError("Error", "No result data found");
      router.push('/summarizer');
    }

    // Cleanup polling on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const startPolling = async (jobId: string, pollUrl?: string, resultUrl?: string) => {
    setIsPolling(true);
    setIsLoading(true);
    setProgress(0);
    setStatus("pending");

    const poll = async () => {
      try {
        let statusResponse: any;
        
        if (pollUrl) {
          statusResponse = await summarizerApi.getJobStatusByUrl(pollUrl);
        } else {
          statusResponse = await summarizerApi.getJobStatus(jobId);
        }

        // Handle both wrapped and direct response structures
        // BaseApiClient returns response.data directly, so statusResponse might be:
        // 1. Direct: { job_id, status, progress, ... }
        // 2. Wrapped: { success: true, data: { job_id, status, progress, ... } }
        let statusData: any;
        
        if (statusResponse.success && statusResponse.data) {
          // Wrapped response
          statusData = statusResponse.data;
        } else if (statusResponse.status || statusResponse.job_id) {
          // Direct response (what backend actually returns)
          statusData = statusResponse;
        } else {
          console.error('Unexpected status response structure:', statusResponse);
          return;
        }

        setProgress(statusData.progress || 0);
        setStatus(statusData.status);
        setStage(statusData.stage || "");

        if (statusData.status === 'completed') {
          // Get the result
          let resultResponse: any;
          
          if (resultUrl) {
            resultResponse = await summarizerApi.getJobResultByUrl(resultUrl);
          } else {
            resultResponse = await summarizerApi.getJobResult(jobId);
          }

          // Handle both wrapped and direct result structures
          // Backend returns: { success: true, job_id, tool_type, input_type, data: { summary, key_points, transcript, bundle, metadata } }
          let resultData: any;
          
          if (resultResponse.success && resultResponse.data) {
            // Wrapped response - extract the data object
            resultData = resultResponse.data;
            // Also preserve top-level metadata like job_id, tool_type, input_type
            if (!resultData.metadata) {
              resultData.metadata = {};
            }
            resultData.metadata.job_id = resultResponse.job_id;
            resultData.metadata.tool_type = resultResponse.tool_type;
            resultData.metadata.input_type = resultResponse.input_type;
            // Extract model_used from metadata if it exists, but prefer top-level if available
            if (resultData.metadata && resultData.metadata.model_used && !resultData.model_used) {
              resultData.model_used = resultData.metadata.model_used;
            }
            // Preserve transcript and bundle data
            if (resultData.transcript) {
              resultData.transcript = resultData.transcript;
            }
            if (resultData.bundle) {
              resultData.bundle = resultData.bundle;
            }
          } else if (resultResponse.data || resultResponse.summary) {
            // Direct response or already parsed
            resultData = resultResponse.data || resultResponse;
          } else {
            resultData = resultResponse;
          }

          const parsedResult = parseSummarizationResult(resultData);
          
          if (parsedResult) {
            // Extract model_used from metadata if not already set
            const modelUsed = parsedResult.model_used || 
                            parsedResult.metadata?.model_used || 
                            resultData.metadata?.model_used || 
                            'unknown';
            
            const displayResult = {
              success: true,
              summary: parsedResult.summary,
              key_points: parsedResult.key_points || [],
              confidence_score: parsedResult.confidence_score || 0.8,
              model_used: modelUsed,
              // Preserve transcript and bundle from resultData (YouTube videos)
              transcript: resultData.transcript || parsedResult.bundle?.article || parsedResult.bundle?.article_text,
              bundle: resultData.bundle || parsedResult.bundle,
              // Include chapters, doc_id, and conversation_id from new response structure
              chapters: resultData.chapters || parsedResult.chapters || [],
              doc_id: resultData.doc_id || parsedResult.doc_id || null,
              conversation_id: resultData.conversation_id || parsedResult.conversation_id || null,
              metadata: {
                ...parsedResult.metadata,
                ...resultData.metadata,
                model_used: modelUsed,
                chat_enabled: !!(resultData.doc_id || parsedResult.doc_id),
                fallback_used: resultData.metadata?.fallback_used || parsedResult.metadata?.fallback_used || false
              },
              source_info: parsedResult.source_info,
              ai_result: parsedResult.ai_result,
              file_info: parsedResult.file_info
            };
            setFinalResult(displayResult);
            setIsPolling(false);
            setIsLoading(false);
            
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
            }
          } else {
            showError("Error", "Failed to parse result");
            setIsPolling(false);
            setIsLoading(false);
            
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
            }
          }
        } else if (statusData.status === 'failed') {
          showError("Error", statusData.error || "Job failed");
          setIsPolling(false);
          setIsLoading(false);
          
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
        // Continue polling on error (might be temporary network issue)
      }
    };

    // Poll immediately
    poll();

    // Then poll every 2 seconds
    pollingIntervalRef.current = setInterval(poll, 2000);
  };

  const getContentTypeIcon = (type: ContentType) => {
    switch (type) {
      case "youtube":
        return Youtube;
      case "pdf":
        return FileText;
      case "audio":
        return Music2;
      case "link":
        return LinkIcon;
      case "text":
        return Type;
      default:
        return FileText;
    }
  };

  const getOriginalContentDisplay = () => {
    if (!resultData) return null;

    const { contentType, originalContent } = resultData;

    switch (contentType) {
      case "youtube":
      case "link":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <LinkIcon className="h-4 w-4" />
              <span>Source URL</span>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <a
                href={originalContent}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all"
              >
                {originalContent}
              </a>
            </div>
            
            <Tabs defaultValue="transcript" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
                <TabsTrigger value="original">Original Text</TabsTrigger>
                <TabsTrigger value="chapter">Chapter</TabsTrigger>
              </TabsList>
              
              <TabsContent value="transcript" className="mt-4">
                {finalResult?.bundle?.json_items && finalResult.bundle.json_items.length > 0 ? (
                  <div className="p-4 bg-muted rounded-lg border max-h-96 overflow-y-auto space-y-2">
                    {finalResult.bundle.json_items.map((item: any, index: number) => (
                      <div key={index} className="pb-2 border-b last:border-b-0">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <span>{formatTime(item.start)}</span>
                          <span>•</span>
                          <span>{formatTime(item.duration)}</span>
                        </div>
                        <p className="text-sm text-foreground">{item.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-muted rounded-lg border max-h-96 overflow-y-auto">
                    <p className="text-sm text-muted-foreground">No transcript segments available</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="original" className="mt-4">
                <div className="p-4 bg-muted rounded-lg border max-h-96 overflow-y-auto">
                  {finalResult?.transcript ? (
                    <p className="text-sm whitespace-pre-wrap text-foreground">{finalResult.transcript}</p>
                  ) : finalResult?.bundle?.article_text ? (
                    <p className="text-sm whitespace-pre-wrap text-foreground">{finalResult.bundle.article_text}</p>
                  ) : finalResult?.bundle?.article ? (
                    <p className="text-sm whitespace-pre-wrap text-foreground">{finalResult.bundle.article}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No original text available</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="chapter" className="mt-4">
                <div className="p-4 bg-muted rounded-lg border max-h-96 overflow-y-auto">
                  {finalResult?.chapters && finalResult.chapters.length > 0 ? (
                    <div className="space-y-3">
                      {finalResult.chapters.map((chapter: any, index: number) => (
                        <div key={index} className="pb-3 border-b last:border-b-0">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm text-foreground">{chapter.title}</h4>
                                {chapter.timestamp && (
                                  <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded">
                                    {chapter.timestamp}
                                  </span>
                                )}
                              </div>
                              {chapter.description && (
                                <p className="text-sm text-muted-foreground">{chapter.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No chapters available</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        );

      case "text":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Type className="h-4 w-4" />
              <span>Original Text</span>
            </div>
            <div className="p-4 bg-muted rounded-lg max-h-96 overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap text-foreground">{originalContent}</p>
            </div>
          </div>
        );

      case "pdf":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>Document</span>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium text-foreground">{originalContent}</p>
              {finalResult?.file_info && (
                <div className="mt-2 text-xs text-muted-foreground">
                  <p>File processed successfully</p>
                </div>
              )}
            </div>
          </div>
        );

      case "audio":
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Music2 className="h-4 w-4" />
              <span>Media File</span>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium text-foreground">{originalContent}</p>
            </div>
            
            <Tabs defaultValue="transcript" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="transcript">Transcript</TabsTrigger>
                <TabsTrigger value="original">Original Text</TabsTrigger>
                <TabsTrigger value="chapter">Chapter</TabsTrigger>
              </TabsList>
              
              <TabsContent value="transcript" className="mt-4">
                {finalResult?.bundle?.json_items && finalResult.bundle.json_items.length > 0 ? (
                  <div className="p-4 bg-muted rounded-lg border max-h-96 overflow-y-auto space-y-2">
                    {finalResult.bundle.json_items.map((item: any, index: number) => (
                      <div key={index} className="pb-2 border-b last:border-b-0">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <span>{formatTime(item.start)}</span>
                          <span>•</span>
                          <span>{formatTime(item.duration)}</span>
                        </div>
                        <p className="text-sm text-foreground">{item.text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-muted rounded-lg border max-h-96 overflow-y-auto">
                    <p className="text-sm text-muted-foreground">No transcript segments available</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="original" className="mt-4">
                <div className="p-4 bg-muted rounded-lg border max-h-96 overflow-y-auto">
                  {finalResult?.transcript ? (
                    <p className="text-sm whitespace-pre-wrap text-foreground">{finalResult.transcript}</p>
                  ) : finalResult?.bundle?.article_text ? (
                    <p className="text-sm whitespace-pre-wrap text-foreground">{finalResult.bundle.article_text}</p>
                  ) : finalResult?.bundle?.article ? (
                    <p className="text-sm whitespace-pre-wrap text-foreground">{finalResult.bundle.article}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">No original text available</p>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="chapter" className="mt-4">
                <div className="p-4 bg-muted rounded-lg border max-h-96 overflow-y-auto">
                  {finalResult?.chapters && finalResult.chapters.length > 0 ? (
                    <div className="space-y-3">
                      {finalResult.chapters.map((chapter: any, index: number) => (
                        <div key={index} className="pb-3 border-b last:border-b-0">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-sm">
                              {index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-sm text-foreground">{chapter.title}</h4>
                                {chapter.timestamp && (
                                  <span className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded">
                                    {chapter.timestamp}
                                  </span>
                                )}
                              </div>
                              {chapter.description && (
                                <p className="text-sm text-muted-foreground">{chapter.description}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No chapters available</p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        );

      default:
        return null;
    }
  };

  // Initialize conversation ID from finalResult
  useEffect(() => {
    if (finalResult?.conversation_id) {
      setConversationId(finalResult.conversation_id);
    }
  }, [finalResult]);

  // Generate mind map
  const handleGenerateMindMap = async () => {
    if (!finalResult) return;

    const articleText = finalResult.bundle?.article_text || 
                       finalResult.bundle?.article || 
                       finalResult.transcript || 
                       finalResult.summary;

    if (!articleText) {
      showError("Error", "No article text available for mind map generation");
      return;
    }

    // Validate article text length
    const textToUse = articleText.trim();
    if (textToUse.length < 50) {
      showError("Error", "Article text is too short. Please ensure the document has sufficient content.");
      return;
    }

    setIsGeneratingMindMap(true);
    setMindMapError(null);
    setMindMapImageUrl(null);
    setMindMapRotation(0); // Reset rotation when generating new
    setMindMapZoom(100); // Reset zoom when generating new
    setIsMindMapFullscreen(false); // Exit fullscreen when generating new

    try {
      // Create a concise prompt - prefer summary if available, otherwise use article text
      // Limit to reasonable length to avoid validation errors
      const contentToUse = finalResult.summary 
        ? finalResult.summary.substring(0, 1500)
        : textToUse.substring(0, 1500);
      
      // Format prompt similar to diagrams page - clear and direct
      const promptText = `Create a mind map showing the main topics and relationships from the following content:\n\n${contentToUse}`;

      const response = await diagramApi.generate({
        prompt: promptText.trim(),
        diagram_type: "mindmap",
        language: "en"
      });

      const responseData = (response as any).data || response;
      const jobId = responseData.job_id || response.job_id;
      const pollUrl = responseData.poll_url || response.poll_url;
      const resultUrl = responseData.result_url || response.result_url;

      if (jobId) {
        // Poll for result
        const poll = async () => {
          try {
            let statusResponse: any;
            if (pollUrl) {
              statusResponse = await diagramApi.getJobStatusByUrl(pollUrl);
            } else {
              statusResponse = await diagramApi.getJobStatus(jobId);
            }

            const statusData = (statusResponse as any).data || statusResponse;
            if (statusData.status === 'completed') {
              let resultResponse: any;
              if (resultUrl) {
                resultResponse = await diagramApi.getJobResultByUrl(resultUrl);
              } else {
                resultResponse = await diagramApi.getJobResult(jobId);
              }

              const resultData = (resultResponse as any).data || resultResponse;
              const diagramData = resultData.data || resultData;

              if (diagramData?.image_url) {
                setMindMapImageUrl(diagramData.image_url);
                showSuccess("Success", "Mind map generated successfully!");
              } else {
                setMindMapError("No image URL found in result");
                showError("Error", "Failed to get mind map image");
              }
              setIsGeneratingMindMap(false);
            } else if (statusData.status === 'failed') {
              setMindMapError(statusData.error || "Generation failed");
              showError("Error", statusData.error || "Mind map generation failed");
              setIsGeneratingMindMap(false);
            } else {
              // Continue polling
              setTimeout(poll, 2500);
            }
          } catch (error: any) {
            console.error('Mind map polling error:', error);
            
            // Extract error message from API response
            let errorMessage = "Polling failed";
            
            if (error?.response?.data) {
              const errorData = error.response.data;
              if (errorData.message) {
                errorMessage = errorData.message;
              } else if (errorData.error) {
                errorMessage = errorData.error;
              }
            } else if (error instanceof Error) {
              errorMessage = error.message;
            }
            
            setMindMapError(errorMessage);
            showError("Error", errorMessage);
            setIsGeneratingMindMap(false);
          }
        };

        poll();
      } else {
        setMindMapError("No job ID received");
        setIsGeneratingMindMap(false);
      }
    } catch (error: any) {
      console.error('Mind map generation error:', error);
      
      // Extract error message from API response
      let errorMessage = "Failed to generate mind map";
      
      if (error?.response?.data) {
        const errorData = error.response.data;
        
        // Handle validation errors (422)
        if (error.response.status === 422) {
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.messages) {
            // Laravel validation errors
            const messages = errorData.messages;
            if (typeof messages === 'object') {
              const firstError = Object.values(messages)[0];
              errorMessage = Array.isArray(firstError) ? firstError[0] : String(firstError);
            } else {
              errorMessage = String(messages);
            }
          } else if (typeof errorData === 'string') {
            errorMessage = errorData;
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      setMindMapError(errorMessage);
      showError("Error", errorMessage);
      setIsGeneratingMindMap(false);
    }
  };

  // Send chat message
  const handleSendChat = async () => {
    if (!chatInput.trim() || !finalResult?.doc_id) return;

    setIsSendingChat(true);
    const userMessage = chatInput.trim();
    setChatInput("");

    // Add user message to chat
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const request: DocumentChatRequest = {
        doc_id: finalResult.doc_id,
        query: userMessage,
        conversation_id: conversationId || undefined,
        llm_model: "deepseek-chat",
        max_tokens: 512,
        top_k: 3
      };

      const response = await documentChatApi.chat(request);
      const responseData = (response as any).data || response;

      if (responseData.success) {
        // Update conversation ID
        if (responseData.conversation_id) {
          setConversationId(responseData.conversation_id);
        }

        // Add assistant response
        setChatMessages(prev => [...prev, { role: 'assistant', content: responseData.answer }]);
      } else {
        showError("Error", "Failed to get response");
        setChatMessages(prev => prev.slice(0, -1)); // Remove user message on error
      }
    } catch (error) {
      console.error('Chat error:', error);
      showError("Error", error instanceof Error ? error.message : "Failed to send message");
      setChatMessages(prev => prev.slice(0, -1)); // Remove user message on error
    } finally {
      setIsSendingChat(false);
    }
  };

  // Check if chat is available
  const isChatAvailable = finalResult?.doc_id && finalResult.doc_id !== null;

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess("Success", "Copied to clipboard!");
    } catch (error) {
      showError("Error", "Failed to copy");
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExport = () => {
    if (!finalResult?.summary) return;
    
    const blob = new Blob([finalResult.summary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showSuccess("Success", "Summary exported!");
  };

  if (!resultData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  const ContentIcon = getContentTypeIcon(resultData.contentType);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/summarizer')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Summarizer
          </Button>
          <div className="flex items-center gap-3">
            <ContentIcon className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Summary Result</h1>
          </div>
        </div>

        {/* Progress Bar */}
        {isPolling && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span className="font-medium">Processing...</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                {stage && (
                  <p className="text-sm text-muted-foreground">{stage}</p>
                )}
                {status && (
                  <p className="text-xs text-muted-foreground">Status: {status}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Split Screen Layout */}
        {finalResult && !isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Side - Original Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ContentIcon className="h-5 w-5" />
                  Original Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                {getOriginalContentDisplay()}
              </CardContent>
            </Card>

            {/* Right Side - Summary */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Summary
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(finalResult.summary)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExport}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="mindmap">AI Mindmap</TabsTrigger>
                    <TabsTrigger value="chat">AI Chat</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="summary" className="mt-4 space-y-4">
                    {/* Summary Content */}
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                        {finalResult.summary}
                      </p>
                    </div>

                    {/* Key Points */}
                    {finalResult.key_points && finalResult.key_points.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm text-foreground">Key Points</h4>
                        <ul className="space-y-2">
                          {finalResult.key_points.map((point: string, index: number) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <span className="text-primary mt-1">•</span>
                              <span className="text-foreground">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Metadata */}
                    {finalResult.metadata && (
                      <div className="pt-4 border-t space-y-2 text-xs text-muted-foreground">
                        {finalResult.model_used && (
                          <p>Model: {finalResult.model_used}</p>
                        )}
                        {finalResult.confidence_score && (
                          <p>Confidence: {(finalResult.confidence_score * 100).toFixed(1)}%</p>
                        )}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="mindmap" className="mt-4">
                    <div className="space-y-4">
                      {!mindMapImageUrl && !isGeneratingMindMap && (
                        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
                          <Network className="h-12 w-12 text-muted-foreground" />
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-foreground">
                              Generate a mind map from this document
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Create a visual representation of the key concepts and relationships
                            </p>
                          </div>
                          <Button
                            onClick={handleGenerateMindMap}
                            disabled={isGeneratingMindMap}
                            className="mt-4"
                          >
                            {isGeneratingMindMap ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Network className="mr-2 h-4 w-4" />
                                Generate Mind Map
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {isGeneratingMindMap && (
                        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
                          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-foreground">
                              Generating your mind map...
                            </p>
                            <p className="text-xs text-muted-foreground">
                              This may take 30-120 seconds
                            </p>
                          </div>
                        </div>
                      )}

                      {mindMapError && (
                        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-destructive">Error</p>
                              <p className="text-xs text-destructive/80 mt-1">{mindMapError}</p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGenerateMindMap}
                            className="mt-3"
                          >
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Try Again
                          </Button>
                        </div>
                      )}

                      {mindMapImageUrl && (
                        <>
                          <div className="space-y-4">
                            <div className="relative w-full bg-muted rounded-lg overflow-auto border border-border flex items-center justify-center min-h-[300px] max-h-[600px]">
                              <img
                                src={mindMapImageUrl}
                                alt="Generated mind map"
                                className="object-contain transition-transform duration-300 cursor-zoom-in"
                                style={{ 
                                  transform: `rotate(${mindMapRotation}deg) scale(${mindMapZoom / 100})`,
                                  maxWidth: '100%',
                                  maxHeight: '100%'
                                }}
                                onError={() => {
                                  setMindMapError("Failed to load image");
                                  showError("Error", "Failed to load mind map image");
                                }}
                                onClick={() => setIsMindMapFullscreen(true)}
                              />
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const link = document.createElement("a");
                                  link.href = mindMapImageUrl;
                                  link.download = `mindmap-${Date.now()}.png`;
                                  link.click();
                                }}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setMindMapZoom(prev => Math.min(prev + 25, 300))}
                                title="Zoom in"
                              >
                                <ZoomIn className="h-4 w-4 mr-2" />
                                Zoom In
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setMindMapZoom(prev => Math.max(prev - 25, 25))}
                                title="Zoom out"
                              >
                                <ZoomOut className="h-4 w-4 mr-2" />
                                Zoom Out
                              </Button>
                              {mindMapZoom !== 100 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setMindMapZoom(100)}
                                  title="Reset zoom"
                                >
                                  {mindMapZoom}%
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setMindMapRotation(prev => (prev - 90) % 360)}
                                title="Rotate left 90°"
                              >
                                <RotateCcw className="h-4 w-4 mr-2" />
                                Rotate Left
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setMindMapRotation(prev => (prev + 90) % 360)}
                                title="Rotate right 90°"
                              >
                                <RotateCw className="h-4 w-4 mr-2" />
                                Rotate Right
                              </Button>
                              {mindMapRotation !== 0 && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setMindMapRotation(0)}
                                  title="Reset rotation"
                                >
                                  Reset Rotate
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setIsMindMapFullscreen(true)}
                                title="Fullscreen"
                              >
                                <Maximize2 className="h-4 w-4 mr-2" />
                                Fullscreen
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleGenerateMindMap}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Regenerate
                              </Button>
                            </div>
                          </div>

                          {/* Fullscreen Modal */}
                          {isMindMapFullscreen && (
                            <div 
                              className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
                              onClick={() => setIsMindMapFullscreen(false)}
                            >
                              <div className="relative w-full h-full flex items-center justify-center">
                                <img
                                  src={mindMapImageUrl}
                                  alt="Generated mind map - Fullscreen"
                                  className="max-w-full max-h-full object-contain transition-transform duration-300"
                                  style={{ 
                                    transform: `rotate(${mindMapRotation}deg) scale(${mindMapZoom / 100})`
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="absolute top-4 right-4 bg-background/80 backdrop-blur-sm"
                                  onClick={() => setIsMindMapFullscreen(false)}
                                >
                                  <Minimize2 className="h-4 w-4 mr-2" />
                                  Exit Fullscreen
                                </Button>
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-background/80 backdrop-blur-sm rounded-lg p-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setMindMapZoom(prev => Math.max(prev - 25, 25));
                                    }}
                                  >
                                    <ZoomOut className="h-4 w-4" />
                                  </Button>
                                  <span className="px-3 py-1.5 text-sm flex items-center">
                                    {mindMapZoom}%
                                  </span>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setMindMapZoom(prev => Math.min(prev + 25, 300));
                                    }}
                                  >
                                    <ZoomIn className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setMindMapRotation(prev => (prev - 90) % 360);
                                    }}
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setMindMapRotation(prev => (prev + 90) % 360);
                                    }}
                                  >
                                    <RotateCw className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="chat" className="mt-4">
                    <div className="space-y-4">
                      {!isChatAvailable ? (
                        <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
                          <AlertCircle className="h-12 w-12 text-muted-foreground" />
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-foreground">
                              Chat not available
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Document chat is only available when the document was processed with Document Intelligence.
                              {finalResult?.metadata?.fallback_used && (
                                <span className="block mt-2">
                                  AI Manager fallback was used, so chat is not available for this document.
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Chat Messages */}
                          <div className="p-4 bg-muted rounded-lg border min-h-[300px] max-h-[400px] overflow-y-auto space-y-4">
                            {chatMessages.length === 0 ? (
                              <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
                                <MessageSquare className="h-8 w-8 text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">
                                  Start a conversation about this document
                                </p>
                              </div>
                            ) : (
                              chatMessages.map((message, index) => (
                                <div
                                  key={index}
                                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                  <div
                                    className={`max-w-[80%] rounded-lg p-3 ${
                                      message.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-background border border-border'
                                    }`}
                                  >
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                  </div>
                                </div>
                              ))
                            )}
                            {isSendingChat && (
                              <div className="flex justify-start">
                                <div className="bg-background border border-border rounded-lg p-3">
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Chat Input */}
                          <div className="flex gap-2">
                            <Textarea
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendChat();
                                }
                              }}
                              placeholder="Ask a question about this document..."
                              className="min-h-[60px] resize-none"
                              rows={2}
                              disabled={isSendingChat || !isChatAvailable}
                            />
                            <Button
                              onClick={handleSendChat}
                              disabled={!chatInput.trim() || isSendingChat || !isChatAvailable}
                              className="self-end"
                            >
                              {isSendingChat ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {isLoading && !isPolling && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

