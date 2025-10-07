"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  Calculator, 
  CheckCircle, 
  Target, 
  Award,
  BarChart3,
  Clock
} from "lucide-react";
import { mathApi, type MathStats } from "@/lib/math-api-client";
import { useNotifications } from "@/lib/notifications";

export default function MathStats() {
  const [stats, setStats] = useState<MathStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { showError } = useNotifications();

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const statsData = await mathApi.getStats();
      setStats(statsData);
    } catch (error) {
      console.error("Failed to load stats:", error);
      showError("Error", "Failed to load math statistics");
    } finally {
      setIsLoading(false);
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 0.8) return "text-green-600";
    if (accuracy >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getAccuracyBadgeColor = (accuracy: number) => {
    if (accuracy >= 0.8) return "bg-green-100 text-green-800";
    if (accuracy >= 0.6) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getPerformanceLevel = (accuracy: number) => {
    if (accuracy >= 0.9) return "Excellent";
    if (accuracy >= 0.8) return "Very Good";
    if (accuracy >= 0.7) return "Good";
    if (accuracy >= 0.6) return "Fair";
    return "Needs Improvement";
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="text-indigo-600" size={20} />
            Math Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <span className="ml-2 text-sm text-muted-foreground">Loading stats...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="text-indigo-600" size={20} />
            Math Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calculator className="mx-auto text-muted-foreground mb-4" size={48} />
            <p className="text-muted-foreground">No statistics available yet</p>
            <p className="text-sm text-muted-foreground">
              Start solving problems to see your progress!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const accuracyPercentage = Math.round(stats.accuracy * 100);
  const remainingProblems = stats.total_problems - stats.solved;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="text-indigo-600" size={20} />
          Math Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Overall Progress</h3>
            <Badge className={getAccuracyBadgeColor(stats.accuracy)}>
              {getPerformanceLevel(stats.accuracy)}
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Calculator className="text-indigo-600" size={24} />
              </div>
              <div className="text-2xl font-bold text-indigo-600">
                {stats.total_problems}
              </div>
              <div className="text-sm text-muted-foreground">Total Problems</div>
            </div>
            
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <div className="text-2xl font-bold text-green-600">
                {stats.solved}
              </div>
              <div className="text-sm text-muted-foreground">Solved</div>
            </div>
            
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Target className="text-orange-600" size={24} />
              </div>
              <div className="text-2xl font-bold text-orange-600">
                {remainingProblems}
              </div>
              <div className="text-sm text-muted-foreground">Remaining</div>
            </div>
          </div>
        </div>

        {/* Accuracy Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Accuracy Rate</span>
            <span className={`text-sm font-bold ${getAccuracyColor(stats.accuracy)}`}>
              {accuracyPercentage}%
            </span>
          </div>
          <Progress 
            value={accuracyPercentage} 
            className="h-2"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Performance Insights */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Performance Insights</h4>
          <div className="space-y-2">
            {stats.accuracy >= 0.8 ? (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 p-2 rounded">
                <Award size={16} />
                <span>Excellent work! You're mastering math concepts.</span>
              </div>
            ) : stats.accuracy >= 0.6 ? (
              <div className="flex items-center gap-2 text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                <TrendingUp size={16} />
                <span>Good progress! Keep practicing to improve further.</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 p-2 rounded">
                <Target size={16} />
                <span>Focus on understanding concepts. Practice makes perfect!</span>
              </div>
            )}
            
            {stats.solved > 0 && (
              <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 p-2 rounded">
                <Clock size={16} />
                <span>
                  You've solved {stats.solved} problem{stats.solved !== 1 ? 's' : ''} so far!
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Ready for your next challenge?
            </p>
            <p className="text-xs text-muted-foreground">
              Generate a new problem to continue your math journey!
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
