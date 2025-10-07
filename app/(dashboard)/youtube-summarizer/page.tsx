"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import LinkInput from "@/components/ui/link-input";
import ResultDisplay, { SummaryResult } from "@/components/ui/result-display";
import { summarizeApi, aiToolsApi, type SummarizeRequest, type SummarizeResponse } from "@/lib/api-client";
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

  const handleSummarize = async () => {
    if (!user) {
      showError("Error", "Please log in to use this feature");
      return;
    }

    if (!inputValue.trim()) {
      showError("Error", "Please enter a YouTube URL");
      return;
    }

    // Validate YouTube URL
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)[\w-]+/;
    if (!youtubeRegex.test(inputValue.trim())) {
      showError("Error", "Please enter a valid YouTube URL (e.g., https://www.youtube.com/watch?v=...)");
      return;
    }

    setIsLoading(true);
    setResult(null);

    // First, check if backend is running and has the endpoint
    try {
      // Try a simple GET request to check if server is up
      const serverCheck = await fetch('http://localhost:8000/', { 
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('Backend server check:', serverCheck.status);
      
      // Try to check if summarize endpoint exists
      const endpointCheck = await fetch('http://localhost:8000/api/summarize', { 
        method: 'OPTIONS',
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('Summarize endpoint check:', endpointCheck.status);
      
    } catch (healthError) {
      console.error('Backend connection failed:', healthError);
      showError("Backend Error", "Cannot connect to backend server. Please ensure the server is running on http://localhost:8000");
      setIsLoading(false);
      return;
    }

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

      console.log('YouTube Summarize Request:', request);
      console.log('Sending request to:', 'http://localhost:8000/api/summarize');
      
      const response: SummarizeResponse = await summarizeApi.summarize(request);
      console.log('YouTube Summarize Response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response));
      
      if (response.error) {
        console.error('YouTube Summarize Error:', response.error);
        showError("Error", response.error);
        return;
      }

      if (!response.summary) {
        console.error('No summary in response:', response);
        console.error('Response type:', typeof response);
        console.error('Response keys:', Object.keys(response));
        console.error('Full response structure:', JSON.stringify(response, null, 2));
        
        // Check if response is completely empty
        if (Object.keys(response).length === 0) {
          console.error('Empty response object - backend may not be processing YouTube URLs');
          showError("Backend Issue", "The backend returned an empty response `{}`. This means:\n\n🔧 **Backend Status**: Server is running and CORS is configured ✅\n❌ **API Issue**: The /api/summarize endpoint is not working\n\n**Possible Causes:**\n1. `/api/summarize` endpoint not implemented\n2. YouTube URL processing not supported\n3. Backend crashed during processing\n4. Authentication issues\n\n**Next Steps:**\n1. Check backend server logs\n2. Verify /api/summarize endpoint exists\n3. Test with a simple POST request\n4. See md/backend-cors-setup.md for endpoint implementation");
          return;
        }
        
        // Try fallback to dedicated YouTube API
        console.log('Trying fallback YouTube API...');
        try {
          const fallbackResponse = await aiToolsApi.summarizeYouTube(inputValue.trim(), language, "detailed");
          console.log('Fallback YouTube API Response:', fallbackResponse);
          
          if (fallbackResponse.summary) {
            const summaryResult: SummaryResult = {
              id: Date.now().toString(),
              content: fallbackResponse.summary,
              contentType: "youtube",
              source: {
                title: fallbackResponse.video_info?.title || "YouTube Video",
                url: inputValue,
                author: fallbackResponse.video_info?.channel,
                views: fallbackResponse.video_info?.views,
              },
              metadata: {
                processingTime: 0,
                wordCount: 0,
                confidence: 0.95,
                language: language
              },
              timestamp: new Date()
            };

            setResult(summaryResult);
            showSuccess("Success", "YouTube video summarized successfully!");
            return;
          }
        } catch (fallbackError) {
          console.error('Fallback API also failed:', fallbackError);
        }
        
        showError("Error", "No summary generated. The backend may not support YouTube summarization or the video URL is not accessible.");
        return;
      }
      
      const summaryResult: SummaryResult = {
        id: Date.now().toString(),
        content: response.summary,
        contentType: "youtube",
        source: {
          title: response.source_info.title || "YouTube Video",
          url: response.source_info.url || inputValue,
          author: response.source_info.author,
          views: response.source_info.published_date,
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
      showSuccess("Success", "YouTube video summarized successfully!");
    } catch (error) {
      console.error("Summarization error:", error);
      
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
        showError("Error", "Failed to summarize YouTube video. Please check your connection and try again.");
      }
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
                  placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=...)"
                />

                {/* Summarize Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={handleSummarize}
                    disabled={isLoading || !inputValue.trim()}
                    className="w-full sm:w-auto bg-red-600 hover:bg-red-500 text-white px-8 py-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Analyzing Video...
                      </>
                    ) : (
                      <>
                        <Brain className="mr-2 h-4 w-4" />
                        Summarize Video
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
