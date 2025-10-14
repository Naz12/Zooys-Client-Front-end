"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  Eye, 
  EyeOff, 
  Copy, 
  AlertCircle,
  CheckCircle
} from "lucide-react";
import CalculatorKeyboard from "./calculator-keyboard";

interface SimpleMathInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showPreview?: boolean;
  showKeyboard?: boolean;
  maxLength?: number;
  disabled?: boolean;
}

export default function SimpleMathInput({
  value,
  onChange,
  placeholder = "Enter your math problem here...",
  className = "",
  showPreview = true,
  showKeyboard = true,
  maxLength = 1000,
  disabled = false
}: SimpleMathInputProps) {
  const [showMathPreview, setShowMathPreview] = useState(true);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Validate mathematical expression
  const validateMathExpression = (expression: string) => {
    if (!expression.trim()) {
      setIsValid(true);
      setErrorMessage("");
      return;
    }

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
        textarea.focus();
      }, 0);
    }
  };

  // Enhanced textarea onChange handler with smart bracket closing
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    const currentValue = textarea.value;
    const cursorPosition = textarea.selectionStart;
    
    // Check for bracket/parenthesis auto-closing
    const lastChar = currentValue[cursorPosition - 1];
    const nextChar = currentValue[cursorPosition];
    
    let newValue = currentValue;
    let newCursorPosition = cursorPosition;
    
    // Auto-close brackets and position cursor inside
    if (lastChar === '(' && nextChar !== ')') {
      newValue = currentValue.substring(0, cursorPosition) + ')' + currentValue.substring(cursorPosition);
      newCursorPosition = cursorPosition;
    } else if (lastChar === '{' && nextChar !== '}') {
      newValue = currentValue.substring(0, cursorPosition) + '}' + currentValue.substring(cursorPosition);
      newCursorPosition = cursorPosition;
    } else if (lastChar === '[' && nextChar !== ']') {
      newValue = currentValue.substring(0, cursorPosition) + ']' + currentValue.substring(cursorPosition);
      newCursorPosition = cursorPosition;
    }
    
    // Smart cursor positioning for LaTeX functions
    const latexFunctions = [
      '\\log(', '\\ln(', '\\sin(', '\\cos(', '\\tan(', '\\sqrt{', '\\frac{',
      '\\int(', '\\sum(', '\\lim(', '\\exp(', '\\abs{', '\\norm{'
    ];
    
    for (const func of latexFunctions) {
      if (currentValue.endsWith(func)) {
        // Position cursor inside the brackets/braces
        newCursorPosition = currentValue.length;
        break;
      }
    }
    
    onChange(newValue);
    validateMathExpression(newValue);
    
    // Set cursor position after state update
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Enhanced keyboard event handler for smart bracket handling
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.target as HTMLTextAreaElement;
    const cursorPosition = textarea.selectionStart;
    const currentValue = textarea.value;
    
    // Handle backspace for auto-closed brackets
    if (e.key === 'Backspace') {
      const charBefore = currentValue[cursorPosition - 1];
      const charAfter = currentValue[cursorPosition];
      
      // If deleting an opening bracket and there's a matching closing bracket right after
      if ((charBefore === '(' && charAfter === ')') ||
          (charBefore === '{' && charAfter === '}') ||
          (charBefore === '[' && charAfter === ']')) {
        e.preventDefault();
        const newValue = currentValue.substring(0, cursorPosition - 1) + 
                        currentValue.substring(cursorPosition + 1);
        onChange(newValue);
        setTimeout(() => {
          textarea.setSelectionRange(cursorPosition - 1, cursorPosition - 1);
          textarea.focus();
        }, 0);
        return;
      }
    }
    
    // Handle Tab key for LaTeX function completion
    if (e.key === 'Tab') {
      e.preventDefault();
      const textBeforeCursor = currentValue.substring(0, cursorPosition);
      const textAfterCursor = currentValue.substring(cursorPosition);
      
      // Common LaTeX function completions
      const completions = {
        '\\l': '\\log(',
        '\\ln': '\\ln(',
        '\\s': '\\sin(',
        '\\c': '\\cos(',
        '\\t': '\\tan(',
        '\\sq': '\\sqrt{',
        '\\f': '\\frac{',
        '\\i': '\\int(',
        '\\su': '\\sum(',
        '\\li': '\\lim(',
        '\\e': '\\exp(',
        '\\a': '\\abs{',
        '\\n': '\\norm{'
      };
      
      for (const [prefix, completion] of Object.entries(completions)) {
        if (textBeforeCursor.endsWith(prefix)) {
          const newValue = textBeforeCursor.substring(0, textBeforeCursor.length - prefix.length) + 
                          completion + textAfterCursor;
          onChange(newValue);
          setTimeout(() => {
            const newCursorPos = textBeforeCursor.length - prefix.length + completion.length;
            textarea.setSelectionRange(newCursorPos, newCursorPos);
            textarea.focus();
          }, 0);
          return;
        }
      }
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
          textarea.focus();
        }, 0);
      } else if (start !== end) {
        // Delete selection
        const newValue = value.substring(0, start) + value.substring(end);
        onChange(newValue);
        setTimeout(() => {
          textarea.setSelectionRange(start, start);
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

          {/* Side by Side Layout: LaTeX Input and Math Preview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* LaTeX Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                LaTeX Input:
              </label>
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={value}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
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
            </div>

            {/* Math Preview */}
            {showMathPreview && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Math Preview:
                </label>
                <div className="border rounded-lg p-4 bg-muted/50 min-h-[120px] flex items-center justify-center">
                  {value.trim() ? (
                    <div className="text-lg font-mono text-center">
                      {convertLatexToReadable(value)}
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground text-center">
                      Enter LaTeX to see preview
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

        </CardContent>
      </Card>

      {/* Calculator Keyboard */}
      {showKeyboard && (
        <CalculatorKeyboard
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





