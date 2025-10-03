"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Type, 
  FileText, 
  Clock, 
  Hash, 
  Eye, 
  Copy,
  Trash2,
  Save,
  AlertCircle,
  Check
} from "lucide-react";

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  showStats?: boolean;
  showActions?: boolean;
  autoSave?: boolean;
}

interface TextStats {
  characters: number;
  words: number;
  sentences: number;
  paragraphs: number;
  readingTime: number; // in minutes
}

export default function TextInput({
  value,
  onChange,
  placeholder = "Paste or type your text here...",
  maxLength = 10000,
  className = "",
  showStats = true,
  showActions = true,
  autoSave = true,
}: TextInputProps) {
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);

  const calculateStats = (text: string): TextStats => {
    const characters = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const sentences = text.trim() ? text.split(/[.!?]+/).filter(s => s.trim().length > 0).length : 0;
    const paragraphs = text.trim() ? text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length : 0;
    const readingTime = Math.ceil(words / 200); // Average reading speed: 200 words per minute

    return {
      characters,
      words,
      sentences,
      paragraphs,
      readingTime,
    };
  };

  const stats = calculateStats(value);

  const handleTextChange = (newValue: string) => {
    if (newValue.length <= maxLength) {
      onChange(newValue);
      setIsDirty(true);
    }
  };

  const handleSave = () => {
    // Simulate save operation
    setLastSaved(new Date());
    setIsDirty(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text");
    }
  };

  const handleClear = () => {
    onChange("");
    setIsDirty(false);
    setLastSaved(null);
  };

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && isDirty && value.trim()) {
      const timeoutId = setTimeout(() => {
        handleSave();
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [value, isDirty, autoSave]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Text Input Area */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Type size={20} className="text-indigo-500" />
            <span className="text-sm font-medium">Text Content</span>
          </div>
          {showActions && (
            <div className="flex items-center space-x-2">
              {isDirty && (
                <span className="text-xs text-orange-500 flex items-center space-x-1">
                  <AlertCircle size={12} />
                  <span>Unsaved changes</span>
                </span>
              )}
              {lastSaved && !isDirty && (
                <span className="text-xs text-green-500 flex items-center space-x-1">
                  <Check size={12} />
                  <span>Saved {formatLastSaved(lastSaved)}</span>
                </span>
              )}
            </div>
          )}
        </div>

        <div className="relative">
          <textarea
            value={value}
            onChange={(e) => handleTextChange(e.target.value)}
            placeholder={placeholder}
            className="w-full min-h-[200px] max-h-[400px] rounded-md border border-border bg-background px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            rows={8}
          />
          {value.length > maxLength * 0.9 && (
            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
              {value.length}/{maxLength}
            </div>
          )}
        </div>

        {value.length >= maxLength && (
          <div className="flex items-center space-x-2 text-red-500 text-sm">
            <AlertCircle size={16} />
            <span>Character limit reached</span>
          </div>
        )}
      </div>

      {/* Statistics */}
      {showStats && value.trim() && (
        <Card className="bg-background border border-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <FileText size={16} className="text-indigo-500" />
              <span className="text-sm font-medium">Text Statistics</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-semibold text-indigo-500">{stats.characters}</div>
                <div className="text-xs text-muted-foreground">Characters</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-indigo-500">{stats.words}</div>
                <div className="text-xs text-muted-foreground">Words</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-indigo-500">{stats.sentences}</div>
                <div className="text-xs text-muted-foreground">Sentences</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-indigo-500">{stats.paragraphs}</div>
                <div className="text-xs text-muted-foreground">Paragraphs</div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <div className="flex items-center space-x-2">
                <Clock size={14} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Reading time: ~{stats.readingTime} min
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Hash size={14} className="text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {Math.round((stats.words / stats.sentences) * 10) / 10} words/sentence
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      {showActions && (
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleSave}
            disabled={!isDirty || !value.trim()}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Save size={14} className="mr-2" />
            Save Draft
          </Button>
          <Button
            onClick={handleCopy}
            disabled={!value.trim()}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            {copied ? (
              <>
                <Check size={14} className="mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy size={14} className="mr-2" />
                Copy Text
              </>
            )}
          </Button>
          <Button
            onClick={handleClear}
            disabled={!value.trim()}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            <Trash2 size={14} className="mr-2" />
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
