// Mock Math API Client for testing when backend endpoints are not available
import { MathProblem, MathSolution, MathProblemResponse, MathSolveResponse, MathHelpResponse, MathStats } from './math-api-client';

// Mock data
const mockProblems: MathProblem[] = [
  {
    id: 1,
    problem_text: "What is 2 + 2?",
    problem_image: null,
    subject_area: "arithmetic",
    difficulty_level: "easy",
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    problem_text: "Solve for x: 2x + 5 = 13",
    problem_image: null,
    subject_area: "algebra",
    difficulty_level: "intermediate",
    created_at: new Date().toISOString()
  }
];

const mockSolutions: MathSolution[] = [
  {
    id: 1,
    solution_method: "Basic arithmetic",
    step_by_step_solution: "2 + 2 = 4",
    final_answer: "4",
    explanation: "This is a simple addition problem.",
    verification: "4 - 2 = 2, which confirms our answer.",
    created_at: new Date().toISOString()
  }
];

// Mock API client
export class MockMathApiClient {
  private delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  async solveMathProblem(request: any): Promise<MathProblemResponse> {
    await this.delay(1000); // Simulate API delay
    
    const newProblem: MathProblem = {
      id: mockProblems.length + 1,
      problem_text: request.problem_text,
      problem_image: request.problem_image || null,
      subject_area: request.subject_area || "general",
      difficulty_level: request.difficulty_level || "intermediate",
      created_at: new Date().toISOString()
    };

    const newSolution: MathSolution = {
      id: mockSolutions.length + 1,
      solution_method: "AI-powered solution",
      step_by_step_solution: `Step 1: Analyze the problem: ${request.problem_text}\nStep 2: Apply appropriate mathematical method\nStep 3: Calculate the result`,
      final_answer: "Solution will be calculated based on the problem",
      explanation: "This is a mock solution generated for testing purposes.",
      verification: "The solution has been verified using mathematical principles.",
      created_at: new Date().toISOString()
    };

    return {
      math_problem: newProblem,
      math_solution: newSolution,
      ai_result: {
        id: 1,
        title: "Math Problem Solution",
        file_url: "",
        created_at: new Date().toISOString()
      }
    };
  }

  async getHistory(): Promise<MathProblem[]> {
    await this.delay(500);
    return mockProblems;
  }

  async getStats(): Promise<MathStats> {
    await this.delay(300);
    return {
      total_problems: mockProblems.length,
      problems_by_subject: {
        "arithmetic": 1,
        "algebra": 1
      },
      problems_by_difficulty: {
        "easy": 1,
        "intermediate": 1
      },
      recent_activity: mockProblems.slice(0, 3),
      success_rate: 85.5
    };
  }

  async getTopics(): Promise<string[]> {
    await this.delay(200);
    return ["arithmetic", "algebra", "geometry", "calculus", "statistics"];
  }

  async getDifficulties(): Promise<string[]> {
    await this.delay(200);
    return ["easy", "intermediate", "hard", "expert"];
  }

  async getProblem(id: number): Promise<MathProblem> {
    await this.delay(300);
    const problem = mockProblems.find(p => p.id === id);
    if (!problem) {
      throw new Error(`Problem with id ${id} not found`);
    }
    return problem;
  }

  async deleteProblem(id: number): Promise<{ message: string }> {
    await this.delay(500);
    return { message: `Problem ${id} deleted successfully` };
  }

  async updateProblem(id: number, request: any): Promise<{ id: number; problem: string; updated: boolean }> {
    await this.delay(500);
    return {
      id,
      problem: request.topic || "Updated problem",
      updated: true
    };
  }

  async getHelp(request: any): Promise<MathHelpResponse> {
    await this.delay(800);
    return {
      help: "Here's some help with your math problem. Try breaking it down into smaller steps.",
      hint: "Look for patterns or use algebraic manipulation.",
      next_step: "Try substituting values or using a different approach."
    };
  }

  async solveProblem(request: any): Promise<MathSolveResponse> {
    await this.delay(1000);
    return {
      correct: true,
      user_solution: request.user_solution,
      correct_solution: "The correct solution would be calculated here",
      explanation: "Your solution appears to be correct based on the mathematical principles involved.",
      points_earned: 10
    };
  }
}

// Export mock instance
export const mockMathApi = new MockMathApiClient();
