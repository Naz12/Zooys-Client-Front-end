"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { aiToolsApi } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications";
import { BookOpen, ArrowLeft, Settings, RotateCcw, Download, Copy } from "lucide-react";
import Link from "next/link";

interface Flashcard {
  question: string;
  answer: string;
}

export default function FlashcardsPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  
  const [topic, setTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const handleGenerate = async () => {
    if (!user) {
      showError("Error", "Please log in to use this feature");
      return;
    }

    if (!topic.trim()) {
      showError("Error", "Please enter a topic");
      return;
    }

    setIsLoading(true);
    setFlashcards([]);
    setCurrentCard(0);
    setShowAnswer(false);

    try {
      const response = await aiToolsApi.generateFlashcards(topic.trim());
      setFlashcards(response);
      showSuccess("Success", "Flashcards generated successfully!");
    } catch (error) {
      console.error("Flashcard generation error:", error);
      showError("Error", error instanceof Error ? error.message : "Failed to generate flashcards");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentCard < flashcards.length - 1) {
      setCurrentCard(currentCard + 1);
      setShowAnswer(false);
    }
  };

  const handlePrevious = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
      setShowAnswer(false);
    }
  };

  const handleFlip = () => {
    setShowAnswer(!showAnswer);
  };

  const handleReset = () => {
    setCurrentCard(0);
    setShowAnswer(false);
  };

  const handleDownload = () => {
    const content = flashcards.map((card, index) => 
      `${index + 1}. Q: ${card.question}\n   A: ${card.answer}\n`
    ).join('\n');
    
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `flashcards-${topic.replace(/\s+/g, '-').toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    const content = flashcards.map((card, index) => 
      `${index + 1}. Q: ${card.question}\n   A: ${card.answer}\n`
    ).join('\n');
    
    navigator.clipboard.writeText(content);
    showSuccess("Success", "Flashcards copied to clipboard!");
  };

  const exampleTopics = [
    "Spanish vocabulary",
    "World War II history",
    "Photosynthesis process",
    "JavaScript fundamentals",
    "Human anatomy",
    "French grammar rules",
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
                  <h2 className="text-xl font-semibold mb-2">Create Flashcards</h2>
                  <p className="text-muted-foreground">
                    Enter a topic to generate study flashcards
                  </p>
                </div>

                {/* Topic Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Topic:</label>
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter a topic (e.g., Spanish vocabulary, World War II, JavaScript)"
                    className="w-full"
                  />
                </div>

                {/* Example Topics */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Example topics:</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {exampleTopics.map((example, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-left justify-start h-auto p-3 text-xs"
                        onClick={() => setTopic(example)}
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
                    disabled={isLoading || !topic.trim()}
                    className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white px-8 py-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Generate Flashcards
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Flashcards Display */}
          {flashcards.length > 0 && (
            <Card className="bg-card border border-border rounded-xl shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">
                    Flashcards ({currentCard + 1} of {flashcards.length})
                  </h3>
                  <div className="flex space-x-2">
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

                {/* Flashcard */}
                <div className="max-w-2xl mx-auto">
                  <div className="bg-muted/20 border border-border rounded-xl p-8 min-h-[300px] flex flex-col justify-center">
                    <div className="text-center space-y-4">
                      <div className="text-sm font-medium text-muted-foreground">
                        {showAnswer ? "Answer" : "Question"}
                      </div>
                      <div className="text-lg leading-relaxed">
                        {showAnswer 
                          ? flashcards[currentCard].answer 
                          : flashcards[currentCard].question
                        }
                      </div>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between mt-6">
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentCard === 0}
                    >
                      Previous
                    </Button>
                    
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={handleFlip}
                      >
                        {showAnswer ? "Show Question" : "Show Answer"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleReset}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset
                      </Button>
                    </div>

                    <Button
                      variant="outline"
                      onClick={handleNext}
                      disabled={currentCard === flashcards.length - 1}
                    >
                      Next
                    </Button>
                  </div>

                  {/* Progress */}
                  <div className="mt-4">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((currentCard + 1) / flashcards.length) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Features Card */}
          <Card className="bg-muted/30 border border-border rounded-xl">
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Flashcard Features</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Interactive Study</h4>
                    <p className="text-xs text-muted-foreground">Flip cards to test your knowledge</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Any Topic</h4>
                    <p className="text-xs text-muted-foreground">Generate cards for any subject</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-purple-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Export Options</h4>
                    <p className="text-xs text-muted-foreground">Download or copy your flashcards</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-6 h-6 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-orange-500" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Progress Tracking</h4>
                    <p className="text-xs text-muted-foreground">See your study progress</p>
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
