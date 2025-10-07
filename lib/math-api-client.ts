import { ApiClient } from './api-client';

export interface MathProblem {
  id: number;
  problem_text: string;
  problem_image: string | null;
  subject_area: string;
  difficulty_level: string;
  created_at: string;
}

export interface MathSolution {
  id: number;
  solution_method: string;
  step_by_step_solution: string;
  final_answer: string;
  explanation: string;
  verification: string;
  created_at: string;
}

export interface MathProblemRequest {
  problem_text: string;
  subject_area?: string;
  difficulty_level?: string;
  problem_type?: 'text' | 'image';
  problem_image?: string;
}

export interface MathProblemResponse {
  math_problem: MathProblem;
  math_solution: MathSolution;
  ai_result: {
    id: number;
    title: string;
    file_url: string;
    created_at: string;
  };
}

export interface MathSolveRequest {
  problem_id: number;
  user_solution: string;
}

export interface MathSolveResponse {
  correct: boolean;
  user_solution: string;
  correct_solution?: string;
  explanation: string;
  points_earned?: number;
}

export interface MathHelpRequest {
  problem_id: number;
  question: string;
}

export interface MathHelpResponse {
  help: string;
  hint: string;
  next_step?: string;
}

export interface MathStats {
  total_problems: number;
  problems_by_subject: Record<string, number>;
  problems_by_difficulty: Record<string, number>;
  recent_activity: Array<{
    id: number;
    problem_text: string;
    subject_area: string;
    difficulty_level: string;
    created_at: string;
  }>;
  success_rate: number;
}

export interface MathUpdateRequest {
  topic: string;
  difficulty: string;
}

export interface MathUpdateResponse {
  id: number;
  problem: string;
  updated: boolean;
}

export interface MathDeleteResponse {
  message: string;
}

class MathApiClient {
  private apiClient: ApiClient;

  constructor() {
    this.apiClient = new ApiClient();
  }

  /**
   * Solve a math problem
   */
  async solveMathProblem(request: MathProblemRequest): Promise<MathProblemResponse> {
    return this.apiClient.post<MathProblemResponse>('/math/solve', request);
  }

  /**
   * Solve a math problem
   */
  async solveProblem(request: MathSolveRequest): Promise<MathSolveResponse> {
    return this.apiClient.post<MathSolveResponse>('/math/solve', request);
  }

  /**
   * Get math problem history
   */
  async getHistory(): Promise<MathProblem[]> {
    return this.apiClient.get<MathProblem[]>('/math/history');
  }

  /**
   * Get available math topics
   */
  async getTopics(): Promise<string[]> {
    return this.apiClient.get<string[]>('/client/math/topics');
  }

  /**
   * Get available difficulty levels
   */
  async getDifficulties(): Promise<string[]> {
    return this.apiClient.get<string[]>('/client/math/difficulties');
  }

  /**
   * Get a specific math problem by ID
   */
  async getProblem(id: number): Promise<MathProblem> {
    return this.apiClient.get<MathProblem>(`/math/problems/${id}`);
  }

  /**
   * Delete a math problem
   */
  async deleteProblem(id: number): Promise<MathDeleteResponse> {
    return this.apiClient.delete<MathDeleteResponse>(`/math/problems/${id}`);
  }

  /**
   * Update a math problem
   */
  async updateProblem(id: number, request: MathUpdateRequest): Promise<MathUpdateResponse> {
    return this.apiClient.put<MathUpdateResponse>(`/math/problems/${id}`, request);
  }

  /**
   * Get math statistics
   */
  async getStats(): Promise<MathStats> {
    return this.apiClient.get<MathStats>('/math/stats');
  }

  /**
   * Get help for a math problem
   */
  async getHelp(request: MathHelpRequest): Promise<MathHelpResponse> {
    return this.apiClient.post<MathHelpResponse>('/math/help', request);
  }
}

// Export singleton instance
export const mathApi = new MathApiClient();

