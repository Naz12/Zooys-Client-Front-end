"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import LinkInput from "@/components/ui/link-input";
import ResultDisplay, { SummaryResult } from "@/components/ui/result-display";
import { summarizeApi, aiToolsApi, type SummarizeRequest, type SummarizeResponse, type AsyncSummarizeResponse, type JobStatusResponse, type JobResultResponse } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications";
import { Youtube, ArrowLeft, Settings, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import BackendStatus from "@/components/backend-status";

export default function YouTubeSummarizerPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  
  const [language, setLanguage] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [result, setResult] = useState<SummaryResult | null>(null);
  
  // Async polling state
  const [isPolling, setIsPolling] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState(0);
  const [jobStatus, setJobStatus] = useState<string>("");
  const [jobLogs, setJobLogs] = useState<string[]>([]);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Cleanup polling on component unmount
  useEffect(() => {
    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, []);

  // Polling function for async job status with retry logic
  const pollJobStatus = async (jobId: string, currentRetry: number = 0): Promise<void> => {
    try {
      const statusResponse = await summarizeApi.getJobStatus(jobId);
      console.log('Job status:', statusResponse);
      
      // Reset retry count on successful request
      setRetryCount(0);
      
      // Handle the actual backend response structure
      const responseData = statusResponse.data || statusResponse;
      
      // Extract progress (handle both direct progress and nested structure)
      const progress = responseData.progress || 0;
      setJobProgress(progress);
      
      // Extract status message
      const statusMessage = responseData.stage || responseData.status || "Processing...";
      setJobStatus(statusMessage);
      
      // Extract and format logs
      const rawLogs = responseData.logs || [];
      const formattedLogs = rawLogs.map((log: any) => {
        if (typeof log === 'string') {
          return log;
        } else if (log.message) {
          return `[${log.level || 'info'}] ${log.message}`;
        }
        return JSON.stringify(log);
      });
      setJobLogs(formattedLogs);
      
      if (responseData.status === 'completed') {
        // Get the final result
        const resultResponse = await summarizeApi.getJobResult(jobId);
        console.log('Job result:', resultResponse);
        
        // Handle the actual result structure
        const resultData = resultResponse.data || resultResponse;
        const result = resultData.result || resultData;
        
        if (result) {
          // Extract summary from various possible locations
          const summary = result.summary || 
                         result.data?.summary || 
                         result.ai_result?.result_data?.summary ||
                         result.result_data?.summary;
          
          if (summary && summary.trim()) {
            const summaryResult: SummaryResult = {
              id: Date.now().toString(),
              content: summary,
              contentType: "youtube",
              source: {
                title: result.data?.source_info?.title || 
                       result.source_info?.title || 
                       result.ai_result?.title || 
                       "YouTube Video",
                url: result.data?.source_info?.url || 
                     result.source_info?.url || 
                     inputValue,
                author: result.data?.source_info?.author || 
                        result.source_info?.author,
                views: result.data?.source_info?.published_date || 
                       result.source_info?.published_date,
              },
              metadata: {
                processingTime: parseFloat((result.data?.metadata?.processing_time || 
                                          result.metadata?.processing_time || 
                                          '0s').replace(/[^\d.]/g, '')),
                wordCount: result.data?.source_info?.word_count || 
                          result.source_info?.word_count || 0,
                confidence: result.data?.metadata?.confidence || 
                           result.metadata?.confidence || 0.95,
                language: language
              },
              timestamp: new Date()
            };
            
            setResult(summaryResult);
            showSuccess("Success", "YouTube video summarized successfully!");
          } else {
            showError("Error", "No summary content was generated. The video might be too short or have no audio content.");
          }
        } else {
          showError("Error", resultData.error || resultResponse.error || "Failed to get job result.");
        }
        
        // Stop polling
        setIsPolling(false);
        setIsLoading(false);
        setCurrentJobId(null);
        setRetryCount(0);
        
      } else if (responseData.status === 'failed') {
        showError("Error", resultData.error || responseData.error || "Job failed during processing.");
        setIsPolling(false);
        setIsLoading(false);
        setCurrentJobId(null);
        setRetryCount(0);
        
      } else {
        // Continue polling every 2 seconds
        pollingTimeoutRef.current = setTimeout(() => pollJobStatus(jobId, 0), 2000);
      }
      
    } catch (error) {
      console.error('Polling error:', error);
      
      // Handle network errors with retry logic
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        if (currentRetry < maxRetries) {
          console.log(`Retrying polling request (${currentRetry + 1}/${maxRetries})...`);
          setRetryCount(currentRetry + 1);
          setJobStatus(`Connection issue - Retrying... (${currentRetry + 1}/${maxRetries})`);
          
          // Exponential backoff: 2s, 4s, 8s
          const retryDelay = Math.pow(2, currentRetry) * 2000;
          pollingTimeoutRef.current = setTimeout(() => pollJobStatus(jobId, currentRetry + 1), retryDelay);
          return;
        } else {
          showError("Connection Error", "Lost connection to the server. The job may still be processing in the background. Please refresh the page to check status.");
        }
      } else {
        showError("Error", `Failed to check job status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Stop polling after max retries or non-network errors
      setIsPolling(false);
      setIsLoading(false);
      setCurrentJobId(null);
      setRetryCount(0);
    }
  };

  const handleSummarize = async () => {
    if (!user) {
      showError("Error", "Please log in to use this feature");
      return;
    }

    if (!inputValue.trim()) {
      showError("Error", "Please enter a YouTube URL");
      return;
    }

    // Validate YouTube URL (including Shorts)
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)[\w-]+/;
    if (!youtubeRegex.test(inputValue.trim())) {
      showError("Error", "Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=... or https://www.youtube.com/shorts/...)");
      return;
    }

    setIsLoading(true);
    setResult(null);
    setJobProgress(0);
    setJobStatus("");
    setJobLogs([]);

    try {
      const request: SummarizeRequest = {
        content_type: "link",
        source: {
          type: "url",
          data: inputValue.trim()
        },
        options: {
          mode: "detailed",
          language: language,
          focus: "summary"
        }
      };

      console.log('Starting async YouTube summarization:', request);
      
      // Start async job
      const asyncResponse: AsyncSummarizeResponse = await summarizeApi.summarizeAsync(request);
      console.log('Async job started:', asyncResponse);
      
      if (asyncResponse.job_id) {
        setCurrentJobId(asyncResponse.job_id);
        setIsPolling(true);
        setJobStatus("Job started successfully");
        
        // Start polling for job completion
        await pollJobStatus(asyncResponse.job_id);
      } else {
        showError("Error", "Failed to start async job. Please try again.");
        setIsLoading(false);
      }
      
    } catch (error) {
      console.error("Async summarization error:", error);
      
      // Check for specific error types
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          showError("Connection Error", "Cannot connect to the backend server. Please ensure the server is running on http://localhost:8000");
        } else if (error.message.includes('CORS') || error.message.includes('blocked by CORS policy')) {
          showError("CORS Configuration Error", "The backend server is running but CORS is not configured properly.\n\nTo fix this:\n1. The backend needs to allow requests from http://localhost:3000\n2. Add CORS middleware to your backend server\n3. See the CORS setup guide in md/backend-cors-setup.md\n\nThis is a backend configuration issue, not a frontend problem.");
        } else {
          showError("Error", error.message);
        }
      } else {
        showError("Error", "Failed to start YouTube summarization. Please check your connection and try again.");
      }
      
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    handleSummarize();
  };

  const handleExport = (format: "text" | "pdf" | "markdown") => {
    console.log(`Exporting as ${format}`);
  };

  const handleShare = () => {
    console.log("Sharing result");
  };

  return (
    <>

      {/* Main Content */}
      <div className="space-y-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Backend Status */}
          <BackendStatus />
          {/* Input Card */}
          <Card className="bg-card border border-border rounded-xl shadow-md">
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">Summarize YouTube Video</h2>
                  <p className="text-muted-foreground">
                    Paste any YouTube URL to get an AI-powered summary
                  </p>
                </div>

                {/* Language Selection */}
                <div className="flex items-center justify-center space-x-4">
                  <label className="text-sm font-medium">Language:</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="it">Italian</option>
                    <option value="pt">Portuguese</option>
                    <option value="ru">Russian</option>
                    <option value="zh">Chinese</option>
                    <option value="ja">Japanese</option>
                    <option value="ko">Korean</option>
                  </select>
                </div>

                {/* URL Input */}
                <LinkInput
                  value={inputValue}
                  onChange={setInputValue}
                  placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=... or https://www.youtube.com/shorts/...)"
                />

                {/* Summarize Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={handleSummarize}
                    disabled={isLoading || isPolling || !inputValue.trim()}
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white px-8 py-2"
                  >
                    {isLoading || isPolling ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        {isPolling ? `Processing... ${jobProgress}%` : "Starting Job..."}
                      </>
                    ) : (
                      <>
                        <Brain className="mr-2 h-4 w-4" />
                        Summarize Video
                      </>
                    )}
                  </Button>
                </div>

                {/* Progress Indicator */}
                {isPolling && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{jobProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${jobProgress}%` }}
                      />
                    </div>
                    {jobStatus && (
                      <div className="text-sm text-muted-foreground text-center">
                        {jobStatus}
                      </div>
                    )}
                    {jobLogs.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                        <div className="text-xs text-muted-foreground mb-2">Processing Logs:</div>
                        {jobLogs.map((log, index) => (
                          <div key={index} className="text-xs text-gray-600 mb-1">
                            {log}
                          </div>
                        ))}
                      </div>
                    )}
                    {isPolling && (
                      <div className="flex justify-center mt-3">
                        <Button
                          onClick={() => {
                            if (pollingTimeoutRef.current) {
                              clearTimeout(pollingTimeoutRef.current);
                              pollingTimeoutRef.current = null;
                            }
                            setIsPolling(false);
                            setIsLoading(false);
                            setCurrentJobId(null);
                            setJobProgress(0);
                            setJobStatus("");
                            setJobLogs([]);
                            setRetryCount(0);
                          }}
                          variant="outline"
                          size="sm"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                        >
                          Cancel Processing
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Features Card */}
          <Card className="bg-muted/30 border border-border rounded-xl">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">What You'll Get</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Key Points</h4>
                    <p className="text-xs text-muted-foreground">Main topics and insights</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Timestamps</h4>
                    <p className="text-xs text-muted-foreground">Important moments in video</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Transcription</h4>
                    <p className="text-xs text-muted-foreground">Full video transcript</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Summary</h4>
                    <p className="text-xs text-muted-foreground">Concise overview</p>
                  </div>
                </div>
              </div>
              
              {/* Async Processing Benefits */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-blue-900">Async Processing</h4>
                    <p className="text-xs text-blue-700 mt-1">
                      No more timeouts! Long videos are processed asynchronously with real-time progress updates. 
                      You can see exactly what's happening during processing.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Display */}
          {result && (
            <ResultDisplay
              result={result}
              onRegenerate={handleRegenerate}
              onExport={handleExport}
              onShare={handleShare}
              showMetadata={true}
              showActions={true}
            />
          )}
        </div>
      </div>
    </>
  );
}
