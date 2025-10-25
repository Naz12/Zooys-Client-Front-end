"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import FileUpload, { FileUploadItem } from "@/components/ui/file-upload";
import MediaUpload, { MediaUploadItem } from "@/components/ui/media-upload";
import LinkInput from "@/components/ui/link-input";
import TextInput from "@/components/ui/text-input";
import PasswordInput from "@/components/ui/password-input";
import ResultDisplay, { SummaryResult } from "@/components/ui/result-display";
import UniversalResultDisplay from "@/components/universal-result-display";
import { summarizeApi, specializedSummarizeApi, type SummarizeRequest, type SummarizeResponse, type AsyncSummarizeResponse, type JobStatusResponse, type JobResultResponse } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications";
import {
  Youtube,
  FileText,
  Music2,
  Link as LinkIcon,
  Type,
  Brain,
  ArrowLeft,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type ContentType = "youtube" | "pdf" | "audio" | "link" | "text";

export default function SummarizerPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  
  const [activeContentType, setActiveContentType] = useState<ContentType>("youtube");
  const [language, setLanguage] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [pollingStatus, setPollingStatus] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadItem[]>([]);
  const [uploadedMedia, setUploadedMedia] = useState<MediaUploadItem[]>([]);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [uploadedFileIds, setUploadedFileIds] = useState<number[]>([]);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [pendingPasswordRequest, setPendingPasswordRequest] = useState<SummarizeRequest | null>(null);

  const contentTypes = [
    { id: "youtube" as ContentType, label: "YouTube", icon: Youtube },
    { id: "pdf" as ContentType, label: "PDF & Documents", icon: FileText },
    { id: "audio" as ContentType, label: "Audio & Video", icon: Music2 },
    { id: "link" as ContentType, label: "Link", icon: LinkIcon },
    { id: "text" as ContentType, label: "Long Text", icon: Type },
  ];

  const handleSummarize = async () => {
    if (!user) {
      showError("Error", "Please log in to use this feature");
      return;
    }

    const hasContent = inputValue.trim() || uploadedFiles.length > 0 || uploadedMedia.length > 0;
    if (!hasContent) {
      showError("Error", "Please provide content to summarize");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      let request: SummarizeRequest;

      switch (activeContentType) {
        case "youtube":
        case "link":
          request = {
            content_type: "link",
            source: {
              type: "url",
              data: inputValue.trim()
            },
            options: {
              mode: "bundle",
              language: language,
              focus: "summary"
            }
          };
          break;

        case "text":
          request = {
            content_type: "text",
            source: {
              type: "text",
              data: inputValue.trim()
            },
            options: {
              mode: "detailed",
              language: language,
              focus: "summary"
            }
          };
          break;

        case "pdf":
        case "audio":
          if (uploadedFileIds.length === 0) {
            showError("Error", "Please upload a file first");
            setIsLoading(false);
            return;
          }
          request = {
            content_type: activeContentType, // 'pdf' or 'audio'
            source: {
              type: "file",
              data: uploadedFileIds[0].toString()
            },
            options: {
              mode: "detailed",
              language: language,
              focus: "summary"
            }
          };
          break;

        default:
          showError("Error", "Invalid content type");
          setIsLoading(false);
          return;
      }

      // Start async job using specialized endpoints
      let asyncResp: AsyncSummarizeResponse;
      
      switch (activeContentType) {
        case "text":
          asyncResp = await specializedSummarizeApi.startTextJob(
            request.source.data,
            request.options
          );
          break;
          
        case "link":
          asyncResp = await specializedSummarizeApi.startLinkJob(
            request.source.data,
            request.options
          );
          break;
          
        case "pdf":
        case "audio":
          // For file uploads, we need to get the actual file
          if (uploadedFiles.length === 0) {
            showError("Error", "Please upload a file first");
            setIsLoading(false);
            return;
          }
          
          // Get the first uploaded file
          const firstFile = uploadedFiles[0];
          if (!firstFile.file) {
            showError("Error", "File object not available");
            setIsLoading(false);
            return;
          }
          
          // Use specialized file endpoint with the actual File object
          if (activeContentType === "pdf") {
            asyncResp = await specializedSummarizeApi.startFileJob(
              firstFile.file,
              request.options
            );
          } else if (activeContentType === "audio") {
            asyncResp = await specializedSummarizeApi.startAudioVideoJob(
              firstFile.file,
              request.options
            );
          } else {
            // Fallback to generic file endpoint
            asyncResp = await specializedSummarizeApi.startFileJob(
              firstFile.file,
              request.options
            );
          }
          break;
          
        default:
          // Fall back to generic endpoint for unsupported types
          asyncResp = await summarizeApi.summarizeAsync(request);
          break;
      }

      // Start polling with status updates
      setIsPolling(true);
      setPollingStatus("Job started, waiting for processing...");

      // Poll status until completed/failed (with exponential backoff for network errors)
      let finalSummary: SummarizeResponse | null = null;
      let attempts = 0;
      let delayMs = 2500; // Start with 2.5 seconds
      while (attempts < 60) { // ~3 minutes max (60 * 3s) - backend completes in ~33 seconds
        try {
          const status: JobStatusResponse = asyncResp.poll_url
            ? await specializedSummarizeApi.getJobStatusByUrl(asyncResp.poll_url)
            : await specializedSummarizeApi.getJobStatus(asyncResp.job_id);
          
          // Debug logging to see what status we're getting
          console.log(`Status check ${attempts + 1}:`, status);
          
          if (status.status === 'completed') {
            setPollingStatus("Processing completed, retrieving results...");
            const result: JobResultResponse = asyncResp.result_url
              ? await specializedSummarizeApi.getJobResultByUrl(asyncResp.result_url)
              : await specializedSummarizeApi.getJobResult(asyncResp.job_id);
            
            // Debug logging to see what result we're getting
            console.log('Result response:', result);
            console.log('Result.result:', result.result);
            console.log('Result.data:', result.data);
            
            // Fix: Handle different response structures for different input types
            if (result.data) {
              // Check if it's a text summary response
              if ('key_points' in result.data && 'confidence_score' in result.data) {
                // Text summary response
                finalSummary = {
                  summary: result.data.summary,
                  key_points: result.data.key_points,
                  confidence_score: result.data.confidence_score,
                  model_used: result.data.model_used
                };
              }
              // Check if it's a YouTube summary response
              else if ('bundle' in result.data || 'ai_result' in result.data) {
                // YouTube summary response - use the existing YouTube result display
                finalSummary = result.data;
              }
              // Check if it's a simple summary response
              else if ('summary' in result.data) {
                // Simple summary response
                finalSummary = {
                  summary: result.data.summary,
                  key_points: [],
                  confidence_score: 0,
                  model_used: 'unknown'
                };
              }
              // Fallback for other response types
              else {
                finalSummary = result.data;
              }
            } else {
              finalSummary = null;
            }
            
            console.log('Final summary set:', finalSummary);
            break;
          }
          if (status.status === 'failed') {
            throw new Error(status.error || 'Summarization failed');
          }
          
          // Update polling status with progress info
          const progressPercent = Math.round((attempts / 60) * 100);
          setPollingStatus(`Processing... Status: ${status.status}, Progress: ${status.progress || 0}%, Stage: ${status.stage || 'unknown'} (${progressPercent}% of max time elapsed, attempt ${attempts + 1}/60)`);
          
          // Use variable delay: 2-3 seconds for normal polling
          const pollDelay = Math.random() * 500 + 1500; // 1500-2000ms - faster polling
          await new Promise(r => setTimeout(r, pollDelay));
          attempts++;
          continue;
        } catch (err) {
          // Connection refused or other fetch/network error: backoff
          setPollingStatus(`Connection issue, retrying in ${Math.round(delayMs/1000)}s... (attempt ${attempts + 1}/300)`);
          await new Promise(r => setTimeout(r, delayMs));
          delayMs = Math.min(10000, Math.floor(delayMs * 1.5));
          attempts++;
          continue;
        }
      }

      if (!finalSummary) {
        throw new Error('Timed out waiting for summarization result after 3 minutes. The content might be very large or complex. Please try with smaller content or contact support if the issue persists.');
      }

      const response: SummarizeResponse = finalSummary;
      
      // Handle API errors
      if (response.error) {
        // Check if it's a password-protected PDF error
        if (response.error.includes("password-protected") && activeContentType === "pdf") {
          setPendingPasswordRequest(request);
          setShowPasswordInput(true);
          return;
        }
        
        showError("Error", response.error);
        return;
      }

      if (!response.summary) {
        showError("Error", "No summary generated");
        return;
      }
      
      const summaryResult: SummaryResult = {
        id: Date.now().toString(),
        content: response.summary,
        contentType: activeContentType,
        source: activeContentType === "youtube" || activeContentType === "link" ? {
          title: response.source_info?.title || "Content Title",
          url: response.source_info?.url || inputValue,
          author: response.source_info?.author,
          views: response.source_info?.published_date, // Using published_date for views as a mock
        } : activeContentType === "pdf" ? {
          title: response.source_info?.title,
          author: response.source_info?.author,
        } : undefined,
        metadata: {
          processingTime: response.metadata?.processing_time ? parseFloat(response.metadata.processing_time.replace('s', '')) : 0,
          wordCount: response.source_info?.word_count || 0,
          confidence: response.metadata?.confidence || 0,
          language: language
        },
        timestamp: new Date()
      };

      setResult(summaryResult);
      showSuccess("Success", "Content summarized successfully!");
    } catch (error) {
      console.error("Summarization error:", error);
      showError("Error", error instanceof Error ? error.message : "Failed to summarize content");
    } finally {
      setIsLoading(false);
      setIsPolling(false);
      setPollingStatus("");
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    if (!pendingPasswordRequest) return;

    setIsLoading(true);
    setShowPasswordInput(false);

    try {
      // Add password to the request
      const requestWithPassword: SummarizeRequest = {
        ...pendingPasswordRequest,
        options: {
          ...pendingPasswordRequest.options,
          password: password
        }
      };

      const asyncResp: AsyncSummarizeResponse = await summarizeApi.summarizeAsync(requestWithPassword);
      let finalSummary: SummarizeResponse | null = null;
      let attempts = 0;
      let delayMs = 2000;
      while (attempts < 180) {
        try {
          const status: JobStatusResponse = asyncResp.poll_url
            ? await specializedSummarizeApi.getJobStatusByUrl(asyncResp.poll_url)
            : await specializedSummarizeApi.getJobStatus(asyncResp.job_id);
          if (status.status === 'completed') {
            const result: JobResultResponse = asyncResp.result_url
              ? await specializedSummarizeApi.getJobResultByUrl(asyncResp.result_url)
              : await specializedSummarizeApi.getJobResult(asyncResp.job_id);
            finalSummary = result.result || null;
            break;
          }
          if (status.status === 'failed') {
            throw new Error(status.error || 'Summarization failed');
          }
          await new Promise(r => setTimeout(r, 2000));
          attempts++;
          continue;
        } catch (err) {
          await new Promise(r => setTimeout(r, delayMs));
          delayMs = Math.min(10000, Math.floor(delayMs * 1.5));
          attempts++;
          continue;
        }
      }

      if (!finalSummary) {
        throw new Error('Timed out waiting for summarization result after 3 minutes. The content might be very large or complex. Please try with smaller content or contact support if the issue persists.');
      }

      const response: SummarizeResponse = finalSummary;
      
      // Handle API errors
      if (response.error) {
        showError("Error", response.error);
        return;
      }

      if (!response.summary) {
        showError("Error", "No summary generated");
        return;
      }
      
      const summaryResult: SummaryResult = {
        id: Date.now().toString(),
        content: response.summary,
        contentType: activeContentType,
        source: {
          title: response.source_info?.title,
          author: response.source_info?.author,
        },
        metadata: {
          processingTime: response.metadata?.processing_time ? parseFloat(response.metadata.processing_time.replace('s', '')) : 0,
          wordCount: response.source_info?.word_count || 0,
          confidence: response.metadata?.confidence || 0,
          language: language
        },
        timestamp: new Date()
      };

      setResult(summaryResult);
      showSuccess("Success", "PDF summarized successfully!");
    } catch (error) {
      console.error("Password summarization error:", error);
      showError("Error", error instanceof Error ? error.message : "Failed to summarize PDF with password");
    } finally {
      setIsLoading(false);
      setPendingPasswordRequest(null);
    }
  };

  const handlePasswordCancel = () => {
    setShowPasswordInput(false);
    setPendingPasswordRequest(null);
    setIsLoading(false);
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
          {/* Content Type Selection */}
          <Card className="bg-card border border-border rounded-xl shadow-md">
            <CardContent className="p-4 sm:p-6">
              <h3 className="font-semibold text-lg mb-4">Choose Content Type</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {contentTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <Button
                      key={type.id}
                      variant={activeContentType === type.id ? "default" : "outline"}
                      className={`h-auto p-4 flex flex-col items-center space-y-2 ${
                        activeContentType === type.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setActiveContentType(type.id)}
                    >
                      <Icon size={20} />
                      <span className="text-xs font-medium">{type.label}</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Input Area */}
          <Card className="bg-card border border-border rounded-xl shadow-md">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                {/* Language Selection */}
                <div className="flex items-center space-x-4">
                  <label className="text-sm font-medium">Language:</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="rounded-md border border-border bg-background px-3 py-1 text-sm"
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

                {/* Dynamic Input Components */}
                {activeContentType === "pdf" && (
                  <FileUpload
                    accept=".pdf,.doc,.docx,.txt,.rtf"
                    maxSize={50}
                    multiple={false}
                    files={uploadedFiles}
                    onFilesChange={setUploadedFiles}
                    onUploadIdsChange={setUploadedFileIds}
                  />
                )}

                {activeContentType === "audio" && (
                  <MediaUpload
                    accept="audio/*,video/*"
                    maxSize={200}
                    multiple={false}
                    files={uploadedMedia}
                    onFilesChange={setUploadedMedia}
                    onUploadIdsChange={setUploadedFileIds}
                  />
                )}

                {(activeContentType === "youtube" || activeContentType === "link") && (
                  <LinkInput
                    value={inputValue}
                    onChange={setInputValue}
                    placeholder={
                      activeContentType === "youtube"
                        ? "Enter YouTube URL..."
                        : "Enter website URL..."
                    }
                  />
                )}

                {activeContentType === "text" && (
                  <TextInput
                    value={inputValue}
                    onChange={setInputValue}
                    placeholder="Enter or paste your text here..."
                    maxLength={50000}
                  />
                )}

                {/* Summarize Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={handleSummarize}
                    disabled={isLoading}
                    className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        {isPolling ? "Processing..." : "Summarizing..."}
                      </>
                    ) : (
                      <>
                        <Brain className="mr-2 h-4 w-4" />
                        Summarize Content
                      </>
                    )}
                  </Button>
                  
                  {/* Polling Status Display */}
                  {isPolling && pollingStatus && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center">
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                        <span className="text-sm text-blue-800">{pollingStatus}</span>
                      </div>
                      <div className="mt-2 text-xs text-blue-600">
                        This may take several minutes for large or complex content. Please keep this page open.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Password Input for PDF */}
          <PasswordInput
            onPasswordSubmit={handlePasswordSubmit}
            onCancel={handlePasswordCancel}
            isVisible={showPasswordInput}
          />


          {/* Results Display */}
          {result && (
            <UniversalResultDisplay
              result={result}
              onRegenerate={handleRegenerate}
              onExport={handleExport}
              onShare={handleShare}
              showMetadata={true}
              showActions={true}
            />
          )}
      </div>
    </>
  );
}
