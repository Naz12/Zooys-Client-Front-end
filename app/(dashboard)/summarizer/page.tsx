"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import FileUpload, { FileUploadItem } from "@/components/ui/file-upload";
import MediaUpload, { MediaUploadItem } from "@/components/ui/media-upload";
import LinkInput from "@/components/ui/link-input";
import TextInput from "@/components/ui/text-input";
import PasswordInput from "@/components/ui/password-input";
import { summarizerApi } from "@/lib/api";
import type { SummarizeRequest } from "@/lib/types/api";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications";
import {
  Youtube,
  FileText,
  Music2,
  Link as LinkIcon,
  Type,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type ContentType = "youtube" | "pdf" | "audio" | "link" | "text";

export default function SummarizerPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const router = useRouter();
  
  const [activeContentType, setActiveContentType] = useState<ContentType>("youtube");
  const [language, setLanguage] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadItem[]>([]);
  const [uploadedMedia, setUploadedMedia] = useState<MediaUploadItem[]>([]);
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

    try {
      let request: SummarizeRequest;

      switch (activeContentType) {
        case "youtube":
          request = {
            content_type: "youtube",
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
          if (uploadedFiles.length === 0) {
            showError("Error", "Please upload a file first");
            return;
          }

          const uploadedFile = uploadedFiles[0];
          if (uploadedFile.status !== 'completed' || !uploadedFile.uploadId) {
            showError("Error", "Please wait for the file to finish uploading");
            return;
          }

          request = {
            content_type: "file",
            source: {
              type: "file",
              data: uploadedFile.uploadId.toString()
            },
            options: {
              mode: "summary",
              language: language,
              focus: "summary"
            }
          };
          break;

        case "audio":
          if (uploadedMedia.length === 0) {
            showError("Error", "Please upload a media file first");
            return;
          }

          const uploadedMediaFile = uploadedMedia[0];
          if (uploadedMediaFile.status !== 'completed' || !uploadedMediaFile.uploadId) {
            showError("Error", "Please wait for the media file to finish uploading");
            return;
          }

          request = {
            content_type: "audio",
            source: {
              type: "file",
              data: uploadedMediaFile.uploadId.toString()
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
          // Async job - navigate to result page immediately with job_id
          const resultData = {
            contentType: activeContentType,
            originalContent: activeContentType === 'text' ? inputValue.trim() : 
                            activeContentType === 'youtube' || activeContentType === 'link' ? inputValue.trim() :
                            activeContentType === 'pdf' ? uploadedFiles[0]?.name || '' :
                            activeContentType === 'audio' ? uploadedMedia[0]?.name || '' : '',
            jobId: response.job_id,
            pollUrl: response.poll_url,
            resultUrl: response.result_url,
            request: request
          };
          
          // Store in sessionStorage for result page
          sessionStorage.setItem('summarizerResult', JSON.stringify(resultData));
          router.push('/summarizer/result');
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
            
            // Navigate to result page with data
            const resultData = {
              contentType: activeContentType,
              originalContent: activeContentType === 'text' ? inputValue.trim() : 
                              activeContentType === 'youtube' || activeContentType === 'link' ? inputValue.trim() :
                              activeContentType === 'pdf' ? uploadedFiles[0]?.name || '' :
                              activeContentType === 'audio' ? uploadedMedia[0]?.name || '' : '',
              result: displayResult,
              request: request
            };
            
            // Store in sessionStorage for result page
            sessionStorage.setItem('summarizerResult', JSON.stringify(resultData));
            router.push('/summarizer/result');
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
          // Async job - navigate to result page immediately with job_id
          const resultData = {
            contentType: pendingPasswordRequest.content_type,
            originalContent: pendingPasswordRequest.content_type === 'text' ? pendingPasswordRequest.source.data : 
                            pendingPasswordRequest.content_type === 'youtube' || pendingPasswordRequest.content_type === 'link' ? pendingPasswordRequest.source.data :
                            pendingPasswordRequest.content_type === 'pdf' ? uploadedFiles[0]?.name || '' :
                            pendingPasswordRequest.content_type === 'audio' ? uploadedMedia[0]?.name || '' : '',
            jobId: response.job_id,
            pollUrl: response.poll_url,
            resultUrl: response.result_url,
            request: pendingPasswordRequest
          };
          
          // Store in sessionStorage for result page
          sessionStorage.setItem('summarizerResult', JSON.stringify(resultData));
          router.push('/summarizer/result');
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
            
            // Navigate to result page with data
            const resultData = {
              contentType: pendingPasswordRequest.content_type,
              originalContent: pendingPasswordRequest.content_type === 'text' ? pendingPasswordRequest.source.data : 
                              pendingPasswordRequest.content_type === 'youtube' || pendingPasswordRequest.content_type === 'link' ? pendingPasswordRequest.source.data :
                              pendingPasswordRequest.content_type === 'pdf' ? uploadedFiles[0]?.name || '' :
                              pendingPasswordRequest.content_type === 'audio' ? uploadedMedia[0]?.name || '' : '',
              result: displayResult,
              request: pendingPasswordRequest
            };
            
            // Store in sessionStorage for result page
            sessionStorage.setItem('summarizerResult', JSON.stringify(resultData));
            router.push('/summarizer/result');
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
      setPendingPasswordRequest(null);
    }
  };


  const handleFileUpload = (filesOrCallback: FileUploadItem[] | ((prev: FileUploadItem[]) => FileUploadItem[])) => {
    if (typeof filesOrCallback === 'function') {
      // It's a callback function - use it directly with setState
      setUploadedFiles(prev => {
        const newFiles = filesOrCallback(prev);
        // Extract upload IDs from the new files
        const ids = newFiles
          .filter(f => f.status === 'completed' && f.uploadId)
          .map(f => f.uploadId!);
        setUploadedFileIds(ids);
        return newFiles;
      });
    } else {
      // It's a direct array
      setUploadedFiles(filesOrCallback);
      // Extract upload IDs from files that have completed upload
      const ids = filesOrCallback
        .filter(f => f.status === 'completed' && f.uploadId)
        .map(f => f.uploadId!);
      setUploadedFileIds(ids);
    }
  };

  const handleMediaUpload = (mediaOrCallback: MediaUploadItem[] | ((prev: MediaUploadItem[]) => MediaUploadItem[])) => {
    if (typeof mediaOrCallback === 'function') {
      // It's a callback function - use it directly with setState
      setUploadedMedia(prev => {
        const newMedia = mediaOrCallback(prev);
        // Extract upload IDs from the new media files
        const ids = newMedia
          .filter(m => m.status === 'completed' && m.uploadId)
          .map(m => m.uploadId!);
        setUploadedFileIds(ids);
        return newMedia;
      });
    } else {
      // It's a direct array
      setUploadedMedia(mediaOrCallback);
      // Extract upload IDs from media files that have completed upload
      const ids = mediaOrCallback
        .filter(m => m.status === 'completed' && m.uploadId)
        .map(m => m.uploadId!);
      setUploadedFileIds(ids);
    }
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
            accept=".pdf,.doc,.docx,.txt"
            maxSize={50}
            multiple={false}
            onFilesChange={handleFileUpload}
            onUploadIdsChange={setUploadedFileIds}
            files={uploadedFiles}
            title="Upload PDF or Document"
            description="Drag and drop a file here or click to browse"
          />
        );
      case "audio":
        return (
          <MediaUpload
            accept=".mp3,.wav,.mp4,.avi,.mov"
            maxSize={100}
            multiple={false}
            onFilesChange={handleMediaUpload}
            onUploadIdsChange={setUploadedFileIds}
            files={uploadedMedia}
            title="Upload Audio or Video File"
            description="Drag and drop a media file here or click to browse"
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
                        Processing...
                      </>
                    ) : (
                      "Summarize"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

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