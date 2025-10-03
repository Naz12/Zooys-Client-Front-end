"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { aiToolsApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications";
import { Calculator, ArrowLeft, Settings, CheckCircle, Copy } from "lucide-react";
import Link from "next/link";

export default function MathSolverPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  
  const [problem, setProblem] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  const handleSolve = async () => {
    if (!user) {
      showError("Error", "Please log in to use this feature");
      return;
    }

    if (!problem.trim()) {
      showError("Error", "Please enter a math problem");
      return;
    }

    setIsLoading(true);
    setResult("");

    try {
      const response = await aiToolsApi.solveMath(problem.trim());
      setResult(response.solution);
      showSuccess("Success", "Math problem solved!");
    } catch (error) {
      console.error("Math solving error:", error);
      showError("Error", error instanceof Error ? error.message : "Failed to solve math problem");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    showSuccess("Success", "Solution copied to clipboard!");
  };

  const exampleProblems = [
    "Solve for x: 2x + 5 = 15",
    "Find the derivative of x² + 3x + 2",
    "Calculate the area of a circle with radius 5",
    "Solve the quadratic equation: x² - 4x + 3 = 0",
    "Find the integral of 2x + 1",
    "What is 15% of 200?",
  ];

  const mathCategories = [
    { name: "Algebra", examples: ["2x + 3 = 7", "x² - 5x + 6 = 0"] },
    { name: "Calculus", examples: ["d/dx(x²)", "∫(2x + 1)dx"] },
    { name: "Geometry", examples: ["Area of triangle", "Volume of sphere"] },
    { name: "Statistics", examples: ["Mean and median", "Standard deviation"] },
    { name: "Trigonometry", examples: ["sin(30°)", "cos(π/4)"] },
    { name: "Arithmetic", examples: ["15% of 200", "√144"] },
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
                  <h2 className="text-xl font-semibold mb-2">Enter Math Problem</h2>
                  <p className="text-muted-foreground">
                    Type your math problem and get a detailed solution
                  </p>
                </div>

                {/* Problem Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Math Problem:</label>
                  <textarea
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    placeholder="Enter your math problem here (e.g., Solve for x: 2x + 5 = 15)"
                    className="w-full min-h-[100px] rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                </div>

                {/* Example Problems */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Example problems:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {exampleProblems.map((example, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-left justify-start h-auto p-3 text-xs"
                        onClick={() => setProblem(example)}
                      >
                        {example}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Solve Button */}
                <div className="flex justify-center">
                  <Button
                    onClick={handleSolve}
                    disabled={isLoading || !problem.trim()}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Solving...
                      </>
                    ) : (
                      <>
                        <Calculator className="mr-2 h-4 w-4" />
                        Solve Problem
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
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <h3 className="text-lg font-semibold">Solution</h3>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </Button>
                </div>
                <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line bg-muted/20 border border-border rounded-lg p-4">
                  {result}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Math Categories */}
          <Card className="bg-muted/30 border border-border rounded-xl">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Supported Math Topics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {mathCategories.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <h4 className="font-medium text-sm">{category.name}</h4>
                    <div className="space-y-1">
                      {category.examples.map((example, exampleIndex) => (
                        <div
                          key={exampleIndex}
                          className="text-xs text-muted-foreground bg-background rounded px-2 py-1 cursor-pointer hover:bg-muted"
                          onClick={() => setProblem(example)}
                        >
                          {example}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Features Card */}
          <Card className="bg-muted/30 border border-border rounded-xl">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">AI Math Solver Features</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Step-by-Step Solutions</h4>
                    <p className="text-xs text-muted-foreground">Detailed explanations for each step</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Multiple Topics</h4>
                    <p className="text-xs text-muted-foreground">Algebra, calculus, geometry, and more</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Natural Language</h4>
                    <p className="text-xs text-muted-foreground">Type problems in plain English</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Educational</h4>
                    <p className="text-xs text-muted-foreground">Learn while solving problems</p>
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
