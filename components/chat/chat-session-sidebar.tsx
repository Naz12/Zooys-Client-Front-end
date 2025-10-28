"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  MessageCircle, 
  Edit3, 
  Trash2, 
  Share2, 
  MoreHorizontal,
  Check,
  X
} from "lucide-react";
import { chatApi } from "@/lib/api";
import type { ChatSession } from "@/lib/types/api";
import { useNotifications } from "@/lib/notifications";

interface ChatSessionSidebarProps {
  currentSessionId?: number;
  onSessionSelect: (session: ChatSession) => void;
  onNewSession: () => void;
  onToggle?: () => void;
  className?: string;
  refreshTrigger?: number; // Add this to trigger refresh
}

export default function ChatSessionSidebar({
  currentSessionId,
  onSessionSelect,
  onNewSession,
  onToggle,
  className = "",
  refreshTrigger
}: ChatSessionSidebarProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSession, setEditingSession] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [showActions, setShowActions] = useState<number | null>(null);
  const [hoveredSession, setHoveredSession] = useState<number | null>(null);
  const { showSuccess, showError } = useNotifications();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      // Don't close if clicking on the three-dot button or dropdown menu
      if (target.closest('[data-dropdown-menu]') || target.closest('[data-three-dot-button]')) {
        return;
      }
      
      if (showActions !== null) {
        setShowActions(null);
      }
    };

    if (showActions !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActions]);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
  }, []);

  // Refresh sessions when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger) {
      loadSessions();
    }
  }, [refreshTrigger]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await chatSessionApi.getSessions();
      setSessions(response.sessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      showError("Failed to load chat sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleSessionSelect = (session: ChatSession) => {
    onSessionSelect(session);
  };

  const handleNewSession = () => {
    onNewSession();
  };

  const handleEditStart = (session: ChatSession) => {
    setEditingSession(session.id);
    setEditName(session.name);
    setShowActions(null);
  };

  const handleEditSave = async (sessionId: number) => {
    try {
      await chatSessionApi.updateSession(sessionId, { name: editName });
      setSessions(sessions.map(s => 
        s.id === sessionId ? { ...s, name: editName } : s
      ));
      setEditingSession(null);
      showSuccess("Session renamed successfully");
    } catch (error) {
      console.error('Failed to update session:', error);
      showError("Failed to rename session");
    }
  };

  const handleEditCancel = () => {
    setEditingSession(null);
    setEditName("");
  };

  const handleDelete = async (sessionId: number) => {
    if (!confirm("Are you sure you want to delete this chat session? This action cannot be undone.")) {
      return;
    }

    try {
      await chatSessionApi.deleteSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
      showSuccess("Session deleted successfully");
    } catch (error) {
      console.error('Failed to delete session:', error);
      showError("Failed to delete session");
    }
  };

  const handleShare = async (session: ChatSession) => {
    try {
      // Create shareable link (you can implement this based on your needs)
      const shareUrl = `${window.location.origin}/chat?session=${session.id}`;
      await navigator.clipboard.writeText(shareUrl);
      showSuccess("Session link copied to clipboard");
    } catch (error) {
      console.error('Failed to share session:', error);
      showError("Failed to copy session link");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Unknown';
      }
      
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 1) {
        return 'Just now';
      } else if (diffInHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (diffInHours < 168) { // 7 days
        return date.toLocaleDateString([], { weekday: 'short' });
      } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className={`w-64 bg-muted/20 border-r border-border flex flex-col ${className}`}>
        <div className="p-4 border-b border-border">
          <div className="h-8 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex-1 p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-64 bg-muted/20 border-r border-border flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-border space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-white">Chat Sessions</h3>
          {onToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button 
          onClick={handleNewSession}
          className="w-full justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Sessions List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sessions.length === 0 ? (
          <div className="p-4 text-center text-white text-sm">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No chat sessions yet.</p>
            <p className="text-xs mt-1">Start a new conversation!</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div 
              key={session.id}
              className={`group cursor-pointer transition-all duration-200 rounded-lg ${
                currentSessionId === session.id 
                  ? 'bg-primary/15 border-l-4 border-l-primary' 
                  : 'hover:bg-muted/20'
              }`}
              onMouseEnter={() => setHoveredSession(session.id)}
              onMouseLeave={() => setHoveredSession(null)}
            >
              <div 
                className="flex items-center gap-3 px-4 py-3"
                  onClick={() => {
                    handleSessionSelect(session);
                    setShowActions(null); // Close dropdown when selecting session
                  }}
                >
                  <MessageCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    {editingSession === session.id ? (
                      <div className="flex items-center gap-1">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="h-6 text-xs"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditSave(session.id);
                            if (e.key === 'Escape') handleEditCancel();
                          }}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => handleEditSave(session.id)}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={handleEditCancel}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col w-full">
                        <h3 className={`text-sm truncate ${
                          currentSessionId === session.id 
                            ? 'text-white font-semibold' 
                            : 'text-white/90 font-medium'
                        }`}>
                          {session.name}
                        </h3>
                      </div>
                    )}
                  </div>

                  {/* Three-dot menu */}
                  {editingSession !== session.id && (
                    <div className="relative ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`h-6 w-6 p-0 transition-opacity ${
                          hoveredSession === session.id || showActions === session.id 
                            ? 'opacity-100' 
                            : 'opacity-0'
                        }`}
                        data-three-dot-button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowActions(session.id === showActions ? null : session.id);
                        }}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      
                      {/* Dropdown menu */}
                      {showActions === session.id && (
                        <div className="absolute right-0 top-6 z-10 bg-card border border-border rounded-md shadow-lg min-w-[120px]" data-dropdown-menu>
                        <div className="py-1">
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditStart(session);
                              setShowActions(null);
                            }}
                          >
                            <Edit3 className="h-3 w-3" />
                            Rename
                          </button>
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShare(session);
                              setShowActions(null);
                            }}
                          >
                            <Share2 className="h-3 w-3" />
                            Share
                          </button>
                          <button
                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(session.id);
                              setShowActions(null);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
          ))
        )}
      </div>
    </div>
  );
}
