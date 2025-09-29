"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import SummarizerCard from "@/components/summarizer-card";
import YoutubeCard from "@/components/youtube-card";
import AiMathCard from "@/components/ai-math-card";
import PresentationCard from "@/components/presentation-card";
import FlashcardCard from "@/components/flashcard-card";
import DiagramCard from "@/components/diagram-card";
import WriterCard from "@/components/writer-card";
import AiChatCard from "@/components/ai-chat-card";

import PdfCard from "@/components/pdf-card";

import { Bell, Search, Podcast } from "lucide-react";

export default function DashboardTabs() {
  const tabs = [
    { value: "summary", label: "Summary" },
    { value: "youtube", label: "YouTube" },
    { value: "chat", label: "AI Chat" },
    { value: "presentation", label: "Presentation" },
    { value: "pdf", label: "AI PDF" },
    { value: "writer", label: "Writer" },
    { value: "math", label: "AI Math" },
    { value: "flashcards", label: "Flashcards" },
    { value: "diagram", label: "Diagram" },
  ];

  return (
    <Tabs defaultValue="summary" className="w-full">
      {/* Tab Buttons */}
      <TabsList className="flex gap-6 border-b border-border bg-transparent mb-6">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="
              relative pb-2 text-sm font-medium transition-colors
              data-[state=active]:text-indigo-400
              hover:text-indigo-300
            "
          >
            {tab.label}
            <span
              className="
                absolute left-0 -bottom-[2px] h-[3px] w-full rounded-full
                bg-gradient-to-r from-indigo-500 to-purple-500
                opacity-0 data-[state=active]:opacity-100 transition-opacity
              "
            />
          </TabsTrigger>
        ))}
      </TabsList>

      {/* Summary Tab */}
      <TabsContent value="summary">
        <div className="space-y-8">
          {/* Summarizer Card */}
          <SummarizerCard />

          {/* Continue Exploring */}
          <section>
            <h3 className="font-semibold text-indigo-400 mb-4">
              Continue Exploring
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: "My YouTube Channels", icon: <Bell size={20} /> },
                { label: "Search YouTube Videos", icon: <Search size={20} /> },
                { label: "AI Podcast Generator", icon: <Podcast size={20} /> },
              ].map((item) => (
                <div
                  key={item.label}
                  className="
                    relative flex items-center gap-3 p-4 rounded-lg
                    bg-card border border-border shadow-sm
                    overflow-hidden group cursor-pointer
                    transition-all duration-300
                  "
                >
                  {/* Gradient sweep background */}
                  <span
                    className="
                      absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500
                      opacity-0 group-hover:opacity-100
                      transition-opacity duration-300
                    "
                  />
                  <div className="relative z-10 flex items-center gap-3">
                    {item.icon}
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </TabsContent>

      {/* Other Tabs */}
      <TabsContent value="youtube">
        <div className="card-style p-6">
          <YoutubeCard />
        </div>
      </TabsContent>

      <TabsContent value="chat">
        <div className="card-style p-6">
          <AiChatCard />
        </div>
      </TabsContent>

      <TabsContent value="presentation">
        <div className="card-style p-6">
          <PresentationCard />
        </div>
      </TabsContent>

      <TabsContent value="pdf">
        <div className="card-style p-6">
          <PdfCard />
        </div>
      </TabsContent>

      <TabsContent value="writer">
        <div className="card-style p-6">
          <WriterCard />
        </div>
      </TabsContent>

      <TabsContent value="math">
        <div className="card-style p-6">
          <AiMathCard />
        </div>
      </TabsContent>

      <TabsContent value="flashcards">
        <div className="card-style p-6">
          <FlashcardCard />
        </div>
      </TabsContent>

      <TabsContent value="diagram">
        <div className="card-style p-6">
          <DiagramCard />
        </div>
      </TabsContent>
    </Tabs>
  );
}
