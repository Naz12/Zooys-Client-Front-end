"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { writerApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications";
import { PenTool, ArrowLeft, Settings, Sparkles, Copy, Download } from "lucide-react";
import Link from "next/link";

export default function WriterPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  
  const [prompt, setPrompt] = useState("");
  const [mode, setMode] = useState("creative");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  const handleGenerate = async () => {
    if (!user) {
      showError("Error", "Please log in to use this feature");
      return;
    }

    if (!prompt.trim()) {
      showError("Error", "Please enter a prompt");
      return;
    }

    setIsLoading(true);
    setResult("");

    try {
      const response = await aiToolsApi.generateContent(prompt.trim(), mode);
      setResult(response.output);
      showSuccess("Success", "Content generated successfully!");
    } catch (error) {
      console.error("Generation error:", error);
      showError("Error", error instanceof Error ? error.message : "Failed to generate content");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    showSuccess("Success", "Content copied to clipboard!");
  };

  const handleDownload = () => {
    const blob = new Blob([result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-generated-content.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const writingModes = [
    { id: "creative", label: "Creative", description: "Imaginative and artistic writing" },
    { id: "professional", label: "Professional", description: "Business and formal writing" },
    { id: "academic", label: "Academic", description: "Research and scholarly writing" },
    { id: "casual", label: "Casual", description: "Friendly and conversational tone" },
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
    <>

      {/* Main Content */}
      <div className="space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Input Card */}
          <Card className="bg-card border border-border rounded-xl shadow-md">
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-semibold mb-2">Generate Content</h2>
                  <p className="text-muted-foreground">
                    Describe what you want to write and let AI help you create it
                  </p>
                </div>

                {/* Writing Mode Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Writing Mode:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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

                {/* Prompt Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">What would you like to write?</label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe your content idea, topic, or specific requirements..."
                    className="w-full min-h-[120px] rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={4}
                  />
                </div>

                {/* Example Prompts */}
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

                {/* Generate Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt.trim()}
                    className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white px-8 py-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Content
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
                  <h3 className="text-lg font-semibold">Generated Content</h3>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={handleCopy}>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownload}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </div>
                <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line bg-muted/20 border border-border rounded-lg p-4">
                  {result}
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
                    <p className="text-xs text-muted-foreground">Creative, professional, academic, and casual</p>
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
                    <h4 className="font-medium text-sm">Customizable</h4>
                    <p className="text-xs text-muted-foreground">Adjust tone and style to your needs</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
