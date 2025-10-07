"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, Calculator, CheckCircle, XCircle, Clock } from "lucide-react";
import { mathApi, type MathProblem } from "@/lib/math-api-client";
import { useNotifications } from "@/lib/notifications";

interface MathHistoryProps {
  onLoadProblem?: (problem: MathProblem) => void;
}

export default function MathHistory({ onLoadProblem }: MathHistoryProps) {
  const [history, setHistory] = useState<MathProblem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState<MathProblem | null>(null);

  const { showSuccess, showError } = useNotifications();

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setIsLoading(true);
      const historyData = await mathApi.getHistory();
      setHistory(historyData);
    } catch (error) {
      console.error("Failed to load history:", error);
      showError("Error", "Failed to load math history");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadProblem = async (problemId: number) => {
    try {
      setIsLoading(true);
      const problem = await mathApi.getProblem(problemId);
      setSelectedProblem(problem);
      if (onLoadProblem) {
        onLoadProblem(problem);
      }
      showSuccess("Success", "Problem loaded!");
    } catch (error) {
      console.error("Failed to load problem:", error);
      showError("Error", "Failed to load problem");
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTopicColor = (topic: string) => {
    const colors = [
      "bg-blue-100 text-blue-800",
      "bg-purple-100 text-purple-800",
      "bg-indigo-100 text-indigo-800",
      "bg-pink-100 text-pink-800",
      "bg-cyan-100 text-cyan-800",
    ];
    const index = topic.length % colors.length;
    return colors[index];
  };

  if (isLoading && history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="text-indigo-600" size={20} />
            Math History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-sm text-muted-foreground">Loading history...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <History className="text-indigo-600" size={20} />
            Math History
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadHistory}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8">
            <Calculator className="mx-auto text-muted-foreground mb-4" size={48} />
            <p className="text-muted-foreground">No math problems yet</p>
            <p className="text-sm text-muted-foreground">
              Generate your first problem to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {history.map((problem) => (
              <div
                key={problem.id}
                className={`p-4 border rounded-lg transition hover:shadow-md ${
                  selectedProblem?.id === problem.id
                    ? "border-indigo-300 bg-indigo-50"
                    : "border-border bg-background"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Problem #{problem.id}
                      </span>
                      <Badge className={getTopicColor(problem.topic)}>
                        {problem.topic}
                      </Badge>
                      <Badge className={getDifficultyColor(problem.difficulty)}>
                        {problem.difficulty}
                      </Badge>
                      {problem.solved && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle size={12} className="mr-1" />
                          Solved
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-foreground line-clamp-2 mb-2">
                      {problem.problem}
                    </p>
                    {problem.created_at && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock size={12} />
                        {new Date(problem.created_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoadProblem(problem.id)}
                      disabled={isLoading}
                    >
                      Load
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
