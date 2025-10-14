"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Copy, Check } from "lucide-react";
import MathRenderer from "./math-renderer";

interface SolutionRendererProps {
  solution: string;
}

export default function SolutionRenderer({ solution }: SolutionRendererProps) {
  const [showRawText, setShowRawText] = useState(false);
  const [copied, setCopied] = useState(false);

  // Function to detect if text contains LaTeX
  const containsLatex = (text: string): boolean => {
    const latexPatterns = [
      /\\[a-zA-Z]+\{/,  // \command{
      /\\[a-zA-Z]+\(/,  // \command(
      /\\[a-zA-Z]+\[/,  // \command[
      /\^[a-zA-Z0-9]/,  // ^superscript
      /_[a-zA-Z0-9]/,   // _subscript
      /\\[a-zA-Z]+/,    // \command
      /\\[^a-zA-Z]/     // \symbol
    ];
    
    return latexPatterns.some(pattern => pattern.test(text));
  };

  // Function to extract LaTeX expressions from text
  const extractLatexExpressions = (text: string): string[] => {
    const latexExpressions: string[] = [];
    
    // Find LaTeX expressions (basic pattern matching)
    const latexRegex = /\\[a-zA-Z]+(?:\{[^}]*\}|\([^)]*\)|\[[^\]]*\]|[^a-zA-Z\s])?/g;
    let match;
    
    while ((match = latexRegex.exec(text)) !== null) {
      latexExpressions.push(match[0]);
    }
    
    return [...new Set(latexExpressions)]; // Remove duplicates
  };

  // Function to split text into LaTeX and non-LaTeX parts
  const parseSolution = (text: string) => {
    const parts: Array<{ type: 'latex' | 'text'; content: string }> = [];
    let currentIndex = 0;
    
    // Find all LaTeX expressions
    const latexRegex = /\\[a-zA-Z]+(?:\{[^}]*\}|\([^)]*\)|\[[^\]]*\]|[^a-zA-Z\s])?/g;
    let match;
    
    while ((match = latexRegex.exec(text)) !== null) {
      // Add text before LaTeX
      if (match.index > currentIndex) {
        const textPart = text.substring(currentIndex, match.index);
        if (textPart.trim()) {
          parts.push({ type: 'text', content: textPart });
        }
      }
      
      // Add LaTeX expression
      parts.push({ type: 'latex', content: match[0] });
      currentIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (currentIndex < text.length) {
      const remainingText = text.substring(currentIndex);
      if (remainingText.trim()) {
        parts.push({ type: 'text', content: remainingText });
      }
    }
    
    return parts;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(solution);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy solution:", err);
    }
  };

  const hasLatex = containsLatex(solution);
  const latexExpressions = extractLatexExpressions(solution);
  const parsedParts = parseSolution(solution);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {hasLatex && (
            <div className="flex items-center gap-2">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                LaTeX Detected
              </span>
              <span className="text-xs text-muted-foreground">
                {latexExpressions.length} expression{latexExpressions.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {hasLatex && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRawText(!showRawText)}
              className="flex items-center gap-2"
            >
              {showRawText ? <EyeOff size={14} /> : <Eye size={14} />}
              {showRawText ? "Show Rendered" : "Show Raw"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex items-center gap-2"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied!" : "Copy"}
          </Button>
        </div>
      </div>

      {/* Solution Content */}
      <div className="min-h-[60px]">
        {showRawText ? (
          // Raw text view
          <pre className="whitespace-pre-wrap text-sm font-mono bg-background p-3 rounded border">
            {solution}
          </pre>
        ) : hasLatex ? (
          // Rendered LaTeX view
          <div className="space-y-2">
            {parsedParts.map((part, index) => (
              <span key={index}>
                {part.type === 'latex' ? (
                  <MathRenderer 
                    latex={part.content} 
                    className="inline-block mx-1"
                  />
                ) : (
                  <span className="text-foreground">{part.content}</span>
                )}
              </span>
            ))}
          </div>
        ) : (
          // Plain text view (no LaTeX detected)
          <div className="text-sm font-medium text-foreground whitespace-pre-wrap">
            {solution}
          </div>
        )}
      </div>

      {/* LaTeX Expressions List (if any) */}
      {hasLatex && latexExpressions.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            LaTeX Expressions Found ({latexExpressions.length})
          </summary>
          <div className="mt-2 space-y-1">
            {latexExpressions.map((expr, index) => (
              <div key={index} className="flex items-center gap-2">
                <code className="bg-muted px-2 py-1 rounded text-xs">
                  {expr}
                </code>
                <MathRenderer 
                  latex={expr} 
                  className="text-sm"
                />
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
