"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calculator, History, ChevronLeft, ChevronRight, FileText, Clock, Clipboard } from "lucide-react";
import { useNotifications } from "@/lib/notifications";
import { mathApi, type MathProblem } from "@/lib/math-api-client";
import EnhancedMathInput from "./enhanced-math-input";

export default function MathDashboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [solution, setSolution] = useState<string>("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [history, setHistory] = useState<MathProblem[]>([]);
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
  const [availableTopics, setAvailableTopics] = useState<string[]>(['arithmetic', 'algebra', 'geometry', 'calculus', 'statistics']);
  const [availableDifficulties, setAvailableDifficulties] = useState<string[]>(['beginner', 'intermediate', 'advanced']);
  
  // Image upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageMode, setIsImageMode] = useState(false);

  const { showSuccess, showError, showWarning } = useNotifications();

  useEffect(() => {
    loadHistory();
    // Load available options asynchronously without blocking
    loadAvailableOptions().catch(error => {
      console.log("Failed to load available options, continuing with defaults:", error);
    });
  }, []);

  // Add keyboard shortcut for pasting images
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if Ctrl+V (or Cmd+V on Mac) is pressed and we're in image mode
      if ((event.ctrlKey || event.metaKey) && event.key === 'v' && isImageMode) {
        event.preventDefault();
        handlePaste();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isImageMode]);

  const loadAvailableOptions = async () => {
    // For now, we'll use the default values that are already set
    // The API endpoints for topics and difficulties might not be implemented yet
    console.log("Using default available options:", {
      topics: availableTopics,
      difficulties: availableDifficulties
    });
    
    // TODO: Uncomment this when the API endpoints are implemented
    /*
    try {
      console.log("Loading available topics and difficulties...");
      
      const [topicsResponse, difficultiesResponse] = await Promise.all([
        mathApi.getTopics(),
        mathApi.getDifficulties()
      ]);
      
      if (Array.isArray(topicsResponse) && topicsResponse.length > 0) {
        setAvailableTopics(topicsResponse);
        console.log("Loaded topics from API:", topicsResponse);
      }
      
      if (Array.isArray(difficultiesResponse) && difficultiesResponse.length > 0) {
        setAvailableDifficulties(difficultiesResponse);
        console.log("Loaded difficulties from API:", difficultiesResponse);
      }
    } catch (error) {
      console.log("Could not load available options from API, using defaults:", error);
    }
    */
  };

  const loadHistory = async () => {
    try {
      console.log("Loading history from real API...");
      const historyData = await mathApi.getHistory();
      
      // Backend returns array directly for /math/history
      let historyArray = [];
      if (Array.isArray(historyData)) {
        historyArray = historyData;
      } else {
        console.log("Unexpected history data format:", historyData);
        historyArray = [];
      }
      
      // Ensure unique IDs by adding index if needed
      const uniqueHistory = historyArray.slice(0, 10).map((problem, index) => ({
        ...problem,
        id: problem.id || Date.now() + index // Ensure every problem has a unique ID
      }));
      setHistory(uniqueHistory);
    } catch (error: any) {
      console.error("Failed to load history:", error);
      console.error("Error details:", {
        status: error?.status,
        message: error?.message,
        userMessage: error?.userMessage,
        response: error?.response,
        rawResponse: error?.rawResponse
      });
      
      if (error?.status === 404) {
        showWarning("Service Unavailable", `Math API endpoints are not implemented on the backend yet. Error: ${error?.message || '404 Not Found'}`);
      } else if (error?.status === 401) {
        showWarning("Authentication Required", "Please log in to view your math history.");
      } else {
        showError("Error", `Failed to load history: ${error?.message || 'Unknown error'}`);
      }
    }
  };


  const handlePaste = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
        const imageTypes = clipboardItem.types.filter(type => type.startsWith('image/'));
        if (imageTypes.length > 0) {
          const blob = await clipboardItem.getType(imageTypes[0]);
          const file = new File([blob], 'pasted-image.png', { type: imageTypes[0] });
          
          // Validate file size (10MB max)
          if (file.size > 10 * 1024 * 1024) {
            showError('File too large', 'Pasted image is larger than 10MB.');
            return;
          }

          // Set the pasted image as selected
          setSelectedImage(file);
          
          // Create preview
          const reader = new FileReader();
          reader.onload = (e) => {
            setImagePreview(e.target?.result as string);
          };
          reader.readAsDataURL(file);
          
          showSuccess("Success", "Image pasted from clipboard");
          return;
        }
      }
      showWarning("Warning", "No image found in clipboard");
    } catch (error) {
      console.error("Failed to paste:", error);
      showError("Error", "Failed to paste from clipboard. Make sure you have an image copied.");
    }
  };

  // Image upload handler
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showError('Invalid file type', 'Please select an image file.');
        return;
      }

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        showError('File too large', 'Please select an image smaller than 10MB.');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSolve = async () => {
    if (isImageMode && !selectedImage) {
      showError('No image selected', 'Please select an image to solve.');
      return;
    }

    if (!isImageMode && !questionText.trim()) {
      showWarning("Warning", "Please enter a math question");
      return;
    }

    try {
      setIsLoading(true);
      setSolution(""); // Clear previous solution


      let response;
      if (isImageMode && selectedImage) {
        // Handle image upload - call the actual API
        try {
          console.log("Attempting to solve math problem from image:", {
            name: selectedImage.name,
            size: selectedImage.size,
            type: selectedImage.type
          });
          
          const solveResponse = await mathApi.solveMathProblemWithImage(
            selectedImage,
            'maths',
            'intermediate'
          );
          
          console.log("Full API response:", solveResponse);
          console.log("Math problem data:", solveResponse.math_problem);
          console.log("Math solution data:", solveResponse.math_solution);
          
          // Extract solution from the response
          const solution = solveResponse.math_solution;
          const problem = solveResponse.math_problem;
          
          // Check if we got a valid solution
          if (!solution || !solution.step_by_step_solution || solution.step_by_step_solution.trim() === '') {
            console.warn("Received empty or invalid solution from API");
            showWarning("Warning", "The image was processed but no solution was generated. Please try with a clearer image.");
            return;
          }
          
          // Check if the solution looks generic/fallback
          if (solution.step_by_step_solution.includes("Find the value of x in the equation 2x + 5 = 13") && 
              !problem.problem_text?.includes("2x + 5 = 13")) {
            console.warn("Received generic solution that doesn't match the uploaded image");
            showWarning("Warning", "The AI couldn't properly read your image. Please ensure the image is clear and contains a visible math problem.");
            return;
          }
          
          setCurrentProblem(problem);
          
          // Format the solution for display
          const formattedSolution = `
Problem: ${problem.problem_text || 'Image problem'}

Solution:

${solution.step_by_step_solution}

Final Answer: ${solution.final_answer}

Explanation: ${solution.explanation}

Verification: ${solution.verification}

Method: ${solution.solution_method}
          `.trim();
          
          response = {
            solution: formattedSolution,
            problem_id: problem.id
          };
          
          showSuccess("Success", "Image processed successfully!");
        } catch (apiError: any) {
          console.error("Image API Error:", apiError);
          console.error("Error details:", {
            message: apiError?.message,
            status: apiError?.status,
            response: apiError?.response,
            rawResponse: apiError?.rawResponse
          });
          
          // Handle specific error types
          let errorMessage = "Math AI service is temporarily unavailable.";
          
          if (apiError?.message === 'Request was redirected. This usually indicates a network or CORS issue.') {
            errorMessage = "Authentication required. Please log in first.";
          } else if (apiError?.message === 'Failed to fetch') {
            errorMessage = "Backend server is not running. Please start the Laravel backend on port 8000.";
          } else if (apiError?.status === 401) {
            errorMessage = "Authentication required. Please log in first.";
          } else if (apiError?.status === 404) {
            errorMessage = "Math API endpoint not found. Please check if the backend is properly configured.";
          } else if (apiError?.status === 500) {
            errorMessage = "Backend server error. Please check the Laravel logs.";
          } else if (apiError?.userMessage) {
            errorMessage = apiError.userMessage;
          }
          
          showError("Math API Error", errorMessage);
          throw apiError; // Re-throw to stop execution
        }
      } else {
        // Handle text question - call the actual API
            try {
              console.log("Attempting to solve math problem:", questionText);
              
              // Solve the math problem - use real API only
              console.log("Attempting to solve math problem with real API:", questionText);
              
              const solveResponse = await mathApi.solveMathProblem({
                problem_text: questionText,
                subject_area: availableTopics[0] || "arithmetic",
                difficulty_level: availableDifficulties[0] || "beginner",
                problem_type: "text"
              });
              
              console.log("Solve response:", solveResponse);
              
              // Extract solution from the response
              const solution = solveResponse.math_solution;
              const problem = solveResponse.math_problem;
              
              setCurrentProblem(problem);
              
              // Format the solution for display
              const formattedSolution = `
${solution.step_by_step_solution}

Final Answer: ${solution.final_answer}

Explanation: ${solution.explanation}

Verification: ${solution.verification}

Method: ${solution.solution_method}
              `.trim();
              
              response = {
                solution: formattedSolution,
                problem_id: problem.id
              };
              
              showSuccess("Success", "Question processed successfully!");
            } catch (apiError: any) {
              console.error("API Error:", apiError);
              console.error("Error details:", {
                message: apiError?.message,
                status: apiError?.status,
                response: apiError?.response,
                rawResponse: apiError?.rawResponse
              });
              
              // Handle specific error types
              let errorMessage = "Math AI service is temporarily unavailable.";
              
              if (apiError?.message === 'Request was redirected. This usually indicates a network or CORS issue.') {
                errorMessage = "Authentication required. Please log in first.";
              } else if (apiError?.message === 'Failed to fetch') {
                errorMessage = "Backend server is not running. Please start the Laravel backend on port 8000.";
              } else if (apiError?.status === 401) {
                errorMessage = "Authentication required. Please log in first.";
              } else if (apiError?.status === 404) {
                errorMessage = "Math API endpoint not found. Please check if the backend is properly configured.";
              } else if (apiError?.status === 500) {
                errorMessage = "Backend server error. Please check the Laravel logs.";
              } else if (apiError?.userMessage) {
                errorMessage = apiError.userMessage;
              }
              
              showError("Math API Error", errorMessage);
              throw apiError; // Re-throw to stop execution
            }
      }
      
      setSolution(response.solution);
      
          // Add to history
          if (response.problem_id) {
            const newProblem: MathProblem = {
              id: response.problem_id,
              problem_text: isImageMode ? `Image: ${selectedImage?.name}` : questionText,
              subject_area: availableTopics[0] || "arithmetic",
              difficulty_level: availableDifficulties[0] || "beginner",
              created_at: new Date().toISOString()
            };
            
            setHistory(prev => [newProblem, ...prev.slice(0, 9)]);
          }
      
    } catch (error: any) {
      console.error("Failed to solve:", error);
      const errorMessage = error?.userMessage || error?.message || "Failed to process your request";
      showError("Error", errorMessage);
    } finally {
      setIsLoading(false);
      // Clear image selection after processing
      if (isImageMode) {
        setSelectedImage(null);
        setImagePreview(null);
      }
    }
  };

  const loadProblemFromHistory = (problem: MathProblem) => {
    setCurrentProblem(problem);
    setQuestionText(problem.problem_text);
    setSolution(problem.solutions?.[0]?.step_by_step_solution || "");
    // Clear image state
  };

  const deleteProblemFromHistory = async (problemId: number, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent loading the problem when clicking delete
    
    try {
      // Call the API to delete the problem
      await mathApi.deleteProblem(problemId);
      
      // Remove from local state
      setHistory(prev => prev.filter(problem => problem.id !== problemId));
      
      // If the deleted problem was currently selected, clear the current problem
      if (currentProblem?.id === problemId) {
        setCurrentProblem(null);
        setQuestionText("");
        setSolution("");
      }
      
      showSuccess("Success", "Problem deleted successfully!");
    } catch (error: any) {
      console.error("Failed to delete problem:", error);
      showError("Error", `Failed to delete problem: ${error?.message || 'Unknown error'}`);
    }
  };


  const clearAll = () => {
    setQuestionText("");
    setSolution("");
    setCurrentProblem(null);
    setSelectedImage(null);
    setImagePreview(null);
  };


  return (
    <div className="flex h-full gap-6">
      {/* Left Sidebar - History */}
      {!sidebarCollapsed && (
        <div className="w-64 flex-shrink-0 transition-all duration-300">
          <Card className="h-full overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg flex items-center gap-2 truncate">
                <History size={20} />
                History
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              >
                <ChevronLeft size={16} />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
              {history.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <History size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No problems yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((problem, index) => (
                    <div
                      key={`${problem.id}-${index}`}
                      className={`p-3 rounded-lg border transition hover:bg-muted ${
                        currentProblem?.id === problem.id
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <FileText size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div 
                          className="flex-1 min-w-0 cursor-pointer overflow-hidden"
                          onClick={() => loadProblemFromHistory(problem)}
                        >
                            <div className="text-sm font-medium line-clamp-2">
                              {problem.problem_text}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs flex-shrink-0">
                                {problem.subject_area}
                              </Badge>
                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                {problem.difficulty_level}
                              </Badge>
                            {problem.created_at && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                                <Clock size={10} />
                                <span className="truncate">
                                  {new Date(problem.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: '2-digit'
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => deleteProblemFromHistory(problem.id, e)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6"/>
                          </svg>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Toggle Button - Only visible when sidebar is collapsed */}
      {sidebarCollapsed && (
        <div className="flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-12 w-12 p-0"
            title="Show History"
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            AI Math Solver
          </h1>
          <p className="text-muted-foreground">
            Upload an image or enter a math question to get step-by-step solutions
          </p>
          
        </div>

      {/* Main Input Section */}
      <div className="grid grid-cols-1 gap-6">

        {/* Input Mode Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="text-green-600" size={20} />
              Math Problem Input
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mode Toggle */}
            <div className="flex space-x-4">
              <button
                onClick={() => setIsImageMode(false)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  !isImageMode 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📝 Text Input
              </button>
              <button
                onClick={() => setIsImageMode(true)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isImageMode 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📸 Image Upload
              </button>
            </div>

            {/* Text Input Mode */}
            {!isImageMode && (
              <EnhancedMathInput
                value={questionText}
                onChange={setQuestionText}
                placeholder="Enter your math question here... (e.g., \\sqrt{4} + \\infty - \\pm x^2 = 0)"
                showPreview={true}
                showKeyboard={true}
                maxLength={1000}
              />
            )}

            {/* Image Upload Mode */}
            {isImageMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload an image of your math problem:
                </label>
                
                {/* Paste Button */}
                <div className="mb-3">
                  <Button
                    onClick={handlePaste}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Clipboard size={16} />
                    Paste Image (Ctrl+V)
                  </Button>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer block"
                  >
                    {imagePreview ? (
                      <div>
                        <img
                          src={imagePreview}
                          alt="Problem preview"
                          className="max-w-full max-h-64 mx-auto mb-2 rounded-lg shadow-sm"
                        />
                        <p className="text-sm text-gray-600">
                          Click to change image
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Selected: {selectedImage?.name}
                        </p>
                      </div>
                    ) : (
                      <div>
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-2 text-sm text-gray-600">
                          Click to upload an image of your math problem
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 10MB
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Or paste from clipboard using Ctrl+V
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button
            onClick={handleSolve}
            disabled={isLoading || (isImageMode ? !selectedImage : !questionText.trim())}
            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 text-lg"
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Processing...
              </>
            ) : (
              <>
                <Calculator className="mr-2 h-5 w-5" />
                {isImageMode ? 'Solve from Image' : 'Get Solution'}
              </>
            )}
          </Button>
          
              <Button
                onClick={clearAll}
                variant="outline"
                className="px-8 py-3 text-lg"
              >
                Clear All
              </Button>
          
        </div>

      {/* Solution Display */}
      {solution && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="text-green-600" size={20} />
              Solution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/50 rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-sm font-medium text-foreground">
                {solution}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calculator className="text-blue-600" size={24} />
            </div>
            <h3 className="font-semibold mb-2">Upload Images</h3>
            <p className="text-sm text-muted-foreground">
              Take a photo of your math problem and get instant solutions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calculator className="text-green-600" size={24} />
            </div>
            <h3 className="font-semibold mb-2">Type Questions</h3>
            <p className="text-sm text-muted-foreground">
              Enter math problems as text and receive step-by-step solutions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calculator className="text-purple-600" size={24} />
            </div>
            <h3 className="font-semibold mb-2">AI-Powered</h3>
            <p className="text-sm text-muted-foreground">
              Advanced AI provides accurate solutions with detailed explanations
            </p>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}