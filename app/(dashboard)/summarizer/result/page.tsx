"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { summarizerApi } from "@/lib/api";
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
  RefreshCw
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { JobStatusResponse, JobResultResponse } from "@/lib/types/api";

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
              metadata: {
                ...parsedResult.metadata,
                ...resultData.metadata,
                model_used: modelUsed
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
                  <p className="text-sm text-muted-foreground">Chapter feature coming soon...</p>
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
                  <p className="text-sm text-muted-foreground">Chapter feature coming soon...</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        );

      default:
        return null;
    }
  };

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
                    <div className="p-4 bg-muted rounded-lg border min-h-[400px] flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">AI Mindmap feature coming soon...</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="chat" className="mt-4">
                    <div className="p-4 bg-muted rounded-lg border min-h-[400px] flex items-center justify-center">
                      <p className="text-sm text-muted-foreground">AI Chat feature coming soon...</p>
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

