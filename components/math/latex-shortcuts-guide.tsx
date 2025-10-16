"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Keyboard, Zap, MousePointer } from "lucide-react";

interface LatexShortcutsGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LatexShortcutsGuide({ isOpen, onClose }: LatexShortcutsGuideProps) {
  if (!isOpen) return null;

  const tabCompletions = [
    { prefix: "\\l", completion: "\\log(", description: "Logarithm" },
    { prefix: "\\ln", completion: "\\ln(", description: "Natural logarithm" },
    { prefix: "\\s", completion: "\\sin(", description: "Sine function" },
    { prefix: "\\c", completion: "\\cos(", description: "Cosine function" },
    { prefix: "\\t", completion: "\\tan(", description: "Tangent function" },
    { prefix: "\\sq", completion: "\\sqrt{", description: "Square root" },
    { prefix: "\\f", completion: "\\frac{}{}", description: "Fraction" },
    { prefix: "\\i", completion: "\\int", description: "Integral" },
    { prefix: "\\su", completion: "\\sum", description: "Summation" },
    { prefix: "\\li", completion: "\\lim", description: "Limit" },
    { prefix: "\\a", completion: "\\alpha", description: "Alpha" },
    { prefix: "\\b", completion: "\\beta", description: "Beta" },
    { prefix: "\\g", completion: "\\gamma", description: "Gamma" },
    { prefix: "\\p", completion: "\\pi", description: "Pi" },
    { prefix: "\\o", completion: "\\omega", description: "Omega" }
  ];

  const keyboardShortcuts = [
    { key: "Tab", description: "Complete LaTeX command" },
    { key: "Ctrl+Enter", description: "Submit question" },
    { key: "Backspace", description: "Smart delete brackets" },
    { key: "(", description: "Auto-close parentheses" },
    { key: "{", description: "Auto-close braces" },
    { key: "[", description: "Auto-close brackets" }
  ];

  const commonSymbols = [
    { symbol: "½", latex: "\\frac{1}{2}", description: "One half" },
    { symbol: "√", latex: "\\sqrt{}", description: "Square root" },
    { symbol: "x²", latex: "x^2", description: "Squared" },
    { symbol: "∫", latex: "\\int", description: "Integral" },
    { symbol: "∑", latex: "\\sum", description: "Summation" },
    { symbol: "π", latex: "\\pi", description: "Pi" },
    { symbol: "∞", latex: "\\infty", description: "Infinity" },
    { symbol: "±", latex: "\\pm", description: "Plus minus" },
    { symbol: "≤", latex: "\\leq", description: "Less than or equal" },
    { symbol: "≥", latex: "\\geq", description: "Greater than or equal" },
    { symbol: "≠", latex: "\\neq", description: "Not equal" },
    { symbol: "→", latex: "\\rightarrow", description: "Right arrow" },
    { symbol: "α", latex: "\\alpha", description: "Alpha" },
    { symbol: "β", latex: "\\beta", description: "Beta" },
    { symbol: "γ", latex: "\\gamma", description: "Gamma" },
    { symbol: "θ", latex: "\\theta", description: "Theta" }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="text-blue-600" size={20} />
            LaTeX Shortcuts & Help
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Tab Completions */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Zap className="text-yellow-600" size={18} />
              Tab Completions
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Type the prefix and press Tab to complete LaTeX commands
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tabCompletions.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Badge variant="outline" className="font-mono">
                    {item.prefix}
                  </Badge>
                  <span className="text-sm font-mono text-blue-600">
                    {item.completion}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {item.description}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Keyboard className="text-green-600" size={18} />
              Keyboard Shortcuts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {keyboardShortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Badge variant="secondary" className="font-mono">
                    {shortcut.key}
                  </Badge>
                  <span className="text-sm">
                    {shortcut.description}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Common Symbols */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <MousePointer className="text-purple-600" size={18} />
              Common Symbols
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Click on symbols in the keyboard below to insert them
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {commonSymbols.map((symbol, index) => (
                <div key={index} className="flex flex-col items-center gap-2 p-3 bg-muted/50 rounded-lg">
                  <span className="text-2xl font-bold">
                    {symbol.symbol}
                  </span>
                  <span className="text-xs font-mono text-blue-600">
                    {symbol.latex}
                  </span>
                  <span className="text-xs text-muted-foreground text-center">
                    {symbol.description}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💡 Pro Tips
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Use ^&#123;&#125; for superscripts and _&#123;&#125; for subscripts</li>
              <li>• Brackets auto-close when you type (, &#123;, or [</li>
              <li>• Press Tab to complete LaTeX commands quickly</li>
              <li>• Use \frac&#123;numerator&#125;&#123;denominator&#125; for fractions</li>
              <li>• Backspace smartly deletes matching bracket pairs</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
