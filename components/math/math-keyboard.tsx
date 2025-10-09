"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calculator, 
  ArrowLeft, 
  ArrowRight, 
  ArrowUp, 
  ArrowDown,
  Delete,
  RotateCcw,
  Check,
  Type,
  Hash,
  Equal
} from "lucide-react";

interface MathKeyboardProps {
  onSymbolInsert: (symbol: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onEnter: () => void;
  isVisible: boolean;
  onToggle: () => void;
}

interface SymbolButton {
  symbol: string;
  label: string;
  latex?: string;
  description?: string;
}

const symbolCategories = {
  numbers: {
    name: "Numbers",
    icon: Calculator,
    symbols: [
      { symbol: "²", label: "squared", latex: "^2", description: "Squared" },
      { symbol: "³", label: "cubed", latex: "^3", description: "Cubed" },
      { symbol: "⁰", label: "zero", latex: "^0", description: "To the power of 0" },
      { symbol: "¹", label: "one", latex: "^1", description: "To the power of 1" },
      { symbol: "⁻", label: "negative", latex: "^{-}", description: "Negative exponent" },
      { symbol: "√", label: "sqrt", latex: "\\sqrt{4}", description: "Square root" },
      { symbol: "∛", label: "cbrt", latex: "\\sqrt[3]{8}", description: "Cube root" },
      { symbol: "ⁿ", label: "nth-root", latex: "\\sqrt[n]{x}", description: "Nth root" }
    ]
  },
  basic: {
    name: "Basic",
    icon: Calculator,
    symbols: [
      { symbol: "π", label: "pi", latex: "\\pi", description: "Pi constant" },
      { symbol: "e", label: "e", latex: "e", description: "Euler's number" },
      { symbol: "∞", label: "infinity", latex: "\\infty", description: "Infinity" },
      { symbol: "±", label: "plus-minus", latex: "\\pm", description: "Plus or minus" },
      { symbol: "∓", label: "minus-plus", latex: "\\mp", description: "Minus or plus" },
      { symbol: "·", label: "dot", latex: "\\cdot", description: "Dot product" },
      { symbol: "×", label: "times", latex: "\\times", description: "Multiplication" },
      { symbol: "÷", label: "divide", latex: "\\div", description: "Division" }
    ]
  },
  variables: {
    name: "Variables",
    icon: Type,
    symbols: [
      { symbol: "x", label: "x", latex: "x", description: "Variable x" },
      { symbol: "y", label: "y", latex: "y", description: "Variable y" },
      { symbol: "z", label: "z", latex: "z", description: "Variable z" },
      { symbol: "a", label: "a", latex: "a", description: "Variable a" },
      { symbol: "b", label: "b", latex: "b", description: "Variable b" },
      { symbol: "c", label: "c", latex: "c", description: "Variable c" },
      { symbol: "n", label: "n", latex: "n", description: "Variable n" },
      { symbol: "m", label: "m", latex: "m", description: "Variable m" },
      { symbol: "i", label: "i", latex: "i", description: "Variable i" },
      { symbol: "j", label: "j", latex: "j", description: "Variable j" },
      { symbol: "k", label: "k", latex: "k", description: "Variable k" },
      { symbol: "t", label: "t", latex: "t", description: "Variable t" }
    ]
  },
  functions: {
    name: "Functions",
    icon: Hash,
    symbols: [
      { symbol: "sin", label: "sin", latex: "\\sin(x)", description: "Sine function" },
      { symbol: "cos", label: "cos", latex: "\\cos(x)", description: "Cosine function" },
      { symbol: "tan", label: "tan", latex: "\\tan(x)", description: "Tangent function" },
      { symbol: "cot", label: "cot", latex: "\\cot(x)", description: "Cotangent function" },
      { symbol: "sec", label: "sec", latex: "\\sec(x)", description: "Secant function" },
      { symbol: "csc", label: "csc", latex: "\\csc(x)", description: "Cosecant function" },
      { symbol: "log", label: "log", latex: "\\log(x)", description: "Logarithm base 10" },
      { symbol: "ln", label: "ln", latex: "\\ln(x)", description: "Natural logarithm" },
      { symbol: "exp", label: "exp", latex: "\\exp(x)", description: "Exponential function" },
      { symbol: "arcsin", label: "arcsin", latex: "\\arcsin(x)", description: "Inverse sine" },
      { symbol: "arccos", label: "arccos", latex: "\\arccos(x)", description: "Inverse cosine" },
      { symbol: "arctan", label: "arctan", latex: "\\arctan(x)", description: "Inverse tangent" }
    ]
  },
  advanced: {
    name: "Advanced",
    icon: Type,
    symbols: [
      { symbol: "∫", label: "integral", latex: "\\int_{0}^{\\infty}", description: "Integral" },
      { symbol: "∑", label: "sum", latex: "\\sum_{i=1}^{n}", description: "Summation" },
      { symbol: "∏", label: "product", latex: "\\prod_{i=1}^{n}", description: "Product" },
      { symbol: "∂", label: "partial", latex: "\\partial", description: "Partial derivative" },
      { symbol: "∇", label: "nabla", latex: "\\nabla", description: "Nabla operator" },
      { symbol: "∆", label: "delta", latex: "\\Delta", description: "Delta" },
      { symbol: "α", label: "alpha", latex: "\\alpha", description: "Alpha" },
      { symbol: "β", label: "beta", latex: "\\beta", description: "Beta" },
      { symbol: "γ", label: "gamma", latex: "\\gamma", description: "Gamma" },
      { symbol: "δ", label: "delta", latex: "\\delta", description: "Delta" },
      { symbol: "ε", label: "epsilon", latex: "\\epsilon", description: "Epsilon" },
      { symbol: "θ", label: "theta", latex: "\\theta", description: "Theta" },
      { symbol: "λ", label: "lambda", latex: "\\lambda", description: "Lambda" },
      { symbol: "μ", label: "mu", latex: "\\mu", description: "Mu" },
      { symbol: "σ", label: "sigma", latex: "\\sigma", description: "Sigma" },
      { symbol: "φ", label: "phi", latex: "\\phi", description: "Phi" },
      { symbol: "ω", label: "omega", latex: "\\omega", description: "Omega" }
    ]
  },
  relations: {
    name: "Relations",
    icon: Equal,
    symbols: [
      { symbol: "≤", label: "less-equal", latex: "\\leq", description: "Less than or equal" },
      { symbol: "≥", label: "greater-equal", latex: "\\geq", description: "Greater than or equal" },
      { symbol: "≠", label: "not-equal", latex: "\\neq", description: "Not equal" },
      { symbol: "≈", label: "approx", latex: "\\approx", description: "Approximately equal" },
      { symbol: "≡", label: "equiv", latex: "\\equiv", description: "Equivalent" },
      { symbol: "∈", label: "in", latex: "\\in", description: "Element of" },
      { symbol: "∉", label: "not-in", latex: "\\notin", description: "Not element of" },
      { symbol: "∪", label: "union", latex: "\\cup", description: "Union" },
      { symbol: "∩", label: "intersection", latex: "\\cap", description: "Intersection" },
      { symbol: "⊂", label: "subset", latex: "\\subset", description: "Subset" },
      { symbol: "⊃", label: "superset", latex: "\\supset", description: "Superset" },
      { symbol: "⊆", label: "subset-equal", latex: "\\subseteq", description: "Subset or equal" },
      { symbol: "⊇", label: "superset-equal", latex: "\\supseteq", description: "Superset or equal" },
      { symbol: "∅", label: "empty", latex: "\\emptyset", description: "Empty set" }
    ]
  },
  brackets: {
    name: "Brackets",
    icon: Calculator,
    symbols: [
      { symbol: "()", label: "parentheses", latex: "()", description: "Parentheses" },
      { symbol: "[]", label: "brackets", latex: "[]", description: "Square brackets" },
      { symbol: "{}", label: "braces", latex: "\\{\\}", description: "Curly braces" },
      { symbol: "|", label: "absolute", latex: "|x|", description: "Absolute value" },
      { symbol: "⌊⌋", label: "floor", latex: "\\lfloor x \\rfloor", description: "Floor function" },
      { symbol: "⌈⌉", label: "ceiling", latex: "\\lceil x \\rceil", description: "Ceiling function" },
      { symbol: "⟨⟩", label: "angle", latex: "\\langle x \\rangle", description: "Angle brackets" },
      { symbol: "∠", label: "angle-symbol", latex: "\\angle", description: "Angle symbol" },
      { symbol: "⊥", label: "perpendicular", latex: "\\perp", description: "Perpendicular" },
      { symbol: "∥", label: "parallel", latex: "\\parallel", description: "Parallel" },
      { symbol: "△", label: "triangle", latex: "\\triangle", description: "Triangle" },
      { symbol: "□", label: "square", latex: "\\square", description: "Square" }
    ]
  }
};

export default function MathKeyboard({ 
  onSymbolInsert, 
  onBackspace, 
  onClear, 
  onEnter, 
  isVisible, 
  onToggle 
}: MathKeyboardProps) {
  const [activeCategory, setActiveCategory] = useState<keyof typeof symbolCategories>("numbers");

  // Common symbols available in all sections
  const commonSymbols = [
    { symbol: "0", label: "zero", latex: "0", description: "Zero" },
    { symbol: "1", label: "one", latex: "1", description: "One" },
    { symbol: "2", label: "two", latex: "2", description: "Two" },
    { symbol: "3", label: "three", latex: "3", description: "Three" },
    { symbol: "4", label: "four", latex: "4", description: "Four" },
    { symbol: "5", label: "five", latex: "5", description: "Five" },
    { symbol: "6", label: "six", latex: "6", description: "Six" },
    { symbol: "7", label: "seven", latex: "7", description: "Seven" },
    { symbol: "8", label: "eight", latex: "8", description: "Eight" },
    { symbol: "9", label: "nine", latex: "9", description: "Nine" },
    { symbol: ".", label: "decimal", latex: ".", description: "Decimal point" },
    { symbol: "+", label: "plus", latex: "+", description: "Plus sign" },
    { symbol: "-", label: "minus", latex: "-", description: "Minus sign" },
    { symbol: "*", label: "multiply", latex: "*", description: "Multiplication" },
    { symbol: "/", label: "divide", latex: "/", description: "Division" },
    { symbol: "(", label: "left-paren", latex: "(", description: "Left parenthesis" },
    { symbol: ")", label: "right-paren", latex: ")", description: "Right parenthesis" },
    { symbol: "=", label: "equals", latex: "=", description: "Equals sign" }
  ];

  if (!isVisible) {
    return (
      <Button
        onClick={onToggle}
        variant="outline"
        className="w-full flex items-center gap-2"
      >
        <Calculator size={16} />
        Show Math Keyboard
      </Button>
    );
  }

  const handleSymbolClick = (symbol: SymbolButton) => {
    onSymbolInsert(symbol.latex || symbol.symbol);
  };

  const handleNavigation = (direction: string) => {
    onSymbolInsert(direction);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as keyof typeof symbolCategories)}>
          <TabsList className="grid w-full grid-cols-7 mb-4">
            {Object.entries(symbolCategories).map(([key, category]) => {
              const Icon = category.icon;
              return (
                <TabsTrigger key={key} value={key} className="flex items-center gap-1 text-xs">
                  <Icon size={12} />
                  <span className="hidden sm:inline">{category.name}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Object.entries(symbolCategories).map(([key, category]) => (
            <TabsContent key={key} value={key} className="mt-0">
              <div className="space-y-4">
                {/* Common symbols section */}
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-2">Common Operations</div>
                  <div className="grid grid-cols-6 sm:grid-cols-9 gap-1">
                    {commonSymbols.map((symbol, index) => (
                      <Button
                        key={`common-${index}`}
                        variant="secondary"
                        size="sm"
                        className="h-8 text-xs font-mono hover:bg-blue-50 hover:border-blue-300"
                        onClick={() => handleSymbolClick(symbol)}
                        title={symbol.description}
                      >
                        {symbol.symbol}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Category-specific symbols */}
                <div>
                  <div className="text-xs font-medium text-gray-600 mb-2">{category.name} Symbols</div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {category.symbols.map((symbol, index) => (
                      <Button
                        key={`category-${index}`}
                        variant="outline"
                        size="sm"
                        className="h-10 text-sm font-mono hover:bg-blue-50 hover:border-blue-300"
                        onClick={() => handleSymbolClick(symbol)}
                        title={symbol.description}
                      >
                        {symbol.symbol}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Navigation and Control Row */}
        <div className="grid grid-cols-6 gap-2 mt-4 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigation("←")}
            title="Left arrow"
          >
            <ArrowLeft size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigation("→")}
            title="Right arrow"
          >
            <ArrowRight size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigation("↑")}
            title="Up arrow"
          >
            <ArrowUp size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleNavigation("↓")}
            title="Down arrow"
          >
            <ArrowDown size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onBackspace}
            title="Backspace"
          >
            <Delete size={16} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            title="Clear all"
          >
            <RotateCcw size={16} />
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <Button
            onClick={onEnter}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Check size={16} className="mr-2" />
            Done
          </Button>
          <Button
            onClick={onToggle}
            variant="outline"
            className="px-4"
          >
            Hide
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
