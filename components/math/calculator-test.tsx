"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CalculatorKeyboard from "./calculator-keyboard";
import MathRenderer from "./math-renderer";

export default function CalculatorTest() {
  const [expression, setExpression] = useState("");
  const [showCalculator, setShowCalculator] = useState(true);

  const insertSymbol = (symbol: string) => {
    setExpression(prev => prev + symbol);
  };

  const handleBackspace = () => {
    setExpression(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setExpression("");
  };

  const handleEnter = () => {
    // Could evaluate expression here
    console.log("Expression:", expression);
  };

  const testExpressions = [
    "2 + 3 * 4",
    "\\sin(30) + \\cos(60)",
    "\\sqrt{16} + \\pi",
    "2^3 + 3^2",
    "\\log(100) + \\ln(e)"
  ];

  return (
    <div className="space-y-6">
      {/* Expression Display */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Calculator Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={() => setShowCalculator(!showCalculator)}
              variant="outline"
            >
              {showCalculator ? "Hide Calculator" : "Show Calculator"}
            </Button>
            <Button
              onClick={handleClear}
              variant="outline"
            >
              Clear
            </Button>
          </div>

          {/* Expression Input */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="text-sm text-gray-600 mb-2 font-mono">
              LaTeX: {expression || "Enter expression..."}
            </div>
            <div className="text-lg min-h-[40px]">
              {expression ? (
                <MathRenderer latex={expression} />
              ) : (
                <span className="text-gray-400 italic">No expression entered</span>
              )}
            </div>
          </div>

          {/* Test Expressions */}
          <div>
            <div className="text-sm font-medium mb-2">Test Expressions:</div>
            <div className="flex flex-wrap gap-2">
              {testExpressions.map((expr, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setExpression(expr)}
                >
                  {expr}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calculator Keyboard */}
      <CalculatorKeyboard
        onSymbolInsert={insertSymbol}
        onBackspace={handleBackspace}
        onClear={handleClear}
        onEnter={handleEnter}
        isVisible={showCalculator}
        onToggle={() => setShowCalculator(!showCalculator)}
      />
    </div>
  );
}
