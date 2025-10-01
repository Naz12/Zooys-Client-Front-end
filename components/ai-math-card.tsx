"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";

type Example = {
  id: number;
  type: "text" | "photo" | "pdf";
  content: string;
  img?: string;
};

export default function AiMathCard() {
  const [examples] = useState<Example[]>([
    {
      id: 1,
      type: "text",
      content:
        "A right triangle has one leg that is 6 cm long and the hypotenuse is 10 cm. What is the length of the other leg?",
    },
    {
      id: 2,
      type: "photo",
      img: "/math-example1.png",
      content: "Solve for R?",
    },
    {
      id: 3,
      type: "photo",
      img: "/math-example2.png",
      content: "√x + 4 = 2024",
    },
    {
      id: 4,
      type: "pdf",
      content:
        "1. Solve for x: 2x - 4 = 10\n2. Find the area of a circle with r = 5cm\n3. Solve system of equations: y = 3x + 2, y = -x + 4",
    },
  ]);

  return (
    <Card className="bg-card border border-border rounded-2xl shadow-lg transition hover:shadow-xl">
      <CardContent className="p-8 space-y-8">
        {/* Upload + question area */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload box */}
          <div className="border-2 border-dashed border-indigo-500/50 rounded-xl p-8 text-center space-y-3 hover:border-indigo-400 transition">
            <FileText size={36} className="mx-auto text-indigo-500" />
            <p className="text-sm">
              Drag and drop an{" "}
              <span className="text-indigo-500 font-medium">Image</span> or{" "}
              <span className="text-indigo-500 font-medium">PDF</span> to solve
            </p>
            <p className="text-xs text-muted-foreground">
              Clear photos improve accuracy. Max 50MB.
            </p>

            <div className="flex justify-center gap-3 mt-4">
              <Button className="bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-full px-5">
                📂 Choose File
              </Button>
              <Button
                variant="outline"
                className="text-sm rounded-full border border-border"
              >
                📋 Paste
              </Button>
            </div>
          </div>

          {/* Question input */}
          <div className="flex flex-col gap-4">
            <select
              className="rounded-md border border-border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              defaultValue="en"
            >
              <option value="en">English</option>
              <option value="am">አማርኛ</option>
            </select>

            <textarea
              placeholder="Ask any math question or describe the uploaded file..."
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-indigo-500"
              rows={6}
            />
          </div>
        </div>

        {/* Action button */}
        <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 rounded-xl shadow-md transition">
          ✨ Get Answer
        </Button>

        {/* Extension banner */}
        <div className="bg-background border border-border rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
          <p className="text-sm font-medium text-center md:text-left">
            <span className="font-semibold text-indigo-500">
              Zooys AI Math & Homework Extension
            </span>{" "}
            – Crop & solve any question, anytime.
          </p>
          <Button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs px-4 py-2 rounded-full shadow">
            ➕ Add to Chrome – Free
          </Button>
        </div>

        {/* Examples */}
        <section>
          <h3 className="text-sm font-semibold mb-4 text-muted-foreground">
            Example Problems
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {examples.map((ex) => (
              <div
                key={ex.id}
                className="bg-background border border-border rounded-lg p-4 shadow-sm hover:shadow-md transition flex flex-col gap-2"
              >
                <span
                  className={`self-start text-xs px-2 py-0.5 rounded-full font-medium ${
                    ex.type === "text"
                      ? "bg-indigo-500 text-white"
                      : ex.type === "photo"
                      ? "bg-pink-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {ex.type.charAt(0).toUpperCase() + ex.type.slice(1)}
                </span>

                {ex.img ? (
                  <img
                    src={ex.img}
                    alt="example"
                    className="w-full aspect-video object-contain rounded-md bg-muted"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground line-clamp-4 whitespace-pre-line">
                    {ex.content}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
