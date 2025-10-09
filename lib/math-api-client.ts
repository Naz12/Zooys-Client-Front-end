import { ApiClient } from './api-client';

export interface MathProblem {
  id: number;
  problem_text: string | null;
  problem_image: string | null;
  file_url?: string;
  subject_area: string;
  difficulty_level: string;
  problem_type?: 'text' | 'image';
  created_at: string;
  solutions?: MathSolution[];
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

export interface MathProblemsResponse {
  math_problems: MathProblem[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface MathProblemDetailResponse {
  math_problem: MathProblem;
}

export interface MathHistoryParams {
  per_page?: number;
  subject?: string;
  difficulty?: string;
}

export interface MathProblemsParams {
  page?: number;
  per_page?: number;
  subject?: string;
  difficulty?: string;
}

export interface MathStats {
  total_problems: number;
  problems_by_subject: Record<string, number>;
  problems_by_difficulty: Record<string, number>;
  recent_activity: Array<{
    date: string;
    count: number;
  }>;
  success_rate: number;
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
   * Solve a math problem from an image
   */
  async solveMathProblemWithImage(
    imageFile: File, 
    subjectArea: string = 'maths',
    difficultyLevel: string = 'intermediate'
  ): Promise<MathProblemResponse> {
    console.log('Creating FormData with image:', imageFile.name, imageFile.size);
    
    const formData = new FormData();
    formData.append('problem_image', imageFile);
    formData.append('subject_area', subjectArea);
    formData.append('difficulty_level', difficultyLevel);

    console.log('FormData created with:', {
      problem_image: imageFile.name,
      subject_area: subjectArea,
      difficulty_level: difficultyLevel
    });

    return this.apiClient.post<MathProblemResponse>('/math/solve', formData);
  }


  /**
   * Get math problem history
   */
  async getHistory(params?: MathHistoryParams): Promise<MathProblem[]> {
    const queryParams = new URLSearchParams();
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.subject) queryParams.append('subject', params.subject);
    if (params?.difficulty) queryParams.append('difficulty', params.difficulty);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/math/history?${queryString}` : '/math/history';
    return this.apiClient.get<MathProblem[]>(endpoint);
  }

  /**
   * Get paginated math problems
   */
  async getProblems(params?: MathProblemsParams): Promise<MathProblemsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.subject) queryParams.append('subject', params.subject);
    if (params?.difficulty) queryParams.append('difficulty', params.difficulty);
    
    const queryString = queryParams.toString();
    const endpoint = queryString ? `/math/problems?${queryString}` : '/math/problems';
    return this.apiClient.get<MathProblemsResponse>(endpoint);
  }

  /**
   * Get a specific math problem by ID with solutions
   */
  async getProblem(id: number): Promise<MathProblemDetailResponse> {
    return this.apiClient.get<MathProblemDetailResponse>(`/math/problems/${id}`);
  }

  /**
   * Delete a math problem
   */
  async deleteProblem(id: number): Promise<MathDeleteResponse> {
    return this.apiClient.delete<MathDeleteResponse>(`/math/problems/${id}`);
  }


  /**
   * Get math statistics
   */
  async getStats(): Promise<MathStats> {
    return this.apiClient.get<MathStats>('/math/stats');
  }

}

// Export singleton instance
export const mathApi = new MathApiClient();

