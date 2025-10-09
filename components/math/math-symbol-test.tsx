"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import MathRenderer from "./math-renderer";
import MathKeyboard from "./math-keyboard";

export default function MathSymbolTest() {
  const [testExpression, setTestExpression] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const testSymbols = {
    numbers: [
      { latex: "^2", name: "Squared" },
      { latex: "^3", name: "Cubed" },
      { latex: "^0", name: "To power 0" },
      { latex: "^1", name: "To power 1" },
      { latex: "^{-}", name: "Negative exponent" },
      { latex: "\\sqrt{4}", name: "Square root" },
      { latex: "\\sqrt[3]{8}", name: "Cube root" },
      { latex: "\\sqrt[n]{x}", name: "Nth root" }
    ],
    common: [
      { latex: "0", name: "Zero" },
      { latex: "1", name: "One" },
      { latex: "2", name: "Two" },
      { latex: "3", name: "Three" },
      { latex: "4", name: "Four" },
      { latex: "5", name: "Five" },
      { latex: "6", name: "Six" },
      { latex: "7", name: "Seven" },
      { latex: "8", name: "Eight" },
      { latex: "9", name: "Nine" },
      { latex: ".", name: "Decimal point" },
      { latex: "+", name: "Plus sign" },
      { latex: "-", name: "Minus sign" },
      { latex: "*", name: "Multiplication" },
      { latex: "/", name: "Division" },
      { latex: "(", name: "Left parenthesis" },
      { latex: ")", name: "Right parenthesis" },
      { latex: "=", name: "Equals sign" }
    ],
    variables: [
      { latex: "x", name: "Variable x" },
      { latex: "y", name: "Variable y" },
      { latex: "z", name: "Variable z" },
      { latex: "a", name: "Variable a" },
      { latex: "b", name: "Variable b" },
      { latex: "c", name: "Variable c" },
      { latex: "n", name: "Variable n" },
      { latex: "m", name: "Variable m" },
      { latex: "i", name: "Variable i" },
      { latex: "j", name: "Variable j" },
      { latex: "k", name: "Variable k" },
      { latex: "t", name: "Variable t" }
    ],
    basic: [
      { latex: "\\pi", name: "Pi" },
      { latex: "e", name: "Euler's number" },
      { latex: "\\infty", name: "Infinity" },
      { latex: "\\pm", name: "Plus or minus" },
      { latex: "\\mp", name: "Minus or plus" },
      { latex: "\\cdot", name: "Dot product" },
      { latex: "\\times", name: "Multiplication" },
      { latex: "\\div", name: "Division" }
    ],
    functions: [
      { latex: "\\sin(x)", name: "Sine" },
      { latex: "\\cos(x)", name: "Cosine" },
      { latex: "\\tan(x)", name: "Tangent" },
      { latex: "\\cot(x)", name: "Cotangent" },
      { latex: "\\sec(x)", name: "Secant" },
      { latex: "\\csc(x)", name: "Cosecant" },
      { latex: "\\log(x)", name: "Logarithm" },
      { latex: "\\ln(x)", name: "Natural log" },
      { latex: "\\exp(x)", name: "Exponential" },
      { latex: "\\arcsin(x)", name: "Inverse sine" },
      { latex: "\\arccos(x)", name: "Inverse cosine" },
      { latex: "\\arctan(x)", name: "Inverse tangent" }
    ],
    advanced: [
      { latex: "\\int_{0}^{\\infty}", name: "Integral" },
      { latex: "\\sum_{i=1}^{n}", name: "Summation" },
      { latex: "\\prod_{i=1}^{n}", name: "Product" },
      { latex: "\\partial", name: "Partial derivative" },
      { latex: "\\nabla", name: "Nabla" },
      { latex: "\\Delta", name: "Delta" },
      { latex: "\\alpha", name: "Alpha" },
      { latex: "\\beta", name: "Beta" },
      { latex: "\\gamma", name: "Gamma" },
      { latex: "\\delta", name: "Delta" },
      { latex: "\\epsilon", name: "Epsilon" },
      { latex: "\\theta", name: "Theta" },
      { latex: "\\lambda", name: "Lambda" },
      { latex: "\\mu", name: "Mu" },
      { latex: "\\sigma", name: "Sigma" },
      { latex: "\\phi", name: "Phi" },
      { latex: "\\omega", name: "Omega" }
    ],
    relations: [
      { latex: "\\leq", name: "Less or equal" },
      { latex: "\\geq", name: "Greater or equal" },
      { latex: "\\neq", name: "Not equal" },
      { latex: "\\approx", name: "Approximately" },
      { latex: "\\equiv", name: "Equivalent" },
      { latex: "\\in", name: "Element of" },
      { latex: "\\notin", name: "Not element of" },
      { latex: "\\cup", name: "Union" },
      { latex: "\\cap", name: "Intersection" },
      { latex: "\\subset", name: "Subset" },
      { latex: "\\supset", name: "Superset" },
      { latex: "\\subseteq", name: "Subset or equal" },
      { latex: "\\supseteq", name: "Superset or equal" },
      { latex: "\\emptyset", name: "Empty set" }
    ],
    brackets: [
      { latex: "()", name: "Parentheses" },
      { latex: "[]", name: "Square brackets" },
      { latex: "\\{\\}", name: "Curly braces" },
      { latex: "|x|", name: "Absolute value" },
      { latex: "\\lfloor x \\rfloor", name: "Floor" },
      { latex: "\\lceil x \\rceil", name: "Ceiling" },
      { latex: "\\langle x \\rangle", name: "Angle brackets" },
      { latex: "\\angle", name: "Angle symbol" },
      { latex: "\\perp", name: "Perpendicular" },
      { latex: "\\parallel", name: "Parallel" },
      { latex: "\\triangle", name: "Triangle" },
      { latex: "\\square", name: "Square" }
    ]
  };

  const allSymbols = Object.values(testSymbols).flat();

  const getSymbolsToShow = () => {
    if (selectedCategory === "all") return allSymbols;
    return testSymbols[selectedCategory as keyof typeof testSymbols] || [];
  };

  const insertSymbol = (latex: string) => {
    setTestExpression(prev => prev + latex);
  };

  const clearExpression = () => {
    setTestExpression("");
  };

  const testComplexExpression = () => {
    setTestExpression("\\sqrt{4} + \\infty - \\pm x^2 + \\sin(x) + \\int_{0}^{\\infty} e^{-x} dx = 0");
  };

  return (
    <div className="space-y-6">
      {/* Test Expression */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Math Symbol Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={testComplexExpression} variant="outline">
              Test Complex Expression
            </Button>
            <Button onClick={clearExpression} variant="outline">
              Clear
            </Button>
          </div>
          
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="text-sm text-gray-600 mb-2 font-mono">
              LaTeX: {testExpression || "Enter expression..."}
            </div>
            <div className="text-lg min-h-[40px]">
              {testExpression ? (
                <MathRenderer latex={testExpression} />
              ) : (
                <span className="text-gray-400 italic">No expression entered</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Symbol Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Symbol Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              All Symbols
            </Button>
            {Object.keys(testSymbols).map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="capitalize"
              >
                {category}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {getSymbolsToShow().map((symbol, index) => (
              <div
                key={index}
                className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => insertSymbol(symbol.latex)}
              >
                <div className="text-xs text-gray-500 mb-1 font-mono">
                  {symbol.latex}
                </div>
                <div className="text-sm font-medium mb-1">
                  {symbol.name}
                </div>
                <div className="text-lg">
                  <MathRenderer latex={symbol.latex} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Math Keyboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Math Keyboard</CardTitle>
        </CardHeader>
        <CardContent>
          <MathKeyboard
            onSymbolInsert={insertSymbol}
            onBackspace={() => setTestExpression(prev => prev.slice(0, -1))}
            onClear={clearExpression}
            onEnter={() => {}}
            isVisible={true}
            onToggle={() => {}}
          />
        </CardContent>
      </Card>
    </div>
  );
}
