"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Shuffle, Play, Pause } from "lucide-react";

type Flashcard = {
  id: number;
  question: string;
  answer: string;
};

export default function FlashcardCard() {
  const [cards] = useState<Flashcard[]>([
    {
      id: 1,
      question: "What are flashcards?",
      answer:
        "Flashcards are memory aids with a question on one side and the answer on the other.",
    },
    {
      id: 2,
      question: "Who invented flashcards?",
      answer:
        "Flashcards were popularized in the 19th century as a learning tool.",
    },
    {
      id: 3,
      question: "Why use flashcards?",
      answer:
        "They help with active recall and spaced repetition for better learning.",
    },
  ]);

  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
          <p className="text-sm text-muted-foreground mb-3">
            No flashcards saved yet.
          </p>
          <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-6 shadow">
            ➕ Create Now
          </Button>
        </div>

        {/* Right Panel */}
        <div className="flex-1 flex flex-col justify-between">
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

          {/* Controls */}
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
        </div>
      </CardContent>
    </Card>
  );
}
