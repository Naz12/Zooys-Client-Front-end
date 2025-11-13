"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { diagramApi } from "@/lib/api";
import type { DiagramGenerateRequest } from "@/lib/api/ai-tools/diagram-api";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications";
import {
  Network,
  Loader2,
  Download,
  Copy,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import type { JobStatusResponse, JobResultResponse } from "@/lib/types/api";

const DIAGRAM_TYPES = [
  { value: "flowchart", label: "Flowchart", category: "graph" },
  { value: "sequence", label: "Sequence Diagram", category: "graph" },
  { value: "class", label: "Class Diagram", category: "graph" },
  { value: "state", label: "State Diagram", category: "graph" },
  { value: "er", label: "ER Diagram", category: "graph" },
  { value: "user_journey", label: "User Journey", category: "graph" },
  { value: "block", label: "Block Diagram", category: "graph" },
  { value: "mindmap", label: "Mind Map", category: "graph" },
  { value: "pie", label: "Pie Chart", category: "chart" },
  { value: "quadrant", label: "Quadrant Chart", category: "chart" },
  { value: "timeline", label: "Timeline", category: "chart" },
  { value: "sankey", label: "Sankey Diagram", category: "chart" },
  { value: "xy", label: "XY Chart", category: "chart" },
];

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "zh", label: "Chinese" },
  { value: "ja", label: "Japanese" },
];

export default function DiagramsPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();

  const [prompt, setPrompt] = useState("");
  const [diagramType, setDiagramType] = useState("flowchart");
  const [language, setLanguage] = useState("en");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>("");
  const [stage, setStage] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [pollUrl, setPollUrl] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cleanup polling on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const startPolling = async (jobId: string, pollUrl?: string, resultUrl?: string) => {
    setIsPolling(true);
    setProgress(0);
    setStatus("pending");
    setError(null);

    const poll = async () => {
      try {
        let statusResponse: JobStatusResponse;

        if (pollUrl) {
          statusResponse = await diagramApi.getJobStatusByUrl(pollUrl);
        } else {
          statusResponse = await diagramApi.getJobStatus(jobId);
        }

        // Handle both wrapped and direct response structures
        const statusData = (statusResponse as any).data || statusResponse;
        const currentStatus = statusData.status || statusResponse.status;
        const currentProgress = statusData.progress ?? statusResponse.progress ?? 0;
        const currentStage = statusData.stage || statusResponse.stage || "";

        setStatus(currentStatus);
        setProgress(currentProgress);
        setStage(currentStage);

        if (currentStatus === "completed") {
          // Get the result
          let resultResponse: JobResultResponse;
          if (resultUrl) {
            resultResponse = await diagramApi.getJobResultByUrl(resultUrl);
          } else {
            resultResponse = await diagramApi.getJobResult(jobId);
          }

          // Handle both wrapped and direct response structures
          const resultData = (resultResponse as any).data || resultResponse;
          const diagramData = resultData.data || resultData;

          if (diagramData?.image_url) {
            setImageUrl(diagramData.image_url);
            showSuccess("Success", "Diagram generated successfully!");
          } else {
            setError("No image URL found in result");
            showError("Error", "Failed to get diagram image");
          }

          setIsPolling(false);
          setIsGenerating(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        } else if (currentStatus === "failed") {
          const errorMessage = statusData.error || statusResponse.error || "Job failed";
          setError(errorMessage);
          showError("Error", errorMessage);
          setIsPolling(false);
          setIsGenerating(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
        setError(error instanceof Error ? error.message : "Polling failed");
        setIsPolling(false);
        setIsGenerating(false);
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      }
    };

    // Poll immediately, then every 2-3 seconds
    poll();
    pollingIntervalRef.current = setInterval(poll, 2500);
  };

  const handleGenerate = async () => {
    if (!user) {
      showError("Error", "Please log in to use this feature");
      return;
    }

    if (!prompt.trim()) {
      showError("Error", "Please enter a prompt");
      return;
    }

    if (!diagramType) {
      showError("Error", "Please select a diagram type");
      return;
    }

    setIsGenerating(true);
    setImageUrl(null);
    setError(null);
    setProgress(0);
    setStatus("");
    setStage("");

    try {
      const request: DiagramGenerateRequest = {
        prompt: prompt.trim(),
        diagram_type: diagramType,
        language: language,
      };

      const response = await diagramApi.generate(request);

      // Handle both wrapped and direct response structures
      const responseData = (response as any).data || response;
      const jobIdValue = responseData.job_id || response.job_id;
      const pollUrlValue = responseData.poll_url || response.poll_url;
      const resultUrlValue = responseData.result_url || response.result_url;

      if (jobIdValue) {
        setJobId(jobIdValue);
        setPollUrl(pollUrlValue || null);
        setResultUrl(resultUrlValue || null);
        startPolling(jobIdValue, pollUrlValue, resultUrlValue);
      } else {
        setError("No job ID received from server");
        showError("Error", "Failed to start diagram generation");
        setIsGenerating(false);
      }
    } catch (error) {
      console.error("Diagram generation error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to generate diagram";
      setError(errorMessage);
      showError("Error", errorMessage);
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (imageUrl) {
      navigator.clipboard.writeText(imageUrl);
      showSuccess("Success", "Image URL copied to clipboard!");
    }
  };

  const handleDownload = () => {
    if (imageUrl) {
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `diagram-${Date.now()}.png`;
      link.click();
    }
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const selectedDiagramType = DIAGRAM_TYPES.find((dt) => dt.value === diagramType);

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          AI Diagram Generator
        </h1>
        <p className="text-muted-foreground">
          Create professional diagrams from natural language descriptions
        </p>
      </div>

      {/* Split Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Left Side - Form */}
        <Card className="bg-card border border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Generate Diagram
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Prompt Input */}
            <div className="space-y-2">
              <Label htmlFor="prompt">Diagram Prompt</Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the diagram you want to create (e.g., User login process: Start -> Enter credentials -> Validate -> Success or Error -> End)"
                className="min-h-[120px] resize-none"
                rows={5}
              />
              <p className="text-xs text-muted-foreground">
                {prompt.length}/2000 characters
              </p>
            </div>

            {/* Diagram Type Selector */}
            <div className="space-y-2">
              <Label htmlFor="diagram-type">Diagram Type</Label>
              <Select value={diagramType} onValueChange={setDiagramType}>
                <SelectTrigger id="diagram-type">
                  <SelectValue placeholder="Select diagram type" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Graph-based
                  </div>
                  {DIAGRAM_TYPES.filter((dt) => dt.category === "graph").map((dt) => (
                    <SelectItem key={dt.value} value={dt.value}>
                      {dt.label}
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground mt-2">
                    Chart-based
                  </div>
                  {DIAGRAM_TYPES.filter((dt) => dt.category === "chart").map((dt) => (
                    <SelectItem key={dt.value} value={dt.value}>
                      {dt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedDiagramType && (
                <p className="text-xs text-muted-foreground">
                  {selectedDiagramType.category === "graph"
                    ? "Graph-based diagram using Graphviz"
                    : "Chart-based diagram using matplotlib/plotly"}
                </p>
              )}
            </div>

            {/* Language Selector */}
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || isPolling || !prompt.trim()}
              className="w-full"
              size="lg"
            >
              {isGenerating || isPolling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isPolling ? "Generating..." : "Starting..."}
                </>
              ) : (
                <>
                  <Network className="mr-2 h-4 w-4" />
                  Generate Diagram
                </>
              )}
            </Button>

            {/* Progress Bar */}
            {(isGenerating || isPolling) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {stage ? `Stage: ${stage}` : "Processing..."}
                  </span>
                  <span className="text-muted-foreground">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                {status && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {status === "completed" ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : status === "failed" ? (
                      <AlertCircle className="h-3 w-3 text-red-500" />
                    ) : (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    )}
                    <span className="capitalize">{status}</span>
                  </div>
                )}
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-destructive">Error</p>
                    <p className="text-xs text-destructive/80 mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Side - Result Display */}
        <Card className="bg-card border border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Generated Diagram
              </CardTitle>
              {imageUrl && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    title="Copy image URL"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    title="Download image"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerate}
                    title="Regenerate"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {imageUrl ? (
              <div className="space-y-4">
                <div className="relative w-full bg-muted rounded-lg overflow-hidden border border-border">
                  <img
                    src={imageUrl}
                    alt="Generated diagram"
                    className="w-full h-auto object-contain"
                    onError={() => {
                      setError("Failed to load image");
                      showError("Error", "Failed to load diagram image");
                    }}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>
                    <strong>Type:</strong> {selectedDiagramType?.label || diagramType}
                  </p>
                  <p className="mt-1">
                    <strong>Language:</strong>{" "}
                    {LANGUAGES.find((l) => l.value === language)?.label || language}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
                {isGenerating || isPolling ? (
                  <>
                    <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">
                        Generating your diagram...
                      </p>
                      <p className="text-xs text-muted-foreground">
                        This may take 30-120 seconds
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">
                        No diagram generated yet
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Fill out the form and click "Generate Diagram" to create your diagram
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
