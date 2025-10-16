"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  X, 
  Send, 
  Eye, 
  EyeOff, 
  HelpCircle,
  Loader2,
  Image as ImageIcon,
  FileText,
  Clipboard
} from "lucide-react";
import MathRenderer from "./math-renderer";
import LatexShortcutsGuide from "./latex-shortcuts-guide";
import { 
  validateLatex, 
  insertLatexAtCursor, 
  getTabCompletion, 
  autoCloseBrackets, 
  smartBackspace,
  containsLatex,
  type CursorPosition
} from "@/lib/latex-helpers";

interface MathGptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onImageUpload: (file: File) => void;
  selectedImage: File | null;
  imagePreview?: string | null;
  onRemoveImage: () => void;
  isLoading: boolean;
  showLatexPreview?: boolean;
}

// Symbol categories with LaTeX commands
const symbolCategories = {
  Popular: [
    { symbol: "½", latex: "\\frac{1}{2}", tooltip: "One half" },
    { symbol: "√", latex: "\\sqrt{}", tooltip: "Square root" },
    { symbol: "x²", latex: "^2", tooltip: "Squared" },
    { symbol: "x⁻¹", latex: "^{-1}", tooltip: "Inverse" },
    { symbol: "log", latex: "\\log(", tooltip: "Logarithm" },
    { symbol: "ln", latex: "\\ln(", tooltip: "Natural log" },
    { symbol: "∫", latex: "\\int", tooltip: "Integral" },
    { symbol: "∑", latex: "\\sum", tooltip: "Summation" },
    { symbol: "π", latex: "\\pi", tooltip: "Pi" },
    { symbol: "∞", latex: "\\infty", tooltip: "Infinity" },
    { symbol: "±", latex: "\\pm", tooltip: "Plus minus" },
    { symbol: "=", latex: "=", tooltip: "Equals" }
  ],
  "sin/cos": [
    { symbol: "sin", latex: "\\sin(", tooltip: "Sine" },
    { symbol: "cos", latex: "\\cos(", tooltip: "Cosine" },
    { symbol: "tan", latex: "\\tan(", tooltip: "Tangent" },
    { symbol: "cot", latex: "\\cot(", tooltip: "Cotangent" },
    { symbol: "sec", latex: "\\sec(", tooltip: "Secant" },
    { symbol: "csc", latex: "\\csc(", tooltip: "Cosecant" },
    { symbol: "arcsin", latex: "\\arcsin(", tooltip: "Arc sine" },
    { symbol: "arccos", latex: "\\arccos(", tooltip: "Arc cosine" },
    { symbol: "arctan", latex: "\\arctan(", tooltip: "Arc tangent" }
  ],
  Calculus: [
    { symbol: "∫", latex: "\\int", tooltip: "Integral" },
    { symbol: "∑", latex: "\\sum", tooltip: "Summation" },
    { symbol: "∏", latex: "\\prod", tooltip: "Product" },
    { symbol: "∂", latex: "\\partial", tooltip: "Partial derivative" },
    { symbol: "∇", latex: "\\nabla", tooltip: "Nabla" },
    { symbol: "lim", latex: "\\lim", tooltip: "Limit" },
    { symbol: "d/dx", latex: "\\frac{d}{dx}", tooltip: "Derivative" }
  ],
  "≥ ≠": [
    { symbol: "≤", latex: "\\leq", tooltip: "Less than or equal" },
    { symbol: "≥", latex: "\\geq", tooltip: "Greater than or equal" },
    { symbol: "≠", latex: "\\neq", tooltip: "Not equal" },
    { symbol: "≈", latex: "\\approx", tooltip: "Approximately" },
    { symbol: "±", latex: "\\pm", tooltip: "Plus minus" },
    { symbol: "∓", latex: "\\mp", tooltip: "Minus plus" },
    { symbol: "÷", latex: "\\div", tooltip: "Division" },
    { symbol: "×", latex: "\\times", tooltip: "Multiplication" }
  ],
  "→ ∈ ⊂": [
    { symbol: "→", latex: "\\rightarrow", tooltip: "Right arrow" },
    { symbol: "←", latex: "\\leftarrow", tooltip: "Left arrow" },
    { symbol: "↔", latex: "\\leftrightarrow", tooltip: "Left-right arrow" },
    { symbol: "∈", latex: "\\in", tooltip: "Element of" },
    { symbol: "∉", latex: "\\notin", tooltip: "Not element of" },
    { symbol: "⊂", latex: "\\subset", tooltip: "Subset" },
    { symbol: "⊃", latex: "\\supset", tooltip: "Superset" },
    { symbol: "∪", latex: "\\cup", tooltip: "Union" },
    { symbol: "∩", latex: "\\cap", tooltip: "Intersection" }
  ],
  "ΩΔ": [
    { symbol: "α", latex: "\\alpha", tooltip: "Alpha" },
    { symbol: "β", latex: "\\beta", tooltip: "Beta" },
    { symbol: "γ", latex: "\\gamma", tooltip: "Gamma" },
    { symbol: "δ", latex: "\\delta", tooltip: "Delta" },
    { symbol: "θ", latex: "\\theta", tooltip: "Theta" },
    { symbol: "λ", latex: "\\lambda", tooltip: "Lambda" },
    { symbol: "μ", latex: "\\mu", tooltip: "Mu" },
    { symbol: "π", latex: "\\pi", tooltip: "Pi" },
    { symbol: "σ", latex: "\\sigma", tooltip: "Sigma" },
    { symbol: "ω", latex: "\\omega", tooltip: "Omega" },
    { symbol: "Δ", latex: "\\Delta", tooltip: "Delta" },
    { symbol: "Σ", latex: "\\Sigma", tooltip: "Sigma" },
    { symbol: "Ω", latex: "\\Omega", tooltip: "Omega" }
  ]
};

export default function MathGptInput({
  value,
  onChange,
  onSubmit,
  onImageUpload,
  selectedImage,
  imagePreview,
  onRemoveImage,
  isLoading,
  showLatexPreview = false
}: MathGptInputProps) {
  const [activeCategory, setActiveCategory] = useState<keyof typeof symbolCategories>("Popular");
  const [showPreview, setShowPreview] = useState(showLatexPreview);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [validation, setValidation] = useState<{ valid: boolean; errors: string[]; warnings: string[] }>({ valid: true, errors: [], warnings: [] });
  const [recentSymbols, setRecentSymbols] = useState<string[]>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate LaTeX on value change
  useEffect(() => {
    if (containsLatex(value)) {
      const result = validateLatex(value);
      setValidation(result);
    } else {
      setValidation({ valid: true, errors: [], warnings: [] });
    }
  }, [value]);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    }
  }, [onImageUpload]);

  // Handle paste from clipboard
  const handlePaste = useCallback(async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const clipboardItem of clipboardItems) {
        for (const type of clipboardItem.types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);
            const file = new File([blob], 'pasted-image.png', { type });
            onImageUpload(file);
            return;
          }
        }
      }
    } catch (error) {
      console.error('Failed to paste image:', error);
    }
  }, [onImageUpload]);

  // Handle drag and drop
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      onImageUpload(file);
    }
  }, [onImageUpload]);

  // Insert symbol at cursor position
  const insertSymbol = useCallback((latex: string) => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const result = insertLatexAtCursor(value, latex, start);
      onChange(result.newText);
      
      // Update recent symbols
      setRecentSymbols(prev => {
        const updated = [latex, ...prev.filter(s => s !== latex)].slice(0, 5);
        return updated;
      });
      
      // Set cursor position
      setTimeout(() => {
        textarea.setSelectionRange(result.newCursorPos, result.newCursorPos);
        textarea.focus();
      }, 0);
    }
  }, [value, onChange]);

  // Enhanced textarea change handler
  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    const currentValue = textarea.value;
    const cursorPosition = textarea.selectionStart;
    
    // Auto-close brackets
    const result = autoCloseBrackets(currentValue, cursorPosition);
    onChange(result.newText);
    
    // Set cursor position after state update
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(result.newCursorPos, result.newCursorPos);
        textareaRef.current.focus();
      }
    }, 0);
  }, [onChange]);

  // Enhanced keyboard event handler
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = e.target as HTMLTextAreaElement;
    const cursorPosition = textarea.selectionStart;
    const currentValue = value;
    
    // Handle backspace for auto-closed brackets
    if (e.key === 'Backspace') {
      const result = smartBackspace(currentValue, cursorPosition);
      if (result) {
        e.preventDefault();
        onChange(result.newText);
        setTimeout(() => {
          textarea.setSelectionRange(result.newCursorPos, result.newCursorPos);
          textarea.focus();
        }, 0);
        return;
      }
    }
    
    // Handle Tab key for LaTeX completion
    if (e.key === 'Tab') {
      e.preventDefault();
      const textBeforeCursor = currentValue.substring(0, cursorPosition);
      const textAfterCursor = currentValue.substring(cursorPosition);
      
      // Find the last LaTeX command prefix
      const latexPrefixMatch = textBeforeCursor.match(/\\[a-zA-Z]*$/);
      if (latexPrefixMatch) {
        const prefix = latexPrefixMatch[0];
        const completion = getTabCompletion(prefix);
        
        if (completion) {
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
    
    // Handle Ctrl+Enter for submit
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      if (value.trim() && !isLoading) {
        onSubmit();
      }
    }
  }, [value, onChange, onSubmit, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  // Add keyboard shortcut for pasting images
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if Ctrl+V (or Cmd+V on Mac) is pressed
      if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        // Only handle paste if no text input is focused
        if (document.activeElement !== textareaRef.current) {
          event.preventDefault();
          handlePaste();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlePaste]);

  const hasLatex = containsLatex(value);
  const canSubmit = (value.trim() || selectedImage) && !isLoading && validation.valid;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Drag and Drop Upload Zone */}
      <div
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors cursor-pointer"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
        
        {selectedImage ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3">
              <ImageIcon className="text-blue-600" size={24} />
              <span className="text-sm font-medium">{selectedImage.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveImage();
                }}
              >
                <X size={16} />
              </Button>
            </div>
            {imagePreview && (
              <div className="flex justify-center">
                <img 
                  src={imagePreview} 
                  alt="Uploaded image preview" 
                  className="max-w-full max-h-48 rounded-lg border border-gray-200 dark:border-gray-700"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="mx-auto text-gray-400" size={32} />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Drag & drop or <span className="text-blue-600 font-medium">click to add images or PDF</span>
              </p>
            </div>
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePaste();
                }}
                className="flex items-center gap-2"
              >
                <Clipboard size={14} />
                Paste Image (Ctrl+V)
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Text Input and Preview Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Text Input Area */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your question here..."
            className="w-full min-h-[120px] px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-background resize-none font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          
          {/* Input Controls */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2">
              <Badge variant={hasLatex ? "default" : "secondary"} className="text-xs">
                Σ Math Input
              </Badge>
              {validation.errors.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {validation.errors.length} error{validation.errors.length !== 1 ? 's' : ''}
                </Badge>
              )}
              {validation.warnings.length > 0 && (
                <Badge variant="outline" className="text-xs text-yellow-600">
                  {validation.warnings.length} warning{validation.warnings.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {hasLatex && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-1"
                >
                  {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
                  {showPreview ? "Hide" : "Preview"}
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowShortcuts(true)}
                className="flex items-center gap-1"
              >
                <HelpCircle size={14} />
                Help
              </Button>
            </div>
          </div>
        </div>

        {/* LaTeX Preview */}
        <div className="relative">
          {hasLatex ? (
            <div className="bg-muted/50 rounded-lg p-4 min-h-[120px] border border-gray-300 dark:border-gray-600">
              <div className="text-sm font-medium mb-2 text-muted-foreground">LaTeX Preview:</div>
              <MathRenderer latex={value} className="text-lg" />
            </div>
          ) : (
            <div className="bg-muted/30 rounded-lg p-4 min-h-[120px] border border-gray-300 dark:border-gray-600 flex items-center justify-center">
              <div className="text-sm text-muted-foreground text-center">
                <Eye className="mx-auto mb-2" size={24} />
                <p>LaTeX preview will appear here</p>
                <p className="text-xs mt-1">Type LaTeX commands to see live rendering</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Validation Messages */}
      {validation.errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
          <div className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Errors:</div>
          <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
            {validation.errors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <div className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">Warnings:</div>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
            {validation.warnings.map((warning, index) => (
              <li key={index}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Math Keyboard */}
      <div className="space-y-3">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2">
          {Object.keys(symbolCategories).map((category) => (
            <Button
              key={category}
              variant={activeCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory(category as keyof typeof symbolCategories)}
              className="text-xs"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Recent Symbols */}
        {recentSymbols.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Recent:</div>
            <div className="flex flex-wrap gap-2">
              {recentSymbols.map((symbol, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => insertSymbol(symbol)}
                  className="text-xs"
                >
                  {symbol}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Symbol Buttons */}
        <div className="flex flex-wrap gap-2">
          {symbolCategories[activeCategory].map((item, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => insertSymbol(item.latex)}
              title={`${item.symbol} → ${item.latex} (${item.tooltip})`}
              className="text-sm font-mono"
            >
              {item.symbol}
            </Button>
          ))}
        </div>
      </div>

      {/* Submit and Clear Buttons */}
      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={() => {
            onChange("");
            onRemoveImage();
          }}
          className="flex items-center gap-2"
        >
          <X size={16} />
          Clear
        </Button>
        <Button
          onClick={onSubmit}
          disabled={!canSubmit}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Send size={16} />
          )}
          {isLoading ? "Solving..." : "Submit"}
        </Button>
      </div>

      {/* Shortcuts Guide Modal */}
      <LatexShortcutsGuide
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  );
}
