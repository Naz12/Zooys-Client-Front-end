"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import FileUpload, { FileUploadItem } from "@/components/ui/file-upload";
import PasswordInput from "@/components/ui/password-input";
import { summarizerApi } from "@/lib/api";
import type { SummarizeRequest } from "@/lib/types/api";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications";
import { FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PDFSummarizerPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const router = useRouter();
  
  const [language, setLanguage] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadItem[]>([]);
  const [uploadedFileIds, setUploadedFileIds] = useState<number[]>([]);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [pendingPasswordRequest, setPendingPasswordRequest] = useState<SummarizeRequest | null>(null);

  const handleFileUpload = (filesOrCallback: FileUploadItem[] | ((prev: FileUploadItem[]) => FileUploadItem[])) => {
    if (typeof filesOrCallback === 'function') {
      setUploadedFiles(prev => {
        const newFiles = filesOrCallback(prev);
        const ids = newFiles
          .filter(f => f.status === 'completed' && f.uploadId)
          .map(f => f.uploadId!);
        setUploadedFileIds(ids);
        return newFiles;
      });
    } else {
      setUploadedFiles(filesOrCallback);
      const ids = filesOrCallback
        .filter(f => f.status === 'completed' && f.uploadId)
        .map(f => f.uploadId!);
      setUploadedFileIds(ids);
    }
  };

  const handleSummarize = async () => {
    if (!user) {
      showError("Error", "Please log in to use this feature");
      return;
    }

    if (uploadedFiles.length === 0) {
      showError("Error", "Please upload a file first");
      return;
    }

    const uploadedFile = uploadedFiles[0];
    if (uploadedFile.status !== 'completed' || !uploadedFile.uploadId) {
      showError("Error", "Please wait for the file to finish uploading");
      return;
    }

    setIsLoading(true);

    try {
      const request: SummarizeRequest = {
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

      const response = await summarizerApi.summarize(request);

      if (response.success) {
        if ('job_id' in response) {
          const resultData = {
            contentType: "pdf" as const,
            originalContent: uploadedFile.name || '',
            jobId: response.job_id,
            pollUrl: response.poll_url,
            resultUrl: response.result_url,
            request: request
          };
          
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
            
            const resultData = {
              contentType: "pdf" as const,
              originalContent: uploadedFile.name || '',
              result: displayResult,
              request: request
            };
            
            sessionStorage.setItem('summarizerResult', JSON.stringify(resultData));
            router.push('/summarizer/result');
          } else {
            showError("Error", "No summary generated");
          }
        }
      } else {
        if (response.requires_password) {
          setPendingPasswordRequest(request);
          setShowPasswordInput(true);
        } else {
          showError("Error", response.error || "Summarization failed");
        }
      }
    } catch (error) {
      showError("Error", error instanceof Error ? error.message : "Failed to summarize PDF");
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
          const resultData = {
            contentType: "pdf" as const,
            originalContent: uploadedFiles[0]?.name || '',
            jobId: response.job_id,
            pollUrl: response.poll_url,
            resultUrl: response.result_url,
            request: pendingPasswordRequest
          };
          
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
            
            const resultData = {
              contentType: "pdf" as const,
              originalContent: uploadedFiles[0]?.name || '',
              result: displayResult,
              request: pendingPasswordRequest
            };
            
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
      showError("Error", error instanceof Error ? error.message : "Failed to summarize PDF");
    } finally {
      setIsLoading(false);
      setPendingPasswordRequest(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <FileText className="h-8 w-8 text-blue-500" />
            <h1 className="text-3xl font-bold">PDF & Document Summarizer</h1>
          </div>
          <p className="text-muted-foreground">
            Analyze and summarize PDF documents, Word files, and text documents with AI
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Settings</h3>
                <div className="space-y-4">
                  <div>
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
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Input */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">Upload Document</h3>
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

                <div className="mt-6 flex gap-4">
                  <Button
                    onClick={handleSummarize}
                    disabled={isLoading || uploadedFiles.length === 0 || uploadedFiles[0]?.status !== 'completed'}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Summarize Document"
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


