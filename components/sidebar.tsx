"use client";

import {
  Home,
  Youtube,
  MessageSquare,
  FileText,
  PenTool,
  Calculator,
  BookOpen,
  Network,
  User,
  CreditCard,
  Brain,
  Presentation,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo } from "react";

function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/", icon: <Home size={18} /> },
    { label: "AI Summarizer", href: "/summarizer", icon: <Brain size={18} /> },
    { label: "YouTube Summarizer", href: "/youtube-summarizer", icon: <Youtube size={18} /> },
    { label: "PDF Summarizer", href: "/pdf-summarizer", icon: <FileText size={18} /> },
    { label: "AI Chat", href: "/chat", icon: <MessageSquare size={18} /> },
    { label: "AI Writer", href: "/writer", icon: <PenTool size={18} /> },
    { label: "AI Math Solver", href: "/math-solver", icon: <Calculator size={18} /> },
    { label: "AI Flashcards", href: "/flashcards", icon: <BookOpen size={18} /> },
    { label: "AI Diagrams", href: "/diagrams", icon: <Network size={18} /> },
    { label: "AI Presentation", href: "/presentation", icon: <Presentation size={18} /> },
  ];

  return (
    <aside className="bg-background border-r border-border w-64 min-h-screen p-4 flex flex-col justify-between">
      {/* Logo */}
      <div>
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent mb-8">
          Zooys
        </h1>

        {/* Navigation */}
        <nav className="space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                prefetch={true}
                className={`
                  relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                  overflow-hidden group transition-all duration-200 w-full text-left
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
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Account & Settings */}
      <div className="space-y-2 mt-6">
        <Link
          href="/profile"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
        >
          <User size={18} />
          Profile
        </Link>
        <Link
          href="/subscription"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
        >
          <CreditCard size={18} />
          Subscription
        </Link>
      </div>

      {/* Footer */}
      <div className="text-xs text-muted-foreground mt-6">© 2025 Zooys      </div>
    </aside>
  );
}

export default memo(Sidebar);
