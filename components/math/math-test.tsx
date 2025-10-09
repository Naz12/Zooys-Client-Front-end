"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MathRenderer from "./math-renderer";

export default function MathTest() {
  const [testExpressions] = useState([
    "\\pi + \\infty",
    "\\sqrt{4}",
    "\\sqrt[3]{8}",
    "\\tan(x)",
    "\\arcsin(y)",
    "x^2 + y^2 = z^2",
    "\\frac{1}{2} + \\frac{3}{4}",
    "\\int_0^\\infty e^{-x} dx",
    "\\sum_{i=1}^n i^2",
    "\\alpha + \\beta = \\gamma"
  ]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Math Rendering Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {testExpressions.map((expression, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-2 font-mono">
                LaTeX: {expression}
              </div>
              <div className="text-lg">
                Rendered: <MathRenderer latex={expression} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
