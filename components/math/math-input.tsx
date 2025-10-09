"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  Eye, 
  EyeOff, 
  Copy, 
  RotateCcw,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import MathKeyboard from "./math-keyboard";

interface MathInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showPreview?: boolean;
  showKeyboard?: boolean;
  maxLength?: number;
  disabled?: boolean;
}

export default function MathInput({
  value,
  onChange,
  placeholder = "Enter your math problem here...",
  className = "",
  showPreview = true,
  showKeyboard = true,
  maxLength = 1000,
  disabled = false
}: MathInputProps) {
  const [showMathPreview, setShowMathPreview] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(showKeyboard);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update cursor position when textarea focus changes
  const handleTextareaFocus = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setCursorPosition(e.target.selectionStart);
    validateMathExpression(newValue);
  };

  const handleTextareaClick = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  };

  const handleTextareaKeyUp = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  };

  // Validate mathematical expression
  const validateMathExpression = (expression: string) => {
    if (!expression.trim()) {
      setIsValid(true);
      setErrorMessage("");
      return;
    }

    // Basic validation rules
    const errors: string[] = [];

    // Check for unmatched parentheses
    const openParens = (expression.match(/\(/g) || []).length;
    const closeParens = (expression.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push("Unmatched parentheses");
    }

    // Check for unmatched brackets
    const openBrackets = (expression.match(/\[/g) || []).length;
    const closeBrackets = (expression.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      errors.push("Unmatched brackets");
    }

    // Check for unmatched braces
    const openBraces = (expression.match(/\{/g) || []).length;
    const closeBraces = (expression.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push("Unmatched braces");
    }

    // Check for invalid operators
    if (expression.match(/[+\-*/]{2,}/)) {
      errors.push("Consecutive operators");
    }

    // Check for empty functions
    if (expression.match(/\\[a-zA-Z]+\{\s*\}/)) {
      errors.push("Empty function arguments");
    }

    setIsValid(errors.length === 0);
    setErrorMessage(errors.join(", "));
  };

  // Insert symbol at cursor position
  const insertSymbol = (symbol: string) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + symbol + value.substring(end);
      
      onChange(newValue);
      
      // Set cursor position after inserted symbol
      setTimeout(() => {
        const newPosition = start + symbol.length;
        textarea.setSelectionRange(newPosition, newPosition);
        setCursorPosition(newPosition);
        textarea.focus();
      }, 0);
    }
  };

  // Handle backspace
  const handleBackspace = () => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      if (start === end && start > 0) {
        // Single character backspace
        const newValue = value.substring(0, start - 1) + value.substring(start);
        onChange(newValue);
        setTimeout(() => {
          textarea.setSelectionRange(start - 1, start - 1);
          setCursorPosition(start - 1);
          textarea.focus();
        }, 0);
      } else if (start !== end) {
        // Delete selection
        const newValue = value.substring(0, start) + value.substring(end);
        onChange(newValue);
        setTimeout(() => {
          textarea.setSelectionRange(start, start);
          setCursorPosition(start);
          textarea.focus();
        }, 0);
      }
    }
  };

  // Clear all text
  const handleClear = () => {
    onChange("");
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  // Convert LaTeX to readable format for preview
  const convertLatexToReadable = (latex: string): string => {
    return latex
      .replace(/\\pi/g, "π")
      .replace(/\\infty/g, "∞")
      .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
      .replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, "∛($2)")
      .replace(/\^(\d+)/g, "⁰¹²³⁴⁵⁶⁷⁸⁹".split("")[parseInt("$1")] || "^$1")
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")
      .replace(/\\sin/g, "sin")
      .replace(/\\cos/g, "cos")
      .replace(/\\tan/g, "tan")
      .replace(/\\log/g, "log")
      .replace(/\\ln/g, "ln")
      .replace(/\\int/g, "∫")
      .replace(/\\sum/g, "∑")
      .replace(/\\alpha/g, "α")
      .replace(/\\beta/g, "β")
      .replace(/\\gamma/g, "γ")
      .replace(/\\theta/g, "θ")
      .replace(/\\leq/g, "≤")
      .replace(/\\geq/g, "≥")
      .replace(/\\neq/g, "≠")
      .replace(/\\approx/g, "≈")
      .replace(/\\pm/g, "±");
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Input Area */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="text-blue-600" size={20} />
              Math Problem Input
            </CardTitle>
            <div className="flex items-center gap-2">
              {showPreview && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMathPreview(!showMathPreview)}
                  className="flex items-center gap-2"
                >
                  {showMathPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                  {showMathPreview ? "Hide Preview" : "Show Preview"}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                disabled={!value.trim()}
                className="flex items-center gap-2"
              >
                <Copy size={16} />
                Copy
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Validation Status */}
          {value.trim() && (
            <div className="flex items-center gap-2">
              {isValid ? (
                <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle size={12} className="mr-1" />
                  Valid Expression
                </Badge>
              ) : (
                <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
                  <AlertCircle size={12} className="mr-1" />
                  {errorMessage}
                </Badge>
              )}
            </div>
          )}

          {/* Text Input */}
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleTextareaChange}
              onFocus={handleTextareaFocus}
              onClick={handleTextareaClick}
              onKeyUp={handleTextareaKeyUp}
              placeholder={placeholder}
              className={`w-full min-h-[120px] px-3 py-2 text-sm border rounded-md bg-background resize-none font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                !isValid ? "border-red-300 focus:border-red-500" : "border-border"
              }`}
              maxLength={maxLength}
              disabled={disabled}
            />
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {value.length}/{maxLength}
            </div>
          </div>

          {/* Math Preview */}
          {showMathPreview && value.trim() && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Preview:
              </div>
              <div className="text-lg font-mono">
                {convertLatexToReadable(value)}
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {/* Math Keyboard */}
      {showKeyboard && (
        <MathKeyboard
          onSymbolInsert={insertSymbol}
          onBackspace={handleBackspace}
          onClear={handleClear}
          onEnter={() => setIsKeyboardVisible(false)}
          isVisible={isKeyboardVisible}
          onToggle={() => setIsKeyboardVisible(!isKeyboardVisible)}
        />
      )}
    </div>
  );
}
