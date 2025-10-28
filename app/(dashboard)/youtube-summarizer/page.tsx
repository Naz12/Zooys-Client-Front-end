"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import LinkInput from "@/components/ui/link-input";
import YouTubeResultDisplay from "@/components/youtube/youtube-result-display";
import UniversalResultDisplay from "@/components/universal-result-display";
import { useAsyncYouTubeSummarizer } from "@/lib/hooks/use-async-youtube-summarizer";
import { summarizerApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications";
import { Youtube, ArrowLeft, Settings, Brain, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import BackendStatus from "@/components/backend-status";

export default function YouTubeSummarizerPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  
  const [language, setLanguage] = useState("en");
  const [inputValue, setInputValue] = useState("");
  
  // Use the async YouTube summarizer hook
  const {
    status,
    progress,
    stage,
    logs,
    result,
    error,
    retryCount,
    startJob,
    cancelJob,
    reset,
  } = useAsyncYouTubeSummarizer();

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

    try {
      await startJob(inputValue.trim(), language, 'bundle');
      showSuccess("Success", "YouTube summarization job started!");
    } catch (error) {
      console.error("Summarization error:", error);
      showError("Error", error instanceof Error ? error.message : "Failed to start summarization");
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

  const handleCancel = () => {
    cancelJob();
    showSuccess("Cancelled", "Processing cancelled successfully");
  };

  const handleReset = () => {
    reset();
    setInputValue("");
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

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={handleSummarize}
                    disabled={status === 'processing' || status === 'starting' || !inputValue.trim()}
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white px-8 py-2"
                  >
                    {status === 'processing' || status === 'starting' ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        {status === 'processing' ? `Processing... ${progress}%` : "Starting Job..."}
                      </>
                    ) : (
                      <>
                        <Brain className="mr-2 h-4 w-4" />
                        Summarize Video
                      </>
                    )}
                  </Button>
                  
                  {status === 'processing' && (
                    <Button
                      onClick={handleCancel}
                      variant="outline"
                      className="w-full sm:w-auto text-red-600 border-red-600 hover:bg-red-50"
                    >
                      Cancel Processing
                    </Button>
                  )}
                  
                  {(status === 'completed' || status === 'failed') && (
                    <Button
                      onClick={handleReset}
                      variant="outline"
                      className="w-full sm:w-auto"
                    >
                      Start New Summary
                    </Button>
                  )}
                </div>

                {/* Progress Indicator */}
                {(status === 'processing' || status === 'starting') && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {stage && (
                      <div className="text-sm text-muted-foreground text-center">
                        {stage}
                      </div>
                    )}
                    {logs.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                        <div className="text-xs text-muted-foreground mb-2">Processing Logs:</div>
                        {logs.map((log, index) => (
                          <div key={index} className="text-xs text-gray-600 mb-1">
                            {log}
                          </div>
                        ))}
                      </div>
                    )}
                    {retryCount > 0 && (
                      <div className="flex items-center gap-2 text-sm text-amber-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>Retrying connection... ({retryCount}/5)</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Error Display */}
                {status === 'failed' && error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-red-800">Processing Failed</h4>
                        <p className="text-sm text-red-700 mt-1">{error}</p>
                      </div>
                    </div>
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
          {result && status === 'completed' && (
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
      </div>
    </>
  );
}
