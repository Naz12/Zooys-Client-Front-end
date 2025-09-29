"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, Paperclip } from "lucide-react";

type ChatMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

export default function AiChatCard() {
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<ChatMessage[]>([
    {
      id: 1,
      role: "assistant",
      content: "👋 Welcome to DeepSeek V3! How can I help you today?",
    },
  ]);

  const handleSend = () => {
    if (!message.trim()) return;
    const newMessage: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: message,
    };
    setHistory((prev) => [...prev, newMessage]);

    setTimeout(() => {
      setHistory((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: "🤖 Got it! Let me think...",
        },
      ]);
    }, 800);

    setMessage("");
  };

  return (
    <Card className="bg-background/80 border border-border rounded-2xl shadow-xl w-full max-w-3xl mx-auto">
      <CardContent className="p-6 flex flex-col items-center space-y-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-indigo-600/20">
            <span className="text-3xl">🤖</span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            DeepSeek V3{" "}
            <span className="ml-2 rounded-md bg-indigo-600/30 px-2 py-0.5 text-xs font-medium text-indigo-300">
              Official
            </span>
          </h2>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            Your AI assistant for writing, problem-solving, analysis, and
            brainstorming. Let’s make work and learning smarter!
          </p>
        </div>

        {/* Chat Box */}
        <div className="w-full">
          <div className="flex flex-col h-96 rounded-xl border border-border bg-black/30 shadow-inner overflow-hidden">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {history.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`px-4 py-2 text-sm rounded-lg max-w-xs shadow-sm ${
                      msg.role === "user"
                        ? "bg-indigo-600 text-white rounded-br-none"
                        : "bg-zinc-800 text-zinc-100 rounded-bl-none border border-zinc-700"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div className="border-t border-border bg-zinc-900/90 p-3 flex items-center gap-3">
              <Button
                size="icon"
                variant="ghost"
                className="hover:bg-zinc-800 text-zinc-400"
                aria-label="Attach file"
              >
                <Paperclip size={16} />
              </Button>

              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-transparent text-sm text-white placeholder:text-zinc-500 outline-none"
              />

              <Button
                size="icon"
                disabled={!message.trim()}
                onClick={handleSend}
                className="bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
