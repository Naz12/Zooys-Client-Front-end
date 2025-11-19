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
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  FileUp,
  FileEdit,
  Music2,
  Link as LinkIcon,
  Type,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useState, useEffect } from "react";

function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isSummarizerExpanded, setIsSummarizerExpanded] = useState(false);

  // Mobile-first: start collapsed on mobile, expanded on desktop
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Check if current path is under /summarizer to auto-expand
  useEffect(() => {
    if (pathname.startsWith('/summarizer')) {
      setIsSummarizerExpanded(true);
    }
  }, [pathname]);

  const summarizerSubmenu = [
    { label: "YouTube", href: "/summarizer/youtube", icon: <Youtube size={16} /> },
    { label: "PDF & Documents", href: "/summarizer/pdf", icon: <FileText size={16} /> },
    { label: "Audio & Video", href: "/summarizer/audio-video", icon: <Music2 size={16} /> },
    { label: "Link", href: "/summarizer/link", icon: <LinkIcon size={16} /> },
    { label: "Long Text", href: "/summarizer/text", icon: <Type size={16} /> },
  ];

  const navItems = [
    { label: "AI Chat", href: "/chat", icon: <MessageSquare size={18} /> },
    { label: "AI Writer", href: "/writer", icon: <PenTool size={18} /> },
    { label: "AI Math Solver", href: "/math-solver", icon: <Calculator size={18} /> },
    { label: "AI Flashcards", href: "/flashcards", icon: <BookOpen size={18} /> },
    { label: "AI Diagrams", href: "/diagrams", icon: <Network size={18} /> },
    { label: "AI Presentation", href: "/presentation", icon: <Presentation size={18} /> },
    { label: "PDF Editor", href: "/pdf-editor", icon: <FileEdit size={18} /> },
    { label: "Convert File", href: "/convert-file", icon: <FileUp size={18} /> },
  ];

  return (
    <aside className={`bg-background border-r border-border min-h-screen flex flex-col justify-between transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } flex-shrink-0`}>
      {/* Header with Logo and Toggle */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-8">
          {!isCollapsed && (
            <h1 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Zooys
            </h1>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="space-y-2">
          {/* Dashboard */}
          <Link
            href="/"
            prefetch={true}
            className={`
              relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
              overflow-hidden group transition-all duration-200 w-full text-left
              ${isCollapsed ? 'justify-center' : ''}
              ${pathname === '/'
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' 
                : 'hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:opacity-80'
              }
            `}
            title={isCollapsed ? "Dashboard" : undefined}
          >
            {/* Gradient sweep background for non-active items */}
            {pathname !== '/' && (
              <span
                className="
                  absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500
                  opacity-0 group-hover:opacity-100
                  transition-opacity duration-300
                "
              />
            )}
            <span className="relative z-10 flex items-center gap-3">
              <Home size={18} />
              {!isCollapsed && "Dashboard"}
            </span>
          </Link>

          {/* AI Summarizer with Submenu */}
          <div>
            <div
              onClick={() => !isCollapsed && setIsSummarizerExpanded(!isSummarizerExpanded)}
              className={`
                relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium
                overflow-hidden group transition-all duration-200 w-full text-left cursor-pointer
                ${isCollapsed ? 'justify-center' : ''}
                ${pathname.startsWith('/summarizer')
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' 
                  : 'hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:opacity-80'
                }
              `}
              title={isCollapsed ? "AI Summarizer" : undefined}
            >
              {/* Gradient sweep background for non-active items */}
              {!pathname.startsWith('/summarizer') && (
                <span
                  className="
                    absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500
                    opacity-0 group-hover:opacity-100
                    transition-opacity duration-300
                  "
                />
              )}
              <div className="relative z-10 flex items-center gap-3 flex-1">
                <Brain size={18} />
                {!isCollapsed ? (
                  <>
                    <Link
                      href="/summarizer"
                      prefetch={true}
                      className="flex-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      AI Summarizer
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSummarizerExpanded(!isSummarizerExpanded);
                      }}
                      className="p-1 hover:bg-white/10 rounded"
                    >
                      <ChevronDown 
                        size={16} 
                        className={`transition-transform duration-200 ${isSummarizerExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>
                  </>
                ) : (
                  <Link
                    href="/summarizer"
                    prefetch={true}
                    className="flex-1"
                  >
                    <span className="sr-only">AI Summarizer</span>
                  </Link>
                )}
              </div>
            </div>
            
            {/* Submenu */}
            {!isCollapsed && isSummarizerExpanded && (
              <div className="ml-4 mt-1 space-y-1 border-l-2 border-indigo-500/20 pl-4">
                {summarizerSubmenu.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      prefetch={true}
                      className={`
                        relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm
                        overflow-hidden group transition-all duration-200 w-full text-left
                        ${isActive 
                          ? 'bg-indigo-500/20 text-indigo-400 font-medium' 
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }
                      `}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Other Navigation Items */}
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
                  ${isCollapsed ? 'justify-center' : ''}
                  ${isActive 
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' 
                    : 'hover:bg-gradient-to-r hover:from-indigo-500 hover:to-purple-500 hover:opacity-80'
                  }
                `}
                title={isCollapsed ? item.label : undefined}
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
                  {!isCollapsed && item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Account & Settings */}
      <div className="space-y-2 mt-6 px-4">
        <Link
          href="/profile"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? "Profile" : undefined}
        >
          <User size={18} />
          {!isCollapsed && "Profile"}
        </Link>
        <Link
          href="/subscription"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? "Subscription" : undefined}
        >
          <CreditCard size={18} />
          {!isCollapsed && "Subscription"}
        </Link>
      </div>

      {/* Footer */}
      {!isCollapsed && (
        <div className="text-xs text-muted-foreground mt-6 px-4">© 2025 Zooys</div>
      )}
    </aside>
  );
}

export default memo(Sidebar);
