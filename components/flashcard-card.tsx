"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Shuffle, Play, Pause, Upload, FileText, Plus } from "lucide-react";
import { flashcardApi, fileApi } from "@/lib/api";
import { Flashcard, FlashcardSet } from "@/lib/types/api";
import { FileUpload } from "@/components/ui/file-upload";

export default function FlashcardCard() {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
  const [selectedSet, setSelectedSet] = useState<FlashcardSet | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [createForm, setCreateForm] = useState({
    input: "",
    inputType: "text" as "text" | "url" | "youtube" | "file",
    count: 5,
    difficulty: "intermediate" as "beginner" | "intermediate" | "advanced",
    style: "mixed" as "definition" | "application" | "analysis" | "comparison" | "mixed",
    file: null as File | null
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load flashcard sets on component mount
  useEffect(() => {
    loadFlashcardSets();
  }, []);

  // Update cards when selected set changes
  useEffect(() => {
    if (selectedSet) {
      setCards(selectedSet.flashcards);
      setIndex(0);
      setShowAnswer(false);
    }
  }, [selectedSet]);

  const loadFlashcardSets = async () => {
    try {
      setIsLoading(true);
      const response = await flashcardApi.getSets();
      setFlashcardSets(response.flashcard_sets);
      if (response.flashcard_sets.length > 0) {
        setSelectedSet(response.flashcard_sets[0]);
      }
    } catch (error) {
      console.error("Failed to load flashcard sets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFlashcards = async () => {
    try {
      setIsLoading(true);
      const request = {
        input: createForm.input,
        input_type: createForm.inputType,
        count: createForm.count,
        difficulty: createForm.difficulty,
        style: createForm.style,
        file: createForm.file
      };

      const response = await flashcardApi.generate(request);
      
      // Reload flashcard sets to show the new one
      await loadFlashcardSets();
      
      // Reset form
      setCreateForm({
        input: "",
        inputType: "text",
        count: 5,
        difficulty: "intermediate",
        style: "mixed",
        file: null
      });
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to create flashcards:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const prevCard = () => {
    setShowAnswer(false);
    setIndex((i) => (i > 0 ? i - 1 : cards.length - 1));
  };

  const nextCard = () => {
    setShowAnswer(false);
    setIndex((i) => (i + 1) % cards.length);
  };

  const randomCard = () => {
    setShowAnswer(false);
    setIndex(Math.floor(Math.random() * cards.length));
  };

  // Auto-play effect
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setShowAnswer(false);
        setIndex((i) => (i + 1) % cards.length);
      }, 3000); // 3 seconds per card
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, cards.length]);

  return (
    <Card className="bg-card border border-border rounded-2xl shadow-lg transition hover:shadow-xl">
      <CardContent className="p-6 flex flex-col md:flex-row gap-6">
        {/* Left Panel */}
        <div className="w-full md:w-1/3 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-border pb-6 md:pb-0 md:pr-4">
          <div className="w-28 h-28 rounded-full bg-blue-500/10 flex items-center justify-center text-4xl text-blue-500 mb-4 border-2 border-dashed border-blue-500/30">
            📄
          </div>
          
          {flashcardSets.length === 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                No flashcards saved yet.
              </p>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-6 shadow"
              >
                <Plus size={16} className="mr-2" />
                Create Now
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-3">
                {flashcardSets.length} flashcard set{flashcardSets.length !== 1 ? 's' : ''} available
              </p>
              <div className="space-y-2 w-full">
                {flashcardSets.map((set) => (
                  <Button
                    key={set.id}
                    variant={selectedSet?.id === set.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSet(set)}
                    className="w-full justify-start"
                  >
                    <FileText size={14} className="mr-2" />
                    {set.title}
                  </Button>
                ))}
              </div>
              <Button 
                onClick={() => setShowCreateForm(true)}
                variant="outline"
                size="sm"
                className="mt-3 w-full"
              >
                <Plus size={14} className="mr-2" />
                New Set
              </Button>
            </>
          )}
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col justify-between">
          {showCreateForm ? (
            /* Create Form */
            <div className="flex-1 flex flex-col justify-center">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-center">Create New Flashcards</h3>
                
                {/* Input Type Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Input Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {["text", "url", "youtube", "file"].map((type) => (
                      <Button
                        key={type}
                        variant={createForm.inputType === type ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCreateForm(prev => ({ ...prev, inputType: type as any }))}
                        className="capitalize"
                      >
                        {type}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Input Field */}
                {createForm.inputType !== "file" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {createForm.inputType === "text" ? "Text Content" : 
                       createForm.inputType === "url" ? "URL" : "YouTube URL"}
                    </label>
                    <textarea
                      value={createForm.input}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, input: e.target.value }))}
                      placeholder={`Enter ${createForm.inputType} content...`}
                      className="w-full p-3 border rounded-lg resize-none"
                      rows={3}
                    />
                  </div>
                )}

                {/* File Upload */}
                {createForm.inputType === "file" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Upload File</label>
                    <FileUpload
                      onFileSelect={(file) => setCreateForm(prev => ({ ...prev, file }))}
                      accept=".pdf,.doc,.docx,.txt,.mp3,.mp4,.wav"
                      className="w-full"
                    />
                    {createForm.file && (
                      <p className="text-sm text-muted-foreground">
                        Selected: {createForm.file.name}
                      </p>
                    )}
                  </div>
                )}

                {/* Options */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Count</label>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      value={createForm.count}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, count: parseInt(e.target.value) }))}
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Difficulty</label>
                    <select
                      value={createForm.difficulty}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, difficulty: e.target.value as any }))}
                      className="w-full p-2 border rounded-lg"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Style</label>
                  <select
                    value={createForm.style}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, style: e.target.value as any }))}
                    className="w-full p-2 border rounded-lg"
                  >
                    <option value="definition">Definition</option>
                    <option value="application">Application</option>
                    <option value="analysis">Analysis</option>
                    <option value="comparison">Comparison</option>
                    <option value="mixed">Mixed</option>
                  </select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateFlashcards}
                    disabled={isLoading || (!createForm.input && !createForm.file)}
                    className="flex-1"
                  >
                    {isLoading ? "Creating..." : "Create Flashcards"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ) : cards.length > 0 ? (
            /* Flashcard Display */
            <>
              {/* Flashcard with Flip */}
              <div
                className="relative flex-1 flex items-center justify-center perspective cursor-pointer"
                onClick={() => setShowAnswer(!showAnswer)}
              >
                <div
                  className={`relative w-full min-h-[200px] rounded-xl border border-indigo-500/30 shadow-lg bg-gradient-to-br from-indigo-600/20 to-blue-600/20 px-6 py-8 text-center text-lg md:text-xl font-medium transition-transform duration-500 [transform-style:preserve-3d] ${
                    showAnswer ? "[transform:rotateY(180deg)]" : ""
                  }`}
                >
                  {/* Front */}
                  <div className="absolute inset-0 flex items-center justify-center p-6 [backface-visibility:hidden]">
                    {cards[index].question}
                  </div>
                  {/* Back */}
                  <div className="absolute inset-0 flex items-center justify-center p-6 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-indigo-50 dark:bg-zinc-900 rounded-xl">
                    {cards[index].answer}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* No Cards Message */
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-2xl mb-4 mx-auto">
                  📄
                </div>
                <p className="text-muted-foreground">
                  {selectedSet ? "No flashcards in this set" : "Select a flashcard set to start studying"}
                </p>
              </div>
            </div>
          )}

          {/* Controls - Only show when cards are available and not in create form */}
          {!showCreateForm && cards.length > 0 && (
            <div className="flex items-center justify-center gap-4 mt-6 flex-wrap bg-muted/20 px-5 py-2 rounded-full shadow-sm">
              <Button
                variant="ghost"
                size="icon"
                onClick={prevCard}
                className="hover:text-indigo-500"
              >
                <ArrowLeft size={18} />
              </Button>
              <span className="text-sm text-muted-foreground">
                {index + 1} / {cards.length}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={nextCard}
                className="hover:text-indigo-500"
              >
                <ArrowRight size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={randomCard}
                className="hover:text-indigo-500"
              >
                <Shuffle size={18} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPlaying(!isPlaying)}
                className={`hover:text-indigo-500 ${
                  isPlaying ? "text-indigo-500" : ""
                }`}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
