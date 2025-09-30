"use client";

import ThemeToggle from "./ui/theme-toggle";
import LangSwitch from "./ui/lang-switch";
import { useAuth } from "@/lib/auth-context";
import { Button } from "./ui/button";
import { LogOut, User } from "lucide-react";

export default function Topbar() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className="flex justify-between items-center p-4 border-b">
      <div className="flex items-center gap-2">
        <User className="h-5 w-5 text-muted-foreground" />
        <span className="text-sm font-medium">
          Welcome, {user?.name || 'User'}
        </span>
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
