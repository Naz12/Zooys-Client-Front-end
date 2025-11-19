"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { writerApi, type ContentJobResult } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications";
import { Sparkles, Copy, Download, RefreshCw, FileEdit } from "lucide-react";
import { Progress } from "@/components/ui/progress";

type ContentMode = "write" | "rewrite";
type WritingMode = "creative" | "professional" | "academic";

export default function WriterPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  
  // Content mode (write or rewrite)
  const [contentMode, setContentMode] = useState<ContentMode>("write");
  
  // Form state
  const [prompt, setPrompt] = useState("");
  const [previousContent, setPreviousContent] = useState("");
  const [mode, setMode] = useState<WritingMode>("professional");
  
  // Job state
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stageMessage, setStageMessage] = useState("");
  const [result, setResult] = useState<ContentJobResult["data"] | null>(null);
  const [resultMetadata, setResultMetadata] = useState<ContentJobResult["metadata"] | null>(null);

  const handleGenerate = async () => {
    if (!user) {
      showError("Error", "Please log in to use this feature");
      return;
    }

    if (!prompt.trim()) {
      showError("Error", "Please enter a prompt");
      return;
    }

    if (contentMode === "rewrite" && !previousContent.trim()) {
      showError("Error", "Please enter the content you want to rewrite");
      return;
    }

    setIsLoading(true);
    setResult(null);
    setResultMetadata(null);
    setProgress(0);
    setStageMessage("");

    try {
      let jobResponse;
      
      if (contentMode === "write") {
        jobResponse = await writerApi.writeContent({
          prompt: prompt.trim(),
          mode,
        });
      } else {
        jobResponse = await writerApi.rewriteContent({
          previous_content: previousContent.trim(),
          prompt: prompt.trim(),
          mode,
        });
      }

      if (!jobResponse.success || !jobResponse.job_id) {
        throw new Error(jobResponse.message || "Failed to create job");
      }

      showSuccess("Success", "Content generation started! Processing...");

      // Poll for job completion
      const pollResult = await writerApi.pollJobCompletion(
        jobResponse.job_id,
        (progressValue, stage, stageMsg) => {
          setProgress(progressValue);
          setStageMessage(stageMsg || stage || "");
        }
      );

      if (!pollResult.success || !pollResult.result) {
        throw new Error(pollResult.error || "Failed to generate content");
      }

      setResult(pollResult.result.data);
      setResultMetadata(pollResult.result.metadata);
      showSuccess("Success", "Content generated successfully!");
    } catch (error) {
      console.error("Generation error:", error);
      showError("Error", error instanceof Error ? error.message : "Failed to generate content");
    } finally {
      setIsLoading(false);
      setProgress(0);
      setStageMessage("");
    }
  };

  const handleCopy = () => {
    if (result?.content) {
      navigator.clipboard.writeText(result.content);
      showSuccess("Success", "Content copied to clipboard!");
    }
  };

  const handleDownload = () => {
    if (result?.content) {
      const blob = new Blob([result.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ai-generated-content-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleRewrite = () => {
    if (result?.content) {
      setContentMode("rewrite");
      setPreviousContent(result.content);
      setPrompt("");
      setResult(null);
      setResultMetadata(null);
    }
  };

  const writingModes: Array<{ id: WritingMode; label: string; description: string }> = [
    { id: "creative", label: "Creative", description: "Engaging and vivid writing" },
    { id: "professional", label: "Professional", description: "Clear business language" },
    { id: "academic", label: "Academic", description: "Formal scholarly writing" },
  ];

  const examplePrompts = [
    "Write a blog post about the benefits of remote work",
    "Create a product description for a new smartphone",
    "Write a cover letter for a software engineer position",
    "Generate a creative story about time travel",
    "Write a professional email to a client",
    "Create a marketing copy for a fitness app",
  ];

  return (
    <div className="space-y-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Mode Selection */}
        <Card className="bg-card border border-border rounded-xl shadow-md">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Button
                variant={contentMode === "write" ? "default" : "outline"}
                className="flex-1"
                onClick={() => {
                  setContentMode("write");
                  setPreviousContent("");
                  setResult(null);
                  setResultMetadata(null);
                }}
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Write New Content
              </Button>
              <Button
                variant={contentMode === "rewrite" ? "default" : "outline"}
                className="flex-1"
                onClick={() => {
                  setContentMode("rewrite");
                  setResult(null);
                  setResultMetadata(null);
                }}
              >
                <FileEdit className="mr-2 h-4 w-4" />
                Rewrite Content
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Input Card */}
        <Card className="bg-card border border-border rounded-xl shadow-md">
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-xl font-semibold mb-2">
                  {contentMode === "write" ? "Generate Content" : "Rewrite Content"}
                </h2>
                <p className="text-muted-foreground">
                  {contentMode === "write"
                    ? "Describe what you want to write and let AI help you create it"
                    : "Enter your content and instructions for rewriting"}
                </p>
              </div>

              {/* Previous Content (for rewrite mode) */}
              {contentMode === "rewrite" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Content to Rewrite:</label>
                  <textarea
                    value={previousContent}
                    onChange={(e) => setPreviousContent(e.target.value)}
                    placeholder="Paste the content you want to rewrite here..."
                    className="w-full min-h-[150px] rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={6}
                  />
                </div>
              )}

              {/* Prompt Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {contentMode === "write" ? "What would you like to write?" : "How would you like to rewrite it?"}
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    contentMode === "write"
                      ? "Describe your content idea, topic, or specific requirements..."
                      : "Enter instructions for rewriting (e.g., 'Make it more engaging', 'Add specific examples', 'Simplify the language')..."
                  }
                  className="w-full min-h-[120px] rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={4}
                />
              </div>

              {/* Writing Mode Selection */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Writing Mode:</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {writingModes.map((modeOption) => (
                    <Button
                      key={modeOption.id}
                      variant={mode === modeOption.id ? "default" : "outline"}
                      className={`h-auto p-3 flex flex-col items-start space-y-1 ${
                        mode === modeOption.id
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => setMode(modeOption.id)}
                    >
                      <span className="font-medium text-sm">{modeOption.label}</span>
                      <span className="text-xs opacity-70">{modeOption.description}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Example Prompts (only for write mode) */}
              {contentMode === "write" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Example prompts:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {examplePrompts.map((example, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-left justify-start h-auto p-3 text-xs"
                        onClick={() => setPrompt(example)}
                      >
                        {example}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Progress Indicator */}
              {isLoading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {stageMessage || "Processing..."}
                    </span>
                    <span className="text-muted-foreground">{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              {/* Generate Button */}
              <div className="flex justify-center">
                <Button
                  onClick={handleGenerate}
                  disabled={isLoading || !prompt.trim() || (contentMode === "rewrite" && !previousContent.trim())}
                  className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white px-8 py-2"
                >
                  {isLoading ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      {contentMode === "write" ? "Generating..." : "Rewriting..."}
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      {contentMode === "write" ? "Generate Content" : "Rewrite Content"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Result Display */}
        {result && (
          <Card className="bg-card border border-border rounded-xl shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Generated Content</h3>
                  {resultMetadata && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {result.word_count} words • {result.character_count} characters • 
                      {resultMetadata.total_processing_time}s processing time
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleRewrite}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Rewrite
                  </Button>
                </div>
              </div>
              <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line bg-muted/20 border border-border rounded-lg p-4">
                {result.content}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features Card */}
        <Card className="bg-muted/30 border border-border rounded-xl">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-4">AI Writing Features</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-purple-500" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Multiple Styles</h4>
                  <p className="text-xs text-muted-foreground">Creative, professional, and academic modes</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">High Quality</h4>
                  <p className="text-xs text-muted-foreground">Well-structured and engaging content</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Versatile</h4>
                  <p className="text-xs text-muted-foreground">Blogs, emails, stories, and more</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Rewrite Support</h4>
                  <p className="text-xs text-muted-foreground">Improve and refine existing content</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
