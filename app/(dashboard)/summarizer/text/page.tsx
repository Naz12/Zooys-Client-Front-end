"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import TextInput from "@/components/ui/text-input";
import PasswordInput from "@/components/ui/password-input";
import { summarizerApi } from "@/lib/api";
import type { SummarizeRequest } from "@/lib/types/api";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications";
import { Type, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TextSummarizerPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const router = useRouter();
  
  const [language, setLanguage] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [pendingPasswordRequest, setPendingPasswordRequest] = useState<SummarizeRequest | null>(null);

  const handleSummarize = async () => {
    if (!user) {
      showError("Error", "Please log in to use this feature");
      return;
    }

    if (!inputValue.trim()) {
      showError("Error", "Please enter some text to summarize");
      return;
    }

    setIsLoading(true);

    try {
      const request: SummarizeRequest = {
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

      const response = await summarizerApi.summarize(request);

      if (response.success) {
        if ('job_id' in response) {
          const resultData = {
            contentType: "text" as const,
            originalContent: inputValue.trim(),
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
              contentType: "text" as const,
              originalContent: inputValue.trim(),
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
      showError("Error", error instanceof Error ? error.message : "Failed to summarize text");
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
            contentType: "text" as const,
            originalContent: pendingPasswordRequest.source.data,
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
              contentType: "text" as const,
              originalContent: pendingPasswordRequest.source.data,
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
      showError("Error", error instanceof Error ? error.message : "Failed to summarize text");
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
            <Type className="h-8 w-8 text-green-500" />
            <h1 className="text-3xl font-bold">Text Summarizer</h1>
          </div>
          <p className="text-muted-foreground">
            Summarize long text content with AI-powered analysis and key point extraction
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
                <h3 className="text-lg font-semibold mb-4">Text Content</h3>
                <TextInput
                  value={inputValue}
                  onChange={setInputValue}
                  placeholder="Enter your text here..."
                  rows={12}
                />

                <div className="mt-6 flex gap-4">
                  <Button
                    onClick={handleSummarize}
                    disabled={isLoading || !inputValue.trim()}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Summarize Text"
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


