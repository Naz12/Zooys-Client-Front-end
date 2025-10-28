"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { diagramApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications";
import { Network, ArrowLeft, Settings, Download, Copy, RotateCcw } from "lucide-react";
import Link from "next/link";

export default function DiagramsPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  const handleGenerate = async () => {
    if (!user) {
      showError("Error", "Please log in to use this feature");
      return;
    }

    if (!description.trim()) {
      showError("Error", "Please enter a description");
      return;
    }

    setIsLoading(true);
    setResult("");

    try {
      const response = await aiToolsApi.generateDiagram(description.trim());
      setResult(response.diagram);
      showSuccess("Success", "Diagram generated successfully!");
    } catch (error) {
      console.error("Diagram generation error:", error);
      showError("Error", error instanceof Error ? error.message : "Failed to generate diagram");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    showSuccess("Success", "Diagram copied to clipboard!");
  };

  const handleDownload = () => {
    const blob = new Blob([result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-generated-diagram.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const exampleDescriptions = [
    "Create a flowchart for user registration process",
    "Draw a network diagram for a small office",
    "Design a database schema for an e-commerce site",
    "Create a mind map for project planning",
    "Draw a system architecture diagram",
    "Design a user journey map for online shopping",
  ];

  const diagramTypes = [
    { name: "Flowcharts", description: "Process flows and decision trees" },
    { name: "Network Diagrams", description: "Network topology and connections" },
    { name: "Database Schemas", description: "Database structure and relationships" },
    { name: "System Architecture", description: "Software and system design" },
    { name: "Mind Maps", description: "Ideas and concept mapping" },
    { name: "User Journeys", description: "User experience flows" },
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
                  <h2 className="text-xl font-semibold mb-2">Describe Your Diagram</h2>
                  <p className="text-muted-foreground">
                    Tell us what kind of diagram you need and we'll create it
                  </p>
                </div>

                {/* Description Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Diagram Description:</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the diagram you want to create (e.g., Create a flowchart for user login process)"
                    className="w-full min-h-[120px] rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    rows={4}
                  />
                </div>

                {/* Example Descriptions */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Example descriptions:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {exampleDescriptions.map((example, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-left justify-start h-auto p-3 text-xs"
                        onClick={() => setDescription(example)}
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
                    disabled={isLoading || !description.trim()}
                    className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white px-8 py-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Network className="mr-2 h-4 w-4" />
                        Generate Diagram
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
                  <h3 className="text-lg font-semibold">Generated Diagram</h3>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={handleRegenerate}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Regenerate
                    </Button>
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

          {/* Diagram Types */}
          <Card className="bg-muted/30 border border-border rounded-xl">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Supported Diagram Types</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {diagramTypes.map((type, index) => (
                  <div key={index} className="space-y-2">
                    <h4 className="font-medium text-sm">{type.name}</h4>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Features Card */}
          <Card className="bg-muted/30 border border-border rounded-xl">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">AI Diagram Features</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Multiple Formats</h4>
                    <p className="text-xs text-muted-foreground">Flowcharts, network diagrams, schemas</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Professional Quality</h4>
                    <p className="text-xs text-muted-foreground">Clean, professional diagrams</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Natural Language</h4>
                    <p className="text-xs text-muted-foreground">Describe in plain English</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Export Options</h4>
                    <p className="text-xs text-muted-foreground">Download or copy your diagrams</p>
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
