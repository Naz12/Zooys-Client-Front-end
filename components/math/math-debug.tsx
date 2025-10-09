"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MathRenderer from "./math-renderer";

export default function MathDebug() {
  const [testInput, setTestInput] = useState("\\sqrt{4} + \\infty - \\pm x^2 = 0");

  const testExpressions = [
    "\\pi",
    "\\sqrt{4}",
    "\\sqrt[3]{8}",
    "\\tan",
    "\\arcsin",
    "x^2",
    "\\frac{1}{2}",
    "\\infty",
    "\\pm"
  ];

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Math Rendering Debug</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Test Input */}
        <div>
          <label className="block text-sm font-medium mb-2">Test Expression:</label>
          <Input
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Enter LaTeX expression..."
            className="mb-2"
          />
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="text-sm text-gray-600 mb-2 font-mono">
              Input: {testInput}
            </div>
            <div className="text-lg">
              <MathRenderer latex={testInput} />
            </div>
          </div>
        </div>

        {/* Individual Symbol Tests */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Individual Symbol Tests:</h3>
          <div className="grid grid-cols-2 gap-4">
            {testExpressions.map((expression, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="text-xs text-gray-500 mb-1 font-mono">
                  {expression}
                </div>
                <div className="text-lg">
                  <MathRenderer latex={expression} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Raw HTML Output */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Raw HTML Output:</h3>
          <div className="border rounded-lg p-4 bg-gray-100 font-mono text-sm">
            <pre>{JSON.stringify(testInput, null, 2)}</pre>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
