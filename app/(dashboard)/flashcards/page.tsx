"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Trash2, 
  Share2,
  FileText,
  Link,
  Youtube,
  Upload,
  Clock,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  AlertTriangle
} from "lucide-react";
import { useNotifications } from "@/lib/notifications";
import { flashcardApi, fileApi } from "@/lib/api";
import type { FlashcardSet, Flashcard } from "@/lib/types/api";

interface FlashcardDisplayProps {
  flashcard: Flashcard;
  isFlipped: boolean;
  onFlip: () => void;
}

function FlashcardDisplay({ flashcard, isFlipped, onFlip }: FlashcardDisplayProps) {
  return (
    <div 
      className="w-full h-64 cursor-pointer" 
      style={{ perspective: '1000px' }}
      onClick={onFlip}
    >
      <div 
        className={`relative w-full h-full transition-transform duration-700`}
        style={{ 
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
        }}
      >
        {/* Front of card */}
        <div 
          className="absolute inset-0 w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 flex flex-col justify-center items-center text-white shadow-lg"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">Question</h3>
            <p className="text-sm leading-relaxed">{flashcard.question}</p>
          </div>
          <div className="absolute bottom-4 right-4 text-xs opacity-70">
            Click to reveal answer
          </div>
        </div>
        
        {/* Back of card */}
        <div 
          className="absolute inset-0 w-full h-full bg-gradient-to-br from-green-500 to-teal-600 rounded-xl p-6 flex flex-col justify-center items-center text-white shadow-lg"
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)'
          }}
        >
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-4">Answer</h3>
            <p className="text-sm leading-relaxed">{flashcard.answer}</p>
          </div>
          <div className="absolute bottom-4 right-4 text-xs opacity-70">
            Click to see question
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FlashcardsPage() {
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
  const [currentSet, setCurrentSet] = useState<FlashcardSet | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [showActions, setShowActions] = useState<number | null>(null);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const { showSuccess, showError } = useNotifications();
  
  // Create new flashcard form state
  const [input, setInput] = useState("");
  const [inputType, setInputType] = useState<'text' | 'url' | 'youtube' | 'file'>('text');
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [style, setStyle] = useState<'definition' | 'application' | 'analysis' | 'comparison' | 'mixed'>('mixed');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Helper function to highlight search terms
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const loadFlashcardSets = useCallback(async (search?: string) => {
    try {
      setIsLoading(true);
      // Only pass search term if it's meaningful (not empty or undefined)
      const searchParam = search && search.trim().length > 0 ? search : undefined;
      const response = await flashcardApi.getSets(1, 15, searchParam);
      setFlashcardSets(response.flashcard_sets);
    } catch (error) {
      console.error('Failed to load flashcard sets:', error);
      
      // Handle different types of errors
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
          setBackendAvailable(false);
          showError("Backend Connection Error", "Cannot connect to the backend server. Please ensure the server is running on http://localhost:8000 and CORS is properly configured.");
        } else if (error.message.includes('Backend server is not running')) {
          setBackendAvailable(false);
          showError("Backend Not Available", "The backend server is not running. Please start the backend server on http://localhost:8000");
        } else {
          showError("Error", "Failed to load flashcard sets");
        }
      } else {
        showError("Error", "Failed to load flashcard sets");
      }
      setFlashcardSets([]);
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  // Load flashcard sets on mount and handle search
  useEffect(() => {
    console.log('useEffect triggered:', { hasSearched, searchTerm });
    
    // If user hasn't started searching or search term is empty, load all sets
    if (!hasSearched || !searchTerm || searchTerm.trim().length === 0) {
      console.log('Loading all flashcard sets');
      loadFlashcardSets(); // Load all sets without search
    } else {
      console.log('Starting search with term:', searchTerm);
      const timeoutId = setTimeout(() => {
        loadFlashcardSets(searchTerm);
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, hasSearched]); // Intentionally exclude loadFlashcardSets to prevent infinite loop

  const handleCreateFlashcards = async () => {
    // Validate input based on type
    if (inputType === 'file') {
      if (!selectedFile) {
        showError("Error", "Please select a file to generate flashcards from");
        return;
      }
    } else {
      if (!input.trim()) {
        showError("Error", "Please enter content to generate flashcards from");
      return;
    }

      // Check minimum word count (5 words) for text input
      const wordCount = input.trim().split(/\s+/).length;
      if (wordCount < 5) {
        showError("Error", `Please provide at least 5 words. You currently have ${wordCount} words.`);
        return;
      }
    }

    if (count > 40) {
      showError("Error", "Maximum number of flashcards is 40");
      return;
    }

    setIsGenerating(true);
    try {
      let response;
      
      if (inputType === 'file' && selectedFile) {
        // Handle file upload and generation
        setIsUploading(true);
        try {
          // First upload the file
          await fileApi.upload(selectedFile, {
            tool_type: 'flashcards',
            description: `Flashcard generation from ${selectedFile.name}`
          });
          
          showSuccess("Success", `File uploaded successfully! Generating flashcards...`);
          
          // Then generate flashcards from the file
          response = await flashcardApi.generate({
            input: input.trim() || `Generate flashcards from ${selectedFile.name}`,
            input_type: 'file',
            count: Math.min(count, 40),
            difficulty,
            style,
            file: selectedFile
          });
        } finally {
          setIsUploading(false);
        }
      } else {
        // Handle text/URL/YouTube input
        const requestData = {
          input: input.trim(),
          input_type: inputType,
          count: Math.min(count, 40),
          difficulty,
          style
        };

        console.log('Sending flashcard generation request:', requestData);
        response = await flashcardApi.generate(requestData);
      }

      showSuccess("Success", `Generated ${response.flashcards.length} flashcards successfully!`);
      setInput("");
      setSelectedFile(null);
      setIsCreating(false);
      loadFlashcardSets(); // Refresh the list
    } catch (error: unknown) {
      console.error('Failed to generate flashcards:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        status: (error as { status?: number })?.status,
        response: (error as { response?: unknown })?.response,
        rawResponse: (error as { rawResponse?: string })?.rawResponse
      });
      
      // Check if backend is reachable
      const errorMessage = error instanceof Error ? error.message : '';
      const errorStatus = (error as { status?: number })?.status;
      const errorResponse = (error as { response?: unknown })?.response;
      
      // Check for empty response body (common when backend is not running)
      if (errorResponse && typeof errorResponse === 'object' && Object.keys(errorResponse).length === 0) {
        showError("Backend Not Available", "The backend server is not responding. Please ensure the backend server is running on http://localhost:8000 and try again.");
        return;
      }
      
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('Network error') || errorMessage.includes('CORS')) {
        showError("Connection Error", "Cannot connect to the backend server. Please make sure the backend is running on localhost:8000 and CORS is properly configured.");
        return;
      }
      
      // Provide more specific error messages
      if (errorMessage.includes('Empty response body')) {
        showError("Server Error", "Backend returned an empty response. The server might not be properly configured or the endpoint might not exist.");
      } else if (errorMessage.includes('Invalid JSON response')) {
        showError("Server Error", "Backend returned invalid response format. Please check the server configuration.");
      } else if (errorStatus === 400) {
        showError("Validation Error", "Invalid request. Please check your input and try again.");
      } else if (errorStatus === 401) {
        showError("Authentication Error", "Authentication required. Please log in again.");
      } else if (errorStatus === 500) {
        showError("Server Error", "Server error. Please try again later.");
      } else if (errorStatus === 404) {
        showError("Endpoint Not Found", "The flashcard generation endpoint was not found. Please check if the backend server is properly configured.");
      } else {
        showError("Generation Error", `Failed to generate flashcards: ${errorMessage || 'Unknown error'}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteSet = async (setId: number) => {
    try {
      await flashcardApi.deleteSet(setId);
      showSuccess("Success", "Flashcard set deleted successfully");
      loadFlashcardSets();
      if (currentSet?.id === setId) {
        setCurrentSet(null);
      }
    } catch (error) {
      console.error('Failed to delete flashcard set:', error);
      showError("Error", "Failed to delete flashcard set");
    }
  };

  const handleShareSet = async (setId: number) => {
    try {
      // In a real implementation, this would generate a shareable link
      const shareUrl = `${window.location.origin}/flashcards/shared/${setId}`;
      await navigator.clipboard.writeText(shareUrl);
      showSuccess("Success", "Share link copied to clipboard!");
    } catch {
      showError("Error", "Failed to copy share link");
    }
  };

  const handleStartStudy = (set: FlashcardSet) => {
    setCurrentSet(set);
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  const handleNextCard = () => {
    if (currentSet && currentCardIndex < currentSet.flashcards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleFlipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Unknown";
      
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 1) return "Just now";
      if (diffInHours < 24) return `${diffInHours} hours ago`;
      if (diffInHours < 48) return "Yesterday";
      
      return date.toLocaleDateString();
    } catch {
      return "Unknown";
    }
  };

  if (currentSet) {
    const currentCard = currentSet.flashcards[currentCardIndex];

  return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Study Mode Header */}
          <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentSet(null)}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back to Sets
                </Button>
                <div>
              <h1 className="text-2xl font-bold">{currentSet.title}</h1>
              <p className="text-muted-foreground">
                Card {currentCardIndex + 1} of {currentSet.flashcards.length}
                  </p>
                </div>
              </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              {currentSet.difficulty}
            </Badge>
            <Badge variant="outline">
              {currentSet.style}
            </Badge>
          </div>
        </div>

        {/* Flashcard Display */}
        <Card>
          <CardContent className="p-8">
            <FlashcardDisplay
              flashcard={currentCard}
              isFlipped={isFlipped}
              onFlip={handleFlipCard}
            />
          </CardContent>
        </Card>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevCard}
            disabled={currentCardIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFlipped(false)}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFlipCard}
            >
              {isFlipped ? "Show Question" : "Show Answer"}
            </Button>
            </div>
          
          <Button
            variant="outline"
            onClick={handleNextCard}
            disabled={currentCardIndex === currentSet.flashcards.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center">
          <div className="flex space-x-2">
            {currentSet.flashcards.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index === currentCardIndex ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isCreating) {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Create Flashcard</h1>
                  <p className="text-muted-foreground">
              Generate educational flashcards from various content sources
                  </p>
                </div>
          <Button
            variant="outline"
            onClick={() => setIsCreating(false)}
          >
            Cancel
          </Button>
                </div>

        {/* Input Source Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Content Source</CardTitle>
            <CardDescription>Choose how you want to provide content for flashcard generation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              {[
                { type: 'text', label: 'Text', icon: FileText },
                { type: 'url', label: 'Link', icon: Link },
                { type: 'youtube', label: 'YouTube', icon: Youtube },
                { type: 'file', label: 'File', icon: Upload },
              ].map(({ type, label, icon: Icon }) => (
                      <Button
                  key={type}
                  variant={inputType === type ? "default" : "outline"}
                  onClick={() => setInputType(type as 'text' | 'url' | 'youtube' | 'file')}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                      </Button>
                    ))}
            </div>

            {/* Input Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {inputType === 'text' && 'Text Content'}
                {inputType === 'url' && 'Web Page URL'}
                {inputType === 'youtube' && 'YouTube Video URL'}
                {inputType === 'file' && 'Upload File'}
              </label>
              
              {inputType === 'file' ? (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-input rounded-lg p-6 text-center hover:border-primary transition-colors">
                    <input
                      type="file"
                      id="file-upload"
                      accept=".pdf,.doc,.docx,.txt,.mp3,.mp4,.wav,.m4a"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setSelectedFile(file);
                          setInput(file.name); // Show filename in input
                        }
                      }}
                      className="hidden"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        PDF, DOC, TXT, MP3, MP4 files supported
                      </p>
                    </label>
                  </div>
                  
                  {selectedFile && (
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm font-medium">{selectedFile.name}</span>
                        <Badge variant="secondary">
                          {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedFile(null);
                          setInput("");
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  <textarea
                    placeholder="Optional: Add a description or specific instructions for flashcard generation..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={3}
                    className="w-full p-3 border border-input rounded-md bg-background text-sm resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              ) : (
                <textarea
                  placeholder={
                    inputType === 'text' ? 'Input or paste text to generate flashcards (minimum 5 words)...' :
                    inputType === 'url' ? 'Enter a web page URL...' :
                    inputType === 'youtube' ? 'Enter a YouTube video URL...' :
                    'Upload a file to generate flashcards from...'
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  rows={6}
                  className="w-full p-3 border border-input rounded-md bg-background text-sm resize-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              )}
              
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <div>
                  {inputType === 'text' && (
                    <span className={input.trim().split(/\s+/).length >= 5 ? 'text-green-600' : 'text-red-500'}>
                      {input.trim().split(/\s+/).length}/5 words minimum
                    </span>
                  )}
                  {inputType === 'file' && selectedFile && (
                    <span className="text-green-600">
                      File selected: {selectedFile.name}
                    </span>
                  )}
                </div>
                <div>
                  {input.length}/5000 characters
                </div>
              </div>
            </div>

            {/* Generation Options */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Number of Cards (Max: 40)</label>
                <Input
                  type="number"
                  min="1"
                  max="40"
                  value={count}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 10;
                    setCount(Math.min(value, 40)); // Ensure it doesn't exceed 40
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <select
                  className="w-full p-2 border border-input rounded-md bg-background"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Question Style</label>
                <select
                  className="w-full p-2 border border-input rounded-md bg-background"
                  value={style}
                  onChange={(e) => setStyle(e.target.value as 'mixed' | 'definition' | 'application' | 'analysis' | 'comparison')}
                >
                  <option value="mixed">Mixed</option>
                  <option value="definition">Definition</option>
                  <option value="application">Application</option>
                  <option value="analysis">Analysis</option>
                  <option value="comparison">Comparison</option>
                </select>
                  </div>
                </div>

                {/* Generate Button */}
                  <Button
              variant="gradient"
              onClick={handleCreateFlashcards}
              disabled={
                isGenerating || 
                (inputType === 'file' ? !selectedFile : !input.trim()) || 
                (inputType === 'text' && input.trim().split(/\s+/).length < 5)
              }
              className="w-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  {isUploading ? 'Uploading File...' : 'Generating Flashcards...'}
                      </>
                    ) : (
                      <>
                  <BookOpen className="h-4 w-4 mr-2" />
                        Generate Flashcards
                      </>
                    )}
                  </Button>

            {/* Suggested Prompts */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quick Examples</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {[
                  "Make flashcards for the word 'loquacious' with its meaning and example sentences.",
                  "Generate flashcards for the definition of 'photosynthesis' along with its steps.",
                  "Create flashcards with the term 'metaphor' and an example sentence in English literature",
                  "Create flashcards that lists the causes and effects of climate change."
                ].map((prompt, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="text-left justify-start h-auto p-3"
                    onClick={() => setInput(prompt)}
                  >
                    <span className="text-xs">{prompt}</span>
                  </Button>
                ))}
                </div>
              </div>
            </CardContent>
          </Card>
                  </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Flashcards</h1>
          <p className="text-muted-foreground">
            Create and study with AI-powered flashcards
          </p>
                  </div>
                    <Button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 hover:bg-blue-700"
                    >
          <Plus className="h-4 w-4 mr-2" />
          Create
                    </Button>
                    </div>

      {/* Backend Availability Warning */}
      {!backendAvailable && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <div>
              <h3 className="font-medium text-yellow-800">Backend Server Not Available</h3>
              <p className="text-sm text-yellow-700">
                The backend server is not running. Please start the backend server on <code className="bg-yellow-100 px-1 rounded">http://localhost:8000</code> to use all features.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search flashcards by title, description, or content..."
            value={searchTerm}
            onChange={(e) => {
              const value = e.target.value;
              console.log('Search input changed:', value);
              setSearchTerm(value);
              // Only set hasSearched to true if user has typed something meaningful
              if (value.trim().length > 0) {
                console.log('Setting hasSearched to true');
                setHasSearched(true);
              }
            }}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <button
            onClick={() => {
              setSearchTerm("");
              setHasSearched(false);
              loadFlashcardSets(); // Reload all sets
            }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          )}
        </div>
                      <Button
                        variant="outline"
          onClick={() => loadFlashcardSets(searchTerm)}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
          ) : (
            <Search className="h-4 w-4 mr-2" />
          )}
          Search
                      </Button>
                    </div>

      {/* Search Results Info */}
      {searchTerm && !isLoading && (
        <div className="mb-4 p-3 bg-muted/50 rounded-lg flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {flashcardSets.length > 0 
              ? `Found ${flashcardSets.length} flashcard set${flashcardSets.length === 1 ? '' : 's'} matching "${searchTerm}"`
              : `No flashcard sets found matching "${searchTerm}"`
            }
          </p>
                    <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setHasSearched(false);
              loadFlashcardSets(); // Reload all sets
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear Search
                    </Button>
                  </div>
      )}

      {/* Flashcard Sets */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded mb-4"></div>
                <div className="h-8 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
                    </div>
      ) : flashcardSets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No flashcards yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first set of flashcards to get started
            </p>
            <Button variant="gradient" onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Flashcards
            </Button>
              </CardContent>
            </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {flashcardSets.map((set) => (
            <Card key={set.id} className="group hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                      {highlightSearchTerm(set.title, searchTerm)}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {highlightSearchTerm(set.description, searchTerm)}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDate(set.created_at)}
                  </div>
                </div>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setShowActions(showActions === set.id ? null : set.id)}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    {showActions === set.id && (
                      <div className="absolute right-0 top-8 bg-background border border-border rounded-md shadow-lg z-10 min-w-[120px]">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start"
                          onClick={() => handleShareSet(set.id)}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Share
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-destructive"
                          onClick={() => handleDeleteSet(set.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                  </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {set.difficulty}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {set.style}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <BookOpen className="h-3 w-3" />
                    {set.total_cards}
                  </div>
                </div>

                <Button
                  onClick={() => handleStartStudy(set)}
                  className="w-full"
                  variant="success"
                >
                  Start Studying
                </Button>
            </CardContent>
          </Card>
          ))}
        </div>
      )}
    </div>
  );
}