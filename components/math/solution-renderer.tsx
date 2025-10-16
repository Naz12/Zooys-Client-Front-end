"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Copy, Check } from "lucide-react";
import MathRenderer from "./math-renderer";

interface SolutionStep {
  step_number: number;
  description: string;
  expression: string;
  latex: string | null;
  confidence: number;
}

interface StructuredSolution {
  steps: SolutionStep[];
  final_answer?: string;
  explanation?: string;
  method?: string;
  verification?: string;
  solution_method?: string;
}

interface SolutionRendererProps {
  solution: string;
}

export default function SolutionRenderer({ solution }: SolutionRendererProps) {
  const [showRawText, setShowRawText] = useState(false);
  const [copied, setCopied] = useState(false);

  // Function to parse structured solution from JSON
  const parseStructuredSolution = (text: string): StructuredSolution | null => {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(text);
      
      // Check if it's an array of steps
      if (Array.isArray(parsed)) {
        return { steps: parsed };
      }
      
      // Check if it's an object with steps
      if (parsed && typeof parsed === 'object' && parsed.steps) {
        return parsed;
      }
      
      // Check if it's the new backend response format
      if (parsed && typeof parsed === 'object' && parsed.math_solution) {
        const mathSolution = parsed.math_solution;
        const steps = mathSolution.step_by_step_solution ? 
          JSON.parse(mathSolution.step_by_step_solution) : [];
        
        return {
          steps: steps,
          final_answer: mathSolution.final_answer,
          explanation: mathSolution.explanation,
          method: mathSolution.solution_method,
          verification: mathSolution.verification
        };
      }
      
      return null;
    } catch (error) {
      // If JSON parsing fails, check if it contains structured data
      if (text.includes('"step_number"') && text.includes('"description"')) {
        try {
          // Try to extract JSON from the text
          const jsonMatch = text.match(/\[.*\]/s);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsed)) {
              return { steps: parsed };
            }
          }
        } catch (e) {
          // If all parsing fails, return null
        }
      }
      return null;
    }
  };

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

  const structuredSolution = parseStructuredSolution(solution);
  const hasLatex = containsLatex(solution);
  const latexExpressions = extractLatexExpressions(solution);
  const parsedParts = parseSolution(solution);

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {structuredSolution && (
            <div className="flex items-center gap-2">
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                Step-by-Step Solution
              </span>
              <span className="text-xs text-muted-foreground">
                {structuredSolution.steps.length} step{structuredSolution.steps.length !== 1 ? 's' : ''}
              </span>
              {structuredSolution.verification && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Verified
                </span>
              )}
            </div>
          )}
          {hasLatex && !structuredSolution && (
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
        ) : structuredSolution ? (
          // Structured step-by-step solution
          <div className="space-y-4">
            {/* Steps */}
            <div className="space-y-3">
              {structuredSolution.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-xs font-semibold text-blue-600">
                    {step.step_number}
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    <div className="flex items-center gap-2">
                      {step.latex ? (
                        <MathRenderer latex={step.latex} className="text-lg font-medium" />
                      ) : (
                        <span className="text-lg font-medium font-mono bg-background px-2 py-1 rounded">
                          {step.expression}
                        </span>
                      )}
                      {step.confidence < 1 && (
                        <span className="text-xs text-yellow-600 bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded">
                          {Math.round(step.confidence * 100)}% confidence
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Final Answer */}
            {structuredSolution.final_answer && (
              <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                  Final Answer:
                </div>
                <div className="text-lg font-bold text-green-900 dark:text-green-100">
                  {structuredSolution.final_answer}
                </div>
              </div>
            )}

            {/* Explanation */}
            {structuredSolution.explanation && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Explanation:
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300 whitespace-pre-wrap">
                  {structuredSolution.explanation}
                </div>
              </div>
            )}

            {/* Verification */}
            {structuredSolution.verification && (
              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">
                  Verification:
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  {structuredSolution.verification}
                </div>
              </div>
            )}

            {/* Method */}
            {structuredSolution.method && (
              <div className="text-xs text-muted-foreground">
                Method: {structuredSolution.method}
              </div>
            )}
          </div>
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
      {hasLatex && latexExpressions.length > 0 && !structuredSolution && (
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
