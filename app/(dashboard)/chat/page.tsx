"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chatApi } from "@/lib/api";
import type { ChatRequest, ChatResponse, ChatSession } from "@/lib/types/api";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications";
import { MessageCircle, ArrowLeft, Settings, Send, Bot, User } from "lucide-react";
import Link from "next/link";
import ChatSessionSidebar from "@/components/chat/chat-session-sidebar";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!user) {
      showError("Error", "Please log in to use this feature");
      return;
    }

    if (!inputValue.trim()) {
      showError("Error", "Please enter a message");
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const messageContent = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    try {
      let response: ChatResponse;

      if (currentSession) {
        // Send message to existing session
        const sessionResponse = await chatSessionApi.sendMessage(currentSession.id, {
          content: messageContent,
          conversation_history: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        });

        response = {
          response: sessionResponse.ai_message.content,
        };
      } else {
        // Create new session and start chatting
        console.log("Creating new session with message:", messageContent);
        const createResponse = await chatSessionApi.createAndChat({
          message: messageContent,
          name: messageContent.slice(0, 50) + (messageContent.length > 50 ? "..." : ""),
        });
        console.log("Session created:", createResponse);

        const newSession = {
          id: createResponse.session_id,
          name: messageContent.length > 30 
            ? messageContent.slice(0, 30) + "..." 
            : messageContent,
          description: "",
          is_active: true,
          message_count: 1,
          last_activity: createResponse.timestamp,
          created_at: createResponse.timestamp,
          updated_at: createResponse.timestamp,
        };
        
        setCurrentSession(newSession);
        
        // Trigger sidebar refresh
        setRefreshTrigger(prev => prev + 1);
        
        // Show success notification
        showSuccess("New Chat Session", "Chat session created successfully");

        response = {
          response: createResponse.response,
        };
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Focus the input after AI response
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error("Chat error:", error);
      showError("Error", error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  const handleSessionSelect = async (session: ChatSession) => {
    setCurrentSession(session);
    try {
      const response = await chatSessionApi.getConversationHistory(session.id);
      const sessionMessages: ChatMessage[] = response.conversation.map((msg) => ({
        id: msg.id.toString(),
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at),
      }));
      setMessages(sessionMessages);
    } catch (error) {
      console.error("Failed to load session:", error);
      showError("Error", "Failed to load chat session");
    }
  };

  const handleNewSession = () => {
    setCurrentSession(null);
    setMessages([]);
    // Focus the input after a short delay to ensure it's rendered
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const handleSessionCreated = () => {
    // This will be called when a new session is created
    // The sidebar will automatically refresh its sessions list
  };

  return (
    <>

      {/* Main Content */}
      <div className="flex gap-6 h-[calc(100vh-200px)]">
          {/* Show Sidebar Button when hidden */}
          {!showSidebar && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSidebar(true)}
              className="h-8 w-8 p-0 self-start"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          )}

          {/* Chat Session Sidebar */}
          {showSidebar && (
            <ChatSessionSidebar
              currentSessionId={currentSession?.id}
              onSessionSelect={handleSessionSelect}
              onNewSession={handleNewSession}
              onToggle={() => setShowSidebar(false)}
              className="flex-shrink-0"
              refreshTrigger={refreshTrigger}
            />
          )}

        {/* Chat Container */}
        <div className="flex-1 flex flex-col">
          <Card className="bg-card border border-border rounded-xl shadow-md flex-1 flex flex-col h-full">
            <CardContent className="p-0 flex flex-col h-full">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                      <MessageCircle size={32} className="text-green-500" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Start a Conversation</h3>
                    <p className="text-muted-foreground mb-6">
                      Ask me anything! I can help with questions, explanations, and more.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                      <Button
                        variant="outline"
                        className="text-left justify-start h-auto p-3"
                        onClick={() => setInputValue("Explain quantum computing in simple terms")}
                      >
                        <div>
                          <div className="font-medium text-sm">Explain concepts</div>
                          <div className="text-xs text-muted-foreground">Ask for explanations</div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="text-left justify-start h-auto p-3"
                        onClick={() => setInputValue("Help me write a professional email")}
                      >
                        <div>
                          <div className="font-medium text-sm">Writing help</div>
                          <div className="text-xs text-muted-foreground">Get writing assistance</div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="text-left justify-start h-auto p-3"
                        onClick={() => setInputValue("What are the latest trends in AI?")}
                      >
                        <div>
                          <div className="font-medium text-sm">Current topics</div>
                          <div className="text-xs text-muted-foreground">Discuss recent trends</div>
                        </div>
                      </Button>
                      <Button
                        variant="outline"
                        className="text-left justify-start h-auto p-3"
                        onClick={() => setInputValue("Help me solve this math problem: 2x + 5 = 15")}
                      >
                        <div>
                          <div className="font-medium text-sm">Problem solving</div>
                          <div className="text-xs text-muted-foreground">Get step-by-step help</div>
                        </div>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-4 ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-card text-foreground border border-border"
                          }`}
                        >
                          <div className="flex items-start space-x-2">
                            {message.role === "assistant" && (
                              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Bot size={14} className="text-white" />
                              </div>
                            )}
                            {message.role === "user" && (
                              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <User size={14} className="text-primary" />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="whitespace-pre-wrap">{message.content}</div>
                              <div className="text-xs opacity-70 mt-2">
                                {message.timestamp.toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-lg p-4">
                          <div className="flex items-center space-x-2">
                            <Bot size={16} />
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area - Fixed at bottom */}
              <div className="border-t border-border p-4 bg-card">
                <div className="flex space-x-2">
                  <Input
                    ref={inputRef}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message here..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button
                    variant="gradient"
                    onClick={handleSendMessage}
                    disabled={isLoading || !inputValue.trim()}
                    size="sm"
                  >
                    <Send size={16} />
                  </Button>
                </div>
                <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                  <span>Press Enter to send, Shift+Enter for new line</span>
                  <span>{messages.length} messages</span>
                </div>
              </div>
              </CardContent>
            </Card>
          </div>
      </div>
    </>
  );
}
