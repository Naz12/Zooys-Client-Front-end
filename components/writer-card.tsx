"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  ExternalLink,
  FileText,
  Wand2,
  PenLine,
  Lightbulb,
  BookOpen,
  Search,
  Share2,
} from "lucide-react";

const writerTools = [
  { title: "AI Paper Writer", icon: <FileText size={18} />, hot: true },
  { title: "Paragraph Rewriter", icon: <Wand2 size={18} /> },
  { title: "AI Story Generator", icon: <BookOpen size={18} /> },
  { title: "AI Humanizer", icon: <PenLine size={18} /> },
  { title: "AI Idea Generator", icon: <Lightbulb size={18} /> },
  { title: "AI Detector", icon: <Search size={18} /> },
  { title: "AI Mind Map Generator", icon: <Share2 size={18} /> },
];

export default function WriterCard() {
  return (
    <Card className="bg-card border border-border rounded-xl shadow-md">
      <CardContent className="p-6 space-y-6">
        <h2 className="text-lg font-semibold">AI Writing Tools</h2>

        {/* Tools grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {writerTools.map((tool, idx) => (
            <div
              key={idx}
              className="relative flex items-center justify-between p-4 rounded-lg bg-background border border-border shadow-sm hover:shadow-md transition cursor-pointer group"
            >
              {/* Left side: icon + title */}
              <div className="flex items-center gap-3">
                <span className="text-indigo-400">{tool.icon}</span>
                <span className="text-sm font-medium">{tool.title}</span>
                {tool.hot && (
                  <span className="text-red-500 text-xs font-bold">🔥</span>
                )}
              </div>

              {/* External link */}
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                <ExternalLink size={14} className="text-muted-foreground" />
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
