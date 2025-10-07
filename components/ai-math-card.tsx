"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Calculator, History, TrendingUp, HelpCircle } from "lucide-react";
import { mathApi, type MathProblem, type MathStats } from "@/lib/math-api-client";
import { useNotifications } from "@/lib/notifications";

type Example = {
  id: number;
  type: "text" | "photo" | "pdf";
  content: string;
  img?: string;
};

export default function AiMathCard() {
  const [examples] = useState<Example[]>([
    {
      id: 1,
      type: "text",
      content:
        "A right triangle has one leg that is 6 cm long and the hypotenuse is 10 cm. What is the length of the other leg?",
    },
    {
      id: 2,
      type: "photo",
      img: "/math-example1.png",
      content: "Solve for R?",
    },
    {
      id: 3,
      type: "photo",
      img: "/math-example2.png",
      content: "√x + 4 = 2024",
    },
    {
      id: 4,
      type: "pdf",
      content:
        "1. Solve for x: 2x - 4 = 10\n2. Find the area of a circle with r = 5cm\n3. Solve system of equations: y = 3x + 2, y = -x + 4",
    },
  ]);

  // State management
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
  const [userSolution, setUserSolution] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [topics, setTopics] = useState<string[]>([]);
  const [difficulties, setDifficulties] = useState<string[]>([]);
  const [selectedTopic, setSelectedTopic] = useState("algebra");
  const [selectedDifficulty, setSelectedDifficulty] = useState("medium");
  const [mathStats, setMathStats] = useState<MathStats | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<MathProblem[]>([]);
  const [solutionResult, setSolutionResult] = useState<{correct: boolean, explanation: string} | null>(null);
  const [helpText, setHelpText] = useState<string>("");

  const { showSuccess, showError, showWarning } = useNotifications();

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [topicsData, difficultiesData, statsData] = await Promise.all([
        mathApi.getTopics(),
        mathApi.getDifficulties(),
        mathApi.getStats()
      ]);
      setTopics(topicsData);
      setDifficulties(difficultiesData);
      setMathStats(statsData);
    } catch (error) {
      console.error("Failed to load initial data:", error);
      showError("Error", "Failed to load math data");
    } finally {
      setIsLoading(false);
    }
  };

  // Generate new math problem
  const generateProblem = async () => {
    try {
      setIsLoading(true);
      const response = await mathApi.generateProblem({
        topic: selectedTopic,
        difficulty: selectedDifficulty
      });
      
      const problem: MathProblem = {
        id: response.id,
        problem: response.problem,
        topic: selectedTopic,
        difficulty: selectedDifficulty
      };
      
      setCurrentProblem(problem);
      setUserSolution("");
      setSolutionResult(null);
      setHelpText("");
      showSuccess("Success", "New problem generated!");
    } catch (error) {
      console.error("Failed to generate problem:", error);
      showError("Error", "Failed to generate math problem");
    } finally {
      setIsLoading(false);
    }
  };

  // Solve current problem
  const solveProblem = async () => {
    if (!currentProblem || !userSolution.trim()) {
      showWarning("Warning", "Please enter your solution");
      return;
    }

    try {
      setIsLoading(true);
      const response = await mathApi.solveProblem({
        problem_id: currentProblem.id,
        user_solution: userSolution
      });
      
      setSolutionResult({
        correct: response.correct,
        explanation: response.explanation
      });
      
      if (response.correct) {
        showSuccess("Success", "Correct! Well done!");
      } else {
        showWarning("Warning", "Not quite right. Check the explanation.");
      }
    } catch (error) {
      console.error("Failed to solve problem:", error);
      showError("Error", "Failed to check solution");
    } finally {
      setIsLoading(false);
    }
  };

  // Get help for current problem
  const getHelp = async () => {
    if (!currentProblem) {
      showWarning("Warning", "No problem selected");
      return;
    }

    try {
      setIsLoading(true);
      const response = await mathApi.getHelp({
        problem_id: currentProblem.id,
        question: "How do I solve this problem?"
      });
      
      setHelpText(response.help);
      showSuccess("Success", "Help provided!");
    } catch (error) {
      console.error("Failed to get help:", error);
      showError("Error", "Failed to get help");
    } finally {
      setIsLoading(false);
    }
  };

  // Load math history
  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const historyData = await mathApi.getHistory();
      setHistory(historyData);
      setShowHistory(true);
    } catch (error) {
      console.error("Failed to load history:", error);
      showError("Error", "Failed to load math history");
    } finally {
      setIsLoading(false);
    }
  };

  // Load specific problem
  const loadProblem = async (problemId: number) => {
    try {
      setIsLoading(true);
      const problem = await mathApi.getProblem(problemId);
      setCurrentProblem(problem);
      setUserSolution("");
      setSolutionResult(null);
      setHelpText("");
      setShowHistory(false);
      showSuccess("Success", "Problem loaded!");
    } catch (error) {
      console.error("Failed to load problem:", error);
      showError("Error", "Failed to load problem");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-card border border-border rounded-2xl shadow-lg transition hover:shadow-xl">
      <CardContent className="p-8 space-y-8">
        {/* Header with stats */}
        {mathStats && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <TrendingUp className="text-indigo-600" size={20} />
                <div className="text-sm">
                  <span className="font-medium text-indigo-700">Math Progress:</span>
                  <span className="ml-2 text-indigo-600">
                    {mathStats.solved}/{mathStats.total_problems} solved 
                    ({Math.round(mathStats.accuracy * 100)}% accuracy)
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadHistory}
                  className="text-xs"
                >
                  <History size={14} className="mr-1" />
                  History
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Problem generation controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Topic
            </label>
            <select
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            >
              {topics.map((topic) => (
                <option key={topic} value={topic}>
                  {topic.charAt(0).toUpperCase() + topic.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Difficulty
            </label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            >
              {difficulties.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button
              onClick={generateProblem}
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              <Calculator className="mr-2" size={16} />
              {isLoading ? "Generating..." : "Generate Problem"}
            </Button>
          </div>
        </div>

        {/* Current problem display */}
        {currentProblem && (
          <div className="bg-background border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Problem #{currentProblem.id}
                </span>
                <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                  {currentProblem.topic} • {currentProblem.difficulty}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={getHelp}
                disabled={isLoading}
                className="text-xs"
              >
                <HelpCircle size={14} className="mr-1" />
                Get Help
              </Button>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium text-foreground">
                {currentProblem.problem}
              </p>
            </div>

            {/* Help text */}
            {helpText && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Hint:</strong> {helpText}
                </p>
              </div>
            )}

            {/* Solution input */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground">
                Your Solution:
              </label>
              <textarea
                value={userSolution}
                onChange={(e) => setUserSolution(e.target.value)}
                placeholder="Enter your solution here..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  onClick={solveProblem}
                  disabled={isLoading || !userSolution.trim()}
                  className="bg-green-600 hover:bg-green-500 text-white"
                >
                  {isLoading ? "Checking..." : "Check Solution"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setUserSolution("");
                    setSolutionResult(null);
                    setHelpText("");
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Solution result */}
            {solutionResult && (
              <div className={`border rounded-lg p-4 ${
                solutionResult.correct 
                  ? "bg-green-50 border-green-200" 
                  : "bg-red-50 border-red-200"
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-sm font-medium ${
                    solutionResult.correct ? "text-green-800" : "text-red-800"
                  }`}>
                    {solutionResult.correct ? "✓ Correct!" : "✗ Incorrect"}
                  </span>
                </div>
                <p className={`text-sm ${
                  solutionResult.correct ? "text-green-700" : "text-red-700"
                }`}>
                  {solutionResult.explanation}
                </p>
              </div>
            )}
          </div>
        )}

        {/* History modal */}
        {showHistory && (
          <div className="bg-background border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Math History</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHistory(false)}
              >
                Close
              </Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {history.map((problem) => (
                <div
                  key={problem.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium line-clamp-2">
                      {problem.problem}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                        {problem.topic}
                      </span>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                        {problem.difficulty}
                      </span>
                      {problem.solved && (
                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                          Solved
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadProblem(problem.id)}
                    className="ml-2"
                  >
                    Load
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Extension banner */}
        <div className="bg-background border border-border rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
          <p className="text-sm font-medium text-center md:text-left">
            <span className="font-semibold text-indigo-500">
              AI Math Solver
            </span>{" "}
            – Generate, solve, and learn with AI-powered math problems.
          </p>
          <Button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs px-4 py-2 rounded-full shadow">
            🚀 Try Now
          </Button>
        </div>

        {/* Examples */}
        <section>
          <h3 className="text-sm font-semibold mb-4 text-muted-foreground">
            Example Problems
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {examples.map((ex) => (
              <div
                key={ex.id}
                className="bg-background border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition flex flex-col gap-2"
              >
                <span
                  className={`self-start text-xs px-2 py-0.5 rounded-full font-medium ${
                    ex.type === "text"
                      ? "bg-indigo-500 text-white"
                      : ex.type === "photo"
                      ? "bg-pink-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {ex.type.charAt(0).toUpperCase() + ex.type.slice(1)}
                </span>

                {ex.img ? (
                  <img
                    src={ex.img}
                    alt="example"
                    className="w-full aspect-video object-contain rounded-md bg-muted"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-line">
                    {ex.content}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
