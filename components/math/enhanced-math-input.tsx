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
  CheckCircle,
  Edit3
} from "lucide-react";
import MathRenderer from "./math-renderer";
import InteractiveElement from "./interactive-element";
import CalculatorKeyboard from "./calculator-keyboard";

interface EnhancedMathInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showPreview?: boolean;
  showKeyboard?: boolean;
  maxLength?: number;
  disabled?: boolean;
}

interface EditableElement {
  id: string;
  type: 'number' | 'variable' | 'exponent' | 'function' | 'operator';
  value: string;
  latex: string;
  editable: boolean;
}

export default function EnhancedMathInput({
  value,
  onChange,
  placeholder = "Enter your math problem here...",
  className = "",
  showPreview = true,
  showKeyboard = true,
  maxLength = 1000,
  disabled = false
}: EnhancedMathInputProps) {
  const [showMathPreview, setShowMathPreview] = useState(true);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [editingElement, setEditingElement] = useState<string | null>(null);
  const [editableElements, setEditableElements] = useState<EditableElement[]>([]);
  const [editValue, setEditValue] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse LaTeX and extract editable elements
  const parseEditableElements = (latex: string): EditableElement[] => {
    const elements: EditableElement[] = [];
    let elementId = 0;

    // Extract numbers
    const numberMatches = latex.match(/\b\d+(\.\d+)?\b/g);
    numberMatches?.forEach(match => {
      elements.push({
        id: `num_${elementId++}`,
        type: 'number',
        value: match,
        latex: match,
        editable: true
      });
    });

    // Extract variables
    const variableMatches = latex.match(/\b[a-zA-Z]\b/g);
    variableMatches?.forEach(match => {
      if (!['e', 'i', 'π'].includes(match)) { // Exclude common constants
        elements.push({
          id: `var_${elementId++}`,
          type: 'variable',
          value: match,
          latex: match,
          editable: true
        });
      }
    });

    // Extract exponents
    const exponentMatches = latex.match(/\^(\d+)/g);
    exponentMatches?.forEach(match => {
      const exp = match.replace('^', '');
      elements.push({
        id: `exp_${elementId++}`,
        type: 'exponent',
        value: exp,
        latex: `^{${exp}}`,
        editable: true
      });
    });

    return elements;
  };

  // Update editable elements when value changes
  useEffect(() => {
    const elements = parseEditableElements(value);
    setEditableElements(elements);
    validateMathExpression(value);
  }, [value]);

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
    // For now, just append to the end
    // In a full implementation, you'd track cursor position
    const newValue = value + symbol;
    onChange(newValue);
  };

  // Handle backspace
  const handleBackspace = () => {
    if (value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  // Clear all text
  const handleClear = () => {
    onChange("");
    setSelectedElement(null);
    setEditingElement(null);
  };

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  // Handle element selection
  const handleElementSelect = (elementId: string) => {
    setSelectedElement(elementId);
    setEditingElement(null);
  };

  // Handle element editing
  const handleElementEdit = (elementId: string, currentValue: string) => {
    setEditingElement(elementId);
    setEditValue(currentValue);
  };

  // Handle element edit confirmation
  const handleElementConfirm = (elementId: string, newValue: string) => {
    const element = editableElements.find(el => el.id === elementId);
    if (element) {
      // Replace the element value in the LaTeX
      const newLatex = value.replace(element.latex, newValue);
      onChange(newLatex);
    }
    setEditingElement(null);
    setSelectedElement(null);
  };

  // Handle element edit cancellation
  const handleElementCancel = () => {
    setEditingElement(null);
    setSelectedElement(null);
  };

  // Handle element click from MathRenderer
  const handleElementClick = (elementId: string, element: EditableElement) => {
    setSelectedElement(elementId);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Input Area */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calculator className="text-blue-600" size={20} />
              Enhanced Math Input
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

          {/* Math Input Area */}
          <div className="space-y-3">
            {/* Manual Text Input */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                LaTeX Input (Manual Editing):
              </label>
              <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-md bg-background resize-none font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent border-border"
                maxLength={maxLength}
                disabled={disabled}
              />
              <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                {value.length}/{maxLength}
              </div>
            </div>

            {/* Editable Math Preview */}
            {value.trim() && (
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Math Preview (Click to Edit):
                </label>
                <div
                  ref={containerRef}
                  className="w-full min-h-[80px] px-3 py-2 text-sm border rounded-md bg-background border-border cursor-text hover:border-blue-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200"
                  style={{ minHeight: '80px' }}
                  onClick={() => {
                    // Focus on the textarea when clicking the preview
                    const textarea = document.querySelector('textarea');
                    if (textarea) {
                      textarea.focus();
                    }
                  }}
                >
                  <MathRenderer
                    latex={value}
                    editableElements={editableElements}
                    onElementClick={handleElementClick}
                    className="w-full"
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Click anywhere in the preview to edit the LaTeX input above
                </div>
              </div>
            )}
          </div>

          {/* Editable Elements Info */}
          {editableElements.length > 0 && (
            <div className="border rounded-lg p-3 bg-muted/50">
              <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <Edit3 size={14} />
                Editable Elements ({editableElements.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {editableElements.map((element) => (
                  <InteractiveElement
                    key={element.id}
                    element={element}
                    isSelected={selectedElement === element.id}
                    isEditing={editingElement === element.id}
                    onSelect={handleElementSelect}
                    onEdit={handleElementEdit}
                    onCancel={handleElementCancel}
                    onConfirm={handleElementConfirm}
                    position={{ x: 0, y: 0, width: 50, height: 20 }}
                  />
                ))}
              </div>
            </div>
          )}

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
