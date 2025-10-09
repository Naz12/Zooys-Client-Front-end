"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator, Settings } from "lucide-react";

interface CalculatorKeyboardProps {
  onSymbolInsert: (symbol: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onEnter: () => void;
  isVisible: boolean;
  onToggle: () => void;
}

export default function CalculatorKeyboard({ 
  onSymbolInsert, 
  onBackspace, 
  onClear, 
  onEnter, 
  isVisible, 
  onToggle 
}: CalculatorKeyboardProps) {
  const [mode, setMode] = useState<'standard' | 'scientific'>('standard');

  const handleSymbolClick = (symbol: string) => {
    onSymbolInsert(symbol);
  };

  if (!isVisible) {
    return (
      <Button
        onClick={onToggle}
        variant="outline"
        className="w-full flex items-center gap-2"
      >
        <Calculator size={16} />
        Show Calculator
      </Button>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {/* Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={mode === 'standard' ? 'default' : 'outline'}
            onClick={() => setMode('standard')}
            className="flex items-center gap-2"
          >
            <Calculator size={16} />
            Standard
          </Button>
          <Button
            variant={mode === 'scientific' ? 'default' : 'outline'}
            onClick={() => setMode('scientific')}
            className="flex items-center gap-2"
          >
            <Settings size={16} />
            Scientific
          </Button>
        </div>

        {mode === 'standard' ? (
          /* Standard Calculator Layout */
          <div className="grid grid-cols-4 gap-2">
            {/* Row 1 */}
            <Button
              variant="secondary"
              className="h-12 text-lg font-semibold text-gray-800 hover:bg-gray-300"
              onClick={() => onClear()}
            >
              C
            </Button>
            <Button
              variant="secondary"
              className="h-12 text-lg font-semibold text-gray-800 hover:bg-gray-300"
              onClick={() => onBackspace()}
            >
              ⌫
            </Button>
            <Button
              variant="outline"
              className="h-12 text-lg font-semibold text-gray-800 hover:bg-gray-100"
              onClick={() => handleSymbolClick('(')}
            >
              (
            </Button>
            <Button
              variant="outline"
              className="h-12 text-lg font-semibold text-gray-800 hover:bg-gray-100"
              onClick={() => handleSymbolClick(')')}
            >
              )
            </Button>

            {/* Row 2 */}
            <Button
              variant="outline"
              className="h-12 text-lg font-semibold text-gray-800 hover:bg-gray-100"
              onClick={() => handleSymbolClick('7')}
            >
              7
            </Button>
            <Button
              variant="outline"
              className="h-12 text-lg font-semibold text-gray-800 hover:bg-gray-100"
              onClick={() => handleSymbolClick('8')}
            >
              8
            </Button>
            <Button
              variant="outline"
              className="h-12 text-lg font-semibold text-gray-800 hover:bg-gray-100"
              onClick={() => handleSymbolClick('9')}
            >
              9
            </Button>
            <Button
              variant="default"
              className="h-12 text-lg font-semibold text-blue-800 bg-blue-100 hover:bg-blue-200"
              onClick={() => handleSymbolClick('/')}
            >
              ÷
            </Button>

            {/* Row 3 */}
            <Button
              variant="outline"
              className="h-12 text-lg font-semibold text-gray-800 hover:bg-gray-100"
              onClick={() => handleSymbolClick('4')}
            >
              4
            </Button>
            <Button
              variant="outline"
              className="h-12 text-lg font-semibold text-gray-800 hover:bg-gray-100"
              onClick={() => handleSymbolClick('5')}
            >
              5
            </Button>
            <Button
              variant="outline"
              className="h-12 text-lg font-semibold text-gray-800 hover:bg-gray-100"
              onClick={() => handleSymbolClick('6')}
            >
              6
            </Button>
            <Button
              variant="default"
              className="h-12 text-lg font-semibold text-blue-800 bg-blue-100 hover:bg-blue-200"
              onClick={() => handleSymbolClick('*')}
            >
              ×
            </Button>

            {/* Row 4 */}
            <Button
              variant="outline"
              className="h-12 text-lg font-semibold text-gray-800 hover:bg-gray-100"
              onClick={() => handleSymbolClick('1')}
            >
              1
            </Button>
            <Button
              variant="outline"
              className="h-12 text-lg font-semibold text-gray-800 hover:bg-gray-100"
              onClick={() => handleSymbolClick('2')}
            >
              2
            </Button>
            <Button
              variant="outline"
              className="h-12 text-lg font-semibold text-gray-800 hover:bg-gray-100"
              onClick={() => handleSymbolClick('3')}
            >
              3
            </Button>
            <Button
              variant="default"
              className="h-12 text-lg font-semibold text-blue-800 bg-blue-100 hover:bg-blue-200"
              onClick={() => handleSymbolClick('-')}
            >
              −
            </Button>

            {/* Row 5 */}
            <Button
              variant="outline"
              className="h-12 text-lg font-semibold text-gray-800 hover:bg-gray-100"
              onClick={() => handleSymbolClick('0')}
            >
              0
            </Button>
            <Button
              variant="outline"
              className="h-12 text-lg font-semibold text-gray-800 hover:bg-gray-100"
              onClick={() => handleSymbolClick('.')}
            >
              .
            </Button>
            <Button
              variant="default"
              className="h-12 text-lg font-semibold text-blue-800 bg-blue-100 hover:bg-blue-200"
              onClick={() => handleSymbolClick('+')}
            >
              +
            </Button>
            <Button
              variant="default"
              className="h-12 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700"
              onClick={() => handleSymbolClick('=')}
            >
              =
            </Button>
          </div>
        ) : (
          /* Scientific Calculator Layout */
          <div className="space-y-2">
            {/* Function Row 1 */}
            <div className="grid grid-cols-5 gap-1">
              <Button
                variant="secondary"
                size="sm"
                className="h-10 text-sm text-gray-800 hover:bg-gray-300"
                onClick={() => onClear()}
              >
                C
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="h-10 text-sm text-gray-800 hover:bg-gray-300"
                onClick={() => onBackspace()}
              >
                ⌫
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10 text-sm text-gray-800 hover:bg-gray-100"
                onClick={() => handleSymbolClick('(')}
              >
                (
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10 text-sm text-gray-800 hover:bg-gray-100"
                onClick={() => handleSymbolClick(')')}
              >
                )
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10 text-sm text-gray-800 hover:bg-gray-100"
                onClick={() => handleSymbolClick('^')}
              >
                x^y
              </Button>
            </div>

            {/* Function Row 2 */}
            <div className="grid grid-cols-5 gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-10 text-sm text-gray-800 hover:bg-gray-100"
                onClick={() => handleSymbolClick('\\sin(')}
              >
                sin
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10 text-sm text-gray-800 hover:bg-gray-100"
                onClick={() => handleSymbolClick('\\cos(')}
              >
                cos
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10 text-sm text-gray-800 hover:bg-gray-100"
                onClick={() => handleSymbolClick('\\tan(')}
              >
                tan
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10 text-sm text-gray-800 hover:bg-gray-100"
                onClick={() => handleSymbolClick('\\log(')}
              >
                log
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10 text-sm text-gray-800 hover:bg-gray-100"
                onClick={() => handleSymbolClick('\\ln(')}
              >
                ln
              </Button>
            </div>

            {/* Function Row 3 */}
            <div className="grid grid-cols-5 gap-1">
              <Button
                variant="outline"
                size="sm"
                className="h-10 text-sm text-gray-800 hover:bg-gray-100"
                onClick={() => handleSymbolClick('\\sqrt{')}
              >
                √
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10 text-sm text-gray-800 hover:bg-gray-100"
                onClick={() => handleSymbolClick('\\pi')}
              >
                π
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10 text-sm text-gray-800 hover:bg-gray-100"
                onClick={() => handleSymbolClick('e')}
              >
                e
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10 text-sm text-gray-800 hover:bg-gray-100"
                onClick={() => handleSymbolClick('\\infty')}
              >
                ∞
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10 text-sm text-gray-800 hover:bg-gray-100"
                onClick={() => handleSymbolClick('!')}
              >
                n!
              </Button>
            </div>

            {/* Number Pad */}
            <div className="grid grid-cols-4 gap-2">
              {/* Row 1 */}
              <Button
                variant="outline"
                className="h-12 text-lg font-semibold text-gray-800 hover:bg-gray-100"
                onClick={() => handleSymbolClick('7')}
              >
                7
              </Button>
              <Button
                variant="outline"
                className="h-12 text-lg font-semibold text-gray-800 hover:bg-gray-100"
                onClick={() => handleSymbolClick('8')}
              >
                8
              </Button>
              <Button
                variant="outline"
                className="h-12 text-lg font-semibold text-gray-800 hover:bg-gray-100"
                onClick={() => handleSymbolClick('9')}
              >
                9
              </Button>
              <Button
                variant="default"
                className="h-12 text-lg font-semibold text-blue-800 bg-blue-100 hover:bg-blue-200"
                onClick={() => handleSymbolClick('/')}
              >
                ÷
              </Button>

              {/* Row 2 */}
              <Button
                variant="outline"
                className="h-12 text-lg font-semibold text-gray-800 hover:bg-gray-100"
                onClick={() => handleSymbolClick('4')}
              >
                4
              </Button>
              <Button
                variant="outline"
                className="h-12 text-lg font-semibold text-gray-800 hover:bg-gray-100"
                onClick={() => handleSymbolClick('5')}
              >
                5
              </Button>
              <Button
                variant="outline"
                className="h-12 text-lg font-semibold text-gray-800 hover:bg-gray-100"
                onClick={() => handleSymbolClick('6')}
              >
                6
              </Button>
              <Button
                variant="default"
                className="h-12 text-lg font-semibold text-blue-800 bg-blue-100 hover:bg-blue-200"
                onClick={() => handleSymbolClick('*')}
              >
                ×
              </Button>

              {/* Row 3 */}
              <Button
                variant="outline"
                className="h-12 text-lg font-semibold text-gray-800 hover:bg-gray-100"
                onClick={() => handleSymbolClick('1')}
              >
                1
              </Button>
              <Button
                variant="outline"
                className="h-12 text-lg font-semibold text-gray-800 hover:bg-gray-100"
                onClick={() => handleSymbolClick('2')}
              >
                2
              </Button>
              <Button
                variant="outline"
                className="h-12 text-lg font-semibold text-gray-800 hover:bg-gray-100"
                onClick={() => handleSymbolClick('3')}
              >
                3
              </Button>
              <Button
                variant="default"
                className="h-12 text-lg font-semibold text-blue-800 bg-blue-100 hover:bg-blue-200"
                onClick={() => handleSymbolClick('-')}
              >
                −
              </Button>

              {/* Row 4 */}
              <Button
                variant="outline"
                className="h-12 text-lg font-semibold text-gray-800 hover:bg-gray-100"
                onClick={() => handleSymbolClick('0')}
              >
                0
              </Button>
              <Button
                variant="outline"
                className="h-12 text-lg font-semibold text-gray-800 hover:bg-gray-100"
                onClick={() => handleSymbolClick('.')}
              >
                .
              </Button>
              <Button
                variant="default"
                className="h-12 text-lg font-semibold text-blue-800 bg-blue-100 hover:bg-blue-200"
                onClick={() => handleSymbolClick('+')}
              >
                +
              </Button>
              <Button
                variant="default"
                className="h-12 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700"
                onClick={() => handleSymbolClick('=')}
              >
                =
              </Button>
            </div>
          </div>
        )}

        {/* Hide Button */}
        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            onClick={onToggle}
            className="flex items-center gap-2"
          >
            <Calculator size={16} />
            Hide Calculator
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
