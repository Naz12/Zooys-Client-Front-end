"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import FileUpload, { FileUploadItem } from "@/components/ui/file-upload";
import MediaUpload, { MediaUploadItem } from "@/components/ui/media-upload";
import LinkInput from "@/components/ui/link-input";
import TextInput from "@/components/ui/text-input";
import PasswordInput from "@/components/ui/password-input";
import ResultDisplay, { SummaryResult } from "@/components/ui/result-display";
import UniversalResultDisplay from "@/components/universal-result-display";
import { summarizerApi } from "@/lib/api";
import type { SummarizeRequest, SummarizeResponse, AsyncSummarizeResponse, JobStatusResponse, JobResultResponse } from "@/lib/types/api";
import { parseSummarizationResult, getResultDisplayMessage, getResultType } from "@/lib/result-parser";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications";
import {
  Youtube,
  FileText,
  Music2,
  Link as LinkIcon,
  Type,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [result, setResult] = useState<any>(null);
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
              mode: "summary",
              language: language,
              focus: "summary"
            }
          };
          break;

        case "pdf":
        case "audio":
          if (uploadedFiles.length === 0) {
            showError("Error", "Please upload a file first");
            return;
          }

          const fileId = uploadedFiles[0].id;
          request = {
            content_type: activeContentType,
            source: {
              type: "file",
              data: fileId.toString()
            },
            options: {
              mode: "summary",
              language: language,
              focus: "summary"
            }
          };
          break;

        default:
          showError("Error", "Unsupported content type");
          return;
      }

      const response = await summarizerApi.summarize(request);

      if (response.success) {
        if ('job_id' in response) {
          // Async job - start polling
          setIsPolling(true);
          setPollingStatus("Processing your request...");
          
          const finalResult = await summarizerApi.pollJobCompletion(
            response.job_id,
            60,
            2000
          );
          
          if (finalResult.success && finalResult.result) {
            // Use universal result parser to handle all different response structures
            const parsedResult = parseSummarizationResult(finalResult.result);

            if (parsedResult) {
              // Convert parsed result directly to the format expected by UniversalResultDisplay
              const displayResult = {
                success: true,
                summary: parsedResult.summary,
                key_points: parsedResult.key_points || [],
                confidence_score: parsedResult.confidence_score || 0.8,
                model_used: parsedResult.model_used || 'unknown',
                metadata: parsedResult.metadata,
                source_info: parsedResult.source_info,
                ai_result: parsedResult.ai_result,
                bundle: parsedResult.bundle,
                file_info: parsedResult.file_info
              };
              setResult(displayResult);
            } else {
              showError("Error", "Failed to parse summarization result");
            }
          } else {
            showError("Error", "Summarization failed");
          }
        } else {
          // Direct result
          if (response.summary) {
            const displayResult = {
              success: true,
              summary: response.summary,
              key_points: response.key_points || [],
              confidence_score: response.confidence_score || 0.8,
              model_used: response.model_used || 'unknown',
              metadata: response.metadata,
              source_info: response.source_info,
              ai_result: response.ai_result,
              bundle: response.bundle,
              file_info: response.file_info
            };
            setResult(displayResult);
          } else {
            showError("Error", "No summary generated");
          }
        }
      } else {
        showError("Error", response.error || "Summarization failed");
      }
    } catch (error) {
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
      const response = await summarizerApi.summarizeWithPassword({
        ...pendingPasswordRequest,
        password
      });

      if (response.success) {
        if ('job_id' in response) {
          setIsPolling(true);
          setPollingStatus("Processing your request...");
          
          const finalResult = await summarizerApi.pollJobCompletion(
            response.job_id,
            60,
            2000
          );
          
          if (finalResult.success && finalResult.result) {
            const parsedResult = parseSummarizationResult(finalResult.result);

            if (parsedResult) {
              const displayResult = {
                success: true,
                summary: parsedResult.summary,
                key_points: parsedResult.key_points || [],
                confidence_score: parsedResult.confidence_score || 0.8,
                model_used: parsedResult.model_used || 'unknown',
                metadata: parsedResult.metadata,
                source_info: parsedResult.source_info,
                ai_result: parsedResult.ai_result,
                bundle: parsedResult.bundle,
                file_info: parsedResult.file_info
              };
              setResult(displayResult);
            } else {
              showError("Error", "Failed to parse summarization result");
            }
          } else {
            showError("Error", "Summarization failed");
          }
        } else {
          if (response.summary) {
            const displayResult = {
              success: true,
              summary: response.summary,
              key_points: response.key_points || [],
              confidence_score: response.confidence_score || 0.8,
              model_used: response.model_used || 'unknown',
              metadata: response.metadata,
              source_info: response.source_info,
              ai_result: response.ai_result,
              bundle: response.bundle,
              file_info: response.file_info
            };
            setResult(displayResult);
          } else {
            showError("Error", "No summary generated");
          }
        }
      } else {
        showError("Error", response.error || "Summarization failed");
      }
    } catch (error) {
      showError("Error", error instanceof Error ? error.message : "Failed to summarize content");
    } finally {
      setIsLoading(false);
      setIsPolling(false);
      setPollingStatus("");
      setPendingPasswordRequest(null);
    }
  };

  const handleRegenerate = () => {
    setResult(null);
    handleSummarize();
  };

  const handleFileUpload = (files: FileUploadItem[]) => {
    setUploadedFiles(files);
    setUploadedFileIds(files.map(f => f.id));
  };

  const handleMediaUpload = (media: MediaUploadItem[]) => {
    setUploadedMedia(media);
  };

  const renderContentInput = () => {
    switch (activeContentType) {
      case "youtube":
      case "link":
        return (
          <LinkInput
            value={inputValue}
            onChange={setInputValue}
            placeholder="Enter YouTube URL or any link"
          />
        );
      case "text":
        return (
          <TextInput
            value={inputValue}
            onChange={setInputValue}
            placeholder="Enter your text here..."
            rows={8}
          />
        );
      case "pdf":
        return (
          <FileUpload
            onUpload={handleFileUpload}
            acceptedTypes={["pdf", "doc", "docx", "txt"]}
            maxFiles={1}
          />
        );
      case "audio":
        return (
          <MediaUpload
            onUpload={handleMediaUpload}
            acceptedTypes={["mp3", "wav", "mp4", "avi", "mov"]}
            maxFiles={1}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Summarizer</h1>
          <p className="text-muted-foreground">
            Summarize YouTube videos, documents, audio, and more with AI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Content Type Selection */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Content Type</h3>
                <div className="space-y-2">
                  {contentTypes.map((type) => (
                    <Button
                      key={type.id}
                      variant={activeContentType === type.id ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => setActiveContentType(type.id)}
                    >
                      <type.icon className="mr-2 h-4 w-4" />
                      {type.label}
                    </Button>
                  ))}
                </div>

                <div className="mt-6">
                  <label className="text-sm font-medium mb-2 block">Language</label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full p-2 border rounded-md"
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
                    <option value="ar">Arabic</option>
                    <option value="hi">Hindi</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Input */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Content</h3>
                {renderContentInput()}

                <div className="mt-6 flex gap-4">
                  <Button
                    onClick={handleSummarize}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isPolling ? pollingStatus : "Processing..."}
                      </>
                    ) : (
                      "Summarize"
                    )}
                  </Button>
                  
                  {result && (
                    <Button
                      variant="outline"
                      onClick={handleRegenerate}
                      disabled={isLoading}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Regenerate
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="mt-8">
            <UniversalResultDisplay result={result} />
          </div>
        )}

        {/* Password Input Modal */}
        {showPasswordInput && (
          <PasswordInput
            onSubmit={handlePasswordSubmit}
            onCancel={() => {
              setShowPasswordInput(false);
              setPendingPasswordRequest(null);
            }}
          />
        )}
      </div>
    </div>
  );
}