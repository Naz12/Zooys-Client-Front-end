"use client";

import {
  Home,
  Youtube,
  MessageSquare,
  FileText,
  Presentation,
  Calculator,
  Layers,
  BookOpen,
} from "lucide-react";
import { useTabState, type TabValue } from "@/lib/tab-context";

export default function Sidebar() {
  const { activeTab, setActiveTab } = useTabState();

  const navItems = [
    { label: "Home", tab: "summary" as TabValue, icon: <Home size={18} /> },
    { label: "AI YouTube", tab: "youtube" as TabValue, icon: <Youtube size={18} /> },
    { label: "AI Chat", tab: "chat" as TabValue, icon: <MessageSquare size={18} /> },
    { label: "AI PDF", tab: "pdf" as TabValue, icon: <FileText size={18} /> },
    { label: "AI Presentation", tab: "presentation" as TabValue, icon: <Presentation size={18} /> },
    { label: "AI Math", tab: "math" as TabValue, icon: <Calculator size={18} /> },
    { label: "AI Flashcards", tab: "flashcards" as TabValue, icon: <Layers size={18} /> },
    { label: "AI Book Library", tab: "diagram" as TabValue, icon: <BookOpen size={18} /> },
  ];

  const handleTabClick = (tab: TabValue) => {
    setActiveTab(tab);
  };

  return (
    <aside className="bg-background border-r border-border w-64 min-h-screen p-4 flex flex-col justify-between">
      {/* Logo */}
      <div>
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent mb-8">
          NoteGPT
        </h1>

        {/* Navigation */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = activeTab === item.tab;
            return (
              <button
                key={item.label}
                onClick={() => handleTabClick(item.tab)}
                className={`
                  relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                  overflow-hidden group transition-all duration-300 w-full text-left
                  ${isActive 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' 
                    : 'hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:opacity-80'
                  }
                `}
              >
                {/* Gradient sweep background for non-active items */}
                {!isActive && (
                  <span
                    className="
                      absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500
                      opacity-0 group-hover:opacity-100
                      transition-opacity duration-300
                    "
                  />
                )}
                <span className="relative z-10 flex items-center gap-3">
                  {item.icon}
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="text-xs text-muted-foreground mt-6">© 2025 NoteGPT</div>
    </aside>
  );
}
