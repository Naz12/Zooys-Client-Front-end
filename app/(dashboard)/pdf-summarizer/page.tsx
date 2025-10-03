"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import FileUpload, { FileUploadItem } from "@/components/ui/file-upload";
import PasswordInput from "@/components/ui/password-input";
import RAGSummary from "@/components/ui/rag-summary";
import ResultDisplay, { SummaryResult } from "@/components/ui/result-display";
import { summarizeApi, type SummarizeRequest, type SummarizeResponse } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications";
import { FileText, ArrowLeft, Settings, Brain, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function PDFSummarizerPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  
  const [language, setLanguage] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadItem[]>([]);
  const [result, setResult] = useState<SummaryResult | null>(null);
  const [uploadedFileIds, setUploadedFileIds] = useState<number[]>([]);
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [pendingPasswordRequest, setPendingPasswordRequest] = useState<SummarizeRequest | null>(null);

  const handleSummarize = async () => {
    if (!user) {
      showError("Error", "Please log in to use this feature");
      return;
    }

    if (uploadedFileIds.length === 0) {
      showError("Error", "Please upload a PDF file first");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const request: SummarizeRequest = {
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

      const response: SummarizeResponse = await summarizeApi.summarize(request);
      
      // Handle API errors
      if (response.error) {
        // Check if it's a password-protected PDF error
        if (response.error.includes("password-protected")) {
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
        contentType: "pdf",
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
      console.error("Summarization error:", error);
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
      const requestWithPassword: SummarizeRequest = {
        ...pendingPasswordRequest,
        options: {
          ...pendingPasswordRequest.options,
          password: password
        }
      };

      const response: SummarizeResponse = await summarizeApi.summarize(requestWithPassword);
      
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
        contentType: "pdf",
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
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Upload Card */}
          <Card className="bg-card border border-border rounded-xl shadow-md">
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">Upload PDF Document</h2>
                  <p className="text-muted-foreground">
                    Upload your PDF file to get an AI-powered summary
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

                {/* File Upload */}
                <FileUpload
                  accept=".pdf,.doc,.docx,.txt,.rtf"
                  maxSize={50}
                  multiple={false}
                  files={uploadedFiles}
                  onFilesChange={setUploadedFiles}
                  onUploadIdsChange={setUploadedFileIds}
                />

                {/* Summarize Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={handleSummarize}
                    disabled={isLoading || uploadedFileIds.length === 0}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Analyzing PDF...
                      </>
                    ) : (
                      <>
                        <Brain className="mr-2 h-4 w-4" />
                        Summarize PDF
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features Card */}
          <Card className="bg-muted/30 border border-border rounded-xl">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">PDF Analysis Features</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Smart Extraction</h4>
                    <p className="text-xs text-muted-foreground">Extract text from any PDF format</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Password Protected</h4>
                    <p className="text-xs text-muted-foreground">Handle encrypted PDFs</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">RAG Analysis</h4>
                    <p className="text-xs text-muted-foreground">Ask questions about your PDF</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Metadata</h4>
                    <p className="text-xs text-muted-foreground">Document information and stats</p>
                  </div>
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

          {/* RAG Summary for PDF files */}
          {uploadedFileIds.length > 0 && (
            <RAGSummary
              uploadId={uploadedFileIds[0]}
              onSummaryGenerated={(summary) => {
                console.log("RAG summary generated:", summary);
              }}
            />
          )}

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
