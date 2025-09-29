"use client";

import Link from "next/link";
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

export default function Sidebar() {
  const navItems = [
    { label: "Home", href: "/", icon: <Home size={18} /> },
    { label: "AI YouTube", href: "#", icon: <Youtube size={18} /> },
    { label: "AI Chat", href: "#", icon: <MessageSquare size={18} /> },
    { label: "AI PDF", href: "#", icon: <FileText size={18} /> },
    { label: "AI Presentation", href: "#", icon: <Presentation size={18} /> },
    { label: "AI Math", href: "#", icon: <Calculator size={18} /> },
    { label: "AI Flashcards", href: "#", icon: <Layers size={18} /> },
    { label: "AI Book Library", href: "#", icon: <BookOpen size={18} /> },
  ];

  return (
    <aside className="bg-background border-r border-border w-64 min-h-screen p-4 flex flex-col justify-between">
      {/* Logo */}
      <div>
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent mb-8">
          NoteGPT
        </h1>

        {/* Navigation */}
        <nav className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="
                relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                overflow-hidden group transition-all duration-300
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
              <span className="relative z-10 flex items-center gap-3">
                {item.icon}
                {item.label}
              </span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="text-xs text-muted-foreground mt-6">© 2025 NoteGPT</div>
    </aside>
  );
}
