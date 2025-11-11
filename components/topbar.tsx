"use client";

import ThemeToggle from "./ui/theme-toggle";
import LangSwitch from "./ui/lang-switch";
import { useAuth } from "@/lib/auth-context";
import { Button } from "./ui/button";
import { LogOut, Home, MessageCircle, PenTool, Calculator, BookOpen, FileText, Brain, Zap, Presentation, User, CreditCard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo } from "react";

function Topbar() {
  const { logout } = useAuth();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await logout();
      // The logout function will handle the redirect
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, we should still clear local state
      // The logout function handles this in the finally block
      // Force redirect even if there was an error
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  // Define breadcrumb mapping
  const getBreadcrumb = () => {
    const breadcrumbs = {
      '/': { icon: Home, label: 'Dashboard' },
      '/chat': { icon: MessageCircle, label: 'AI Chat Assistant' },
      '/writer': { icon: PenTool, label: 'AI Writer Assistant' },
      '/math-solver': { icon: Calculator, label: 'AI Math Solver' },
      '/flashcards': { icon: BookOpen, label: 'AI Flashcard Creator' },
      '/diagrams': { icon: FileText, label: 'AI Diagram Generator' },
      '/presentation': { icon: Presentation, label: 'AI Presentation' },
      '/summarizer': { icon: Brain, label: 'AI Summarizer' },
      '/profile': { icon: User, label: 'Profile Settings' },
      '/subscription': { icon: CreditCard, label: 'Subscription Management' },
    };

    return breadcrumbs[pathname as keyof typeof breadcrumbs] || { icon: Home, label: 'Dashboard' };
  };

  const currentBreadcrumb = getBreadcrumb();
  const Icon = currentBreadcrumb.icon;

  return (
    <header className="flex justify-between items-center p-4 border-b">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span>/</span>
        <span className="text-foreground font-medium">{currentBreadcrumb.label}</span>
      </div>
      
      <div className="flex items-center gap-4">
        <LangSwitch />
        <ThemeToggle />
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </header>
  );
}

export default memo(Topbar);
