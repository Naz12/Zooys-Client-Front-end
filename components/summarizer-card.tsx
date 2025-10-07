"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import FileUpload, { FileUploadItem } from "@/components/ui/file-upload";
import MediaUpload, { MediaUploadItem } from "@/components/ui/media-upload";
import LinkInput from "@/components/ui/link-input";
import TextInput from "@/components/ui/text-input";
import PasswordInput from "@/components/ui/password-input";
import ResultDisplay, { SummaryResult } from "@/components/ui/result-display";
import { summarizeApi, type SummarizeRequest, type SummarizeResponse, type UploadResponse } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications";
import {
  Youtube,
  FileText,
  Music2,
  Link as LinkIcon,
  Type,
  Settings,
  Loader2,
} from "lucide-react";

type ContentType = "youtube" | "pdf" | "audio" | "link" | "text";

export default function SummarizerCard() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  
  const [activeContentType, setActiveContentType] = useState<ContentType>("youtube");
  const [language, setLanguage] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadItem[]>([]);
  const [uploadedMedia, setUploadedMedia] = useState<MediaUploadItem[]>([]);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [uploadedFileIds, setUploadedFileIds] = useState<number[]>([]);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [pendingPasswordRequest, setPendingPasswordRequest] = useState<SummarizeRequest | null>(null);

  const contentTypes = [
    { id: "youtube" as ContentType, label: "YouTube", icon: Youtube },
    { id: "pdf" as ContentType, label: "PDF, Image & Files", icon: FileText },
    { id: "audio" as ContentType, label: "Audio, Video", icon: Music2 },
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

      // Prepare request based on content type
      switch (activeContentType) {
        case "youtube":
          request = {
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
          break;

        case "link":
          request = {
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
          if (uploadedFileIds.length === 0) {
            showError("Error", "Please upload a file first");
            setIsLoading(false);
            return;
          }
          request = {
            content_type: "pdf",
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

        case "audio":
          if (uploadedFileIds.length === 0) {
            showError("Error", "Please upload a file first");
            setIsLoading(false);
            return;
          }
          request = {
            content_type: "audio",
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

      const response: SummarizeResponse = await summarizeApi.summarize(request);
      
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
          title: response.source_info.title || "Content Title",
          url: response.source_info.url || inputValue,
          author: response.source_info.author,
          views: response.source_info.published_date,
        } : activeContentType === "pdf" ? {
          title: response.source_info.title,
          author: response.source_info.author,
        } : undefined,
        metadata: {
          processingTime: parseFloat(response.metadata.processing_time.replace('s', '')),
          wordCount: response.source_info.word_count || 0,
          confidence: response.metadata.confidence,
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

      const response: SummarizeResponse = await summarizeApi.summarize(requestWithPassword);
      
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
          title: response.source_info.title,
          author: response.source_info.author,
        },
        metadata: {
          processingTime: parseFloat(response.metadata.processing_time.replace('s', '')),
          wordCount: response.source_info.word_count || 0,
          confidence: response.metadata.confidence,
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

  return (
    <Card className="bg-card border border-border rounded-xl shadow-md">
      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Content Type Row - Mobile First */}
        <div className="space-y-3">
          {/* Content Type Buttons - Responsive Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap gap-2">
            {contentTypes.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant={activeContentType === id ? "default" : "outline"}
                size="sm"
                className={`
                  flex items-center gap-2 text-xs sm:text-sm
                  ${activeContentType === id 
                    ? "bg-indigo-600 text-white hover:bg-indigo-500" 
                    : "border-border hover:bg-muted/30"
                  }
                `}
                onClick={() => setActiveContentType(id)}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{label.split(' ')[0]}</span>
              </Button>
            ))}
          </div>

          {/* Language and Settings - Mobile Stack */}
          <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
            <select
              className="rounded-md border border-border bg-background px-3 py-2 text-sm w-full sm:w-auto"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="am">አማርኛ</option>
            </select>
            
            <Button variant="ghost" size="sm" className="w-full sm:w-auto">
              <Settings size={16} />
              <span className="ml-2 sm:hidden">Settings</span>
            </Button>
          </div>
        </div>

        {/* Dynamic Input Area */}
        <div className="space-y-4">
          {/* PDF/Image/Files Upload */}
          {activeContentType === "pdf" && (
            <FileUpload
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              maxSize={50}
              multiple={true}
              onFilesChange={setUploadedFiles}
              onUploadIdsChange={setUploadedFileIds}
              files={uploadedFiles}
              title="Upload PDF, Images & Documents"
              description="Drag and drop files here or click to browse"
            />
          )}

          {/* Audio/Video Upload */}
          {activeContentType === "audio" && (
            <MediaUpload
              accept=".mp3,.wav,.mp4,.avi,.mov"
              maxSize={100}
              multiple={true}
              onFilesChange={setUploadedMedia}
              onUploadIdsChange={setUploadedFileIds}
              files={uploadedMedia}
              title="Upload Audio & Video Files"
              description="Drag and drop media files here or click to browse"
            />
          )}

          {/* Link Input */}
          {activeContentType === "link" && (
            <LinkInput
              value={inputValue}
              onChange={setInputValue}
              placeholder="Enter a URL to summarize, for example: https://example.com/article"
              showPreview={true}
            />
          )}

          {/* Text Input */}
          {activeContentType === "text" && (
            <TextInput
              value={inputValue}
              onChange={setInputValue}
              placeholder="Paste or type your text here..."
              maxLength={10000}
              showStats={true}
              showActions={true}
              autoSave={true}
            />
          )}

          {/* YouTube Input */}
          {activeContentType === "youtube" && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Youtube size={20} className="text-indigo-500" />
                <span className="text-sm font-medium">YouTube URL</span>
              </div>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter the YouTube video link, for example: https://youtube.com/watch?v=12345"
                className="w-full rounded-md border border-indigo-600 focus:ring-2 focus:ring-indigo-500"
                type="url"
              />
            </div>
          )}
        </div>

        {/* Action Buttons - Mobile Stack */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="gradient"
            onClick={handleSummarize}
            disabled={isLoading || (!inputValue.trim() && uploadedFiles.length === 0 && uploadedMedia.length === 0)}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Summarize Now"
            )}
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
          >
            Batch Summarize
          </Button>
        </div>

        {/* Password Input for PDF */}
        <PasswordInput
          onPasswordSubmit={handlePasswordSubmit}
          onCancel={handlePasswordCancel}
          isVisible={showPasswordInput}
        />

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
      </CardContent>
    </Card>
  );
}
