"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  FileText, 
  Copy, 
  Download, 
  Share, 
  Check, 
  Clock, 
  Hash,
  Eye,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from "lucide-react";

export interface SummaryResult {
  id: string;
  content: string;
  contentType: "youtube" | "pdf" | "audio" | "link" | "text";
  source?: {
    title?: string;
    url?: string;
    duration?: string;
    author?: string;
    views?: string;
  };
  metadata?: {
    processingTime?: number;
    wordCount?: number;
    confidence?: number;
    language?: string;
  };
  timestamp: Date;
}

interface ResultDisplayProps {
  result: SummaryResult;
  onRegenerate?: () => void;
  onExport?: (format: "text" | "pdf" | "markdown") => void;
  onShare?: () => void;
  className?: string;
  showMetadata?: boolean;
  showActions?: boolean;
}

export default function ResultDisplay({
  result,
  onRegenerate,
  onExport,
  onShare,
  className = "",
  showMetadata = true,
  showActions = true,
}: ResultDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy result");
    }
  };

  const handleExport = async (format: "text" | "pdf" | "markdown") => {
    setIsExporting(true);
    
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let content = result.content;
      let filename = `summary-${result.id}.${format}`;
      
      if (format === "markdown") {
        content = `# Summary\n\n${result.content}`;
      }
      
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      onExport?.(format);
    } catch (err) {
      console.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  const formatDuration = (duration: string) => {
    // Convert PT11M44S format to readable format
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;
    
    const hours = match[1] ? `${match[1]}h ` : '';
    const minutes = match[2] ? `${match[2]}m ` : '';
    const seconds = match[3] ? `${match[3]}s` : '';
    
    return `${hours}${minutes}${seconds}`.trim();
  };

  const formatViews = (views: string) => {
    const num = parseInt(views);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "youtube":
        return "📺";
      case "pdf":
        return "📄";
      case "audio":
        return "🎵";
      case "link":
        return "🔗";
      case "text":
        return "📝";
      default:
        return "📄";
    }
  };

  return (
    <Card className={`bg-background border border-border ${className}`}>
      <CardContent className="p-4 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{getContentTypeIcon(result.contentType)}</div>
            <div>
              <h3 className="font-semibold text-lg">Summary Result</h3>
              <p className="text-sm text-muted-foreground">
                Generated {result.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
          {showActions && (
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleCopy}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span className="hidden sm:inline">
                  {copied ? "Copied!" : "Copy"}
                </span>
              </Button>
            </div>
          )}
        </div>

        {/* Source Information */}
        {result.source && (
          <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-2">
            <h4 className="font-medium text-sm">Source Information</h4>
            {result.source.title && (
              <p className="text-sm font-medium">{result.source.title}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              {result.source.author && (
                <span>👤 {result.source.author}</span>
              )}
              {result.source.duration && (
                <span>⏱️ {formatDuration(result.source.duration)}</span>
              )}
              {result.source.views && (
                <span>👀 {formatViews(result.source.views)} views</span>
              )}
              {result.source.url && (
                <a 
                  href={result.source.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-indigo-500 hover:underline flex items-center space-x-1"
                >
                  <span>🔗</span>
                  <span>View Source</span>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Summary Content */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-sm">Summary</h4>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Hash size={12} />
              <span>{result.content.split(' ').length} words</span>
            </div>
          </div>
          <div className="prose prose-sm max-w-none text-gray-900 dark:text-gray-100 whitespace-pre-line bg-muted/20 border border-border rounded-lg p-4">
            {result.content}
          </div>
        </div>

        {/* Enhanced Metadata */}
        {showMetadata && result.metadata && (
          <div className="bg-muted/30 border border-border rounded-lg p-4">
            <h4 className="font-medium text-sm mb-3">Processing Details</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {result.metadata.processingTime && (
                <div className="text-center">
                  <div className="text-lg font-semibold text-indigo-500">
                    {result.metadata.processingTime}s
                  </div>
                  <div className="text-xs text-muted-foreground">Processing Time</div>
                </div>
              )}
              {result.metadata.wordCount && (
                <div className="text-center">
                  <div className="text-lg font-semibold text-indigo-500">
                    {result.metadata.wordCount}
                  </div>
                  <div className="text-xs text-muted-foreground">Words</div>
                </div>
              )}
              {result.metadata.confidence && (
                <div className="text-center">
                  <div className="text-lg font-semibold text-indigo-500">
                    {Math.round(result.metadata.confidence * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Confidence</div>
                </div>
              )}
              {result.metadata.language && (
                <div className="text-center">
                  <div className="text-lg font-semibold text-indigo-500">
                    {result.metadata.language.toUpperCase()}
                  </div>
                  <div className="text-xs text-muted-foreground">Language</div>
                </div>
              )}
            </div>
            
            {/* Additional source info based on content type */}
            {result.contentType === "pdf" && result.source && (
              <div className="mt-4 pt-4 border-t border-border">
                <h5 className="font-medium text-sm mb-2">Document Information</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                  {result.source.title && (
                    <div>
                      <span className="font-medium">Title:</span> {result.source.title}
                    </div>
                  )}
                  {result.source.author && (
                    <div>
                      <span className="font-medium">Author:</span> {result.source.author}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-border">
            <Button
              onClick={() => handleExport("text")}
              disabled={isExporting}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Download size={14} className="mr-2" />
              Export as Text
            </Button>
            <Button
              onClick={() => handleExport("markdown")}
              disabled={isExporting}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <FileText size={14} className="mr-2" />
              Export as Markdown
            </Button>
            {onRegenerate && (
              <Button
                onClick={onRegenerate}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <RefreshCw size={14} className="mr-2" />
                Regenerate
              </Button>
            )}
            {onShare && (
              <Button
                onClick={onShare}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Share size={14} className="mr-2" />
                Share
              </Button>
            )}
          </div>
        )}

        {/* Status Indicators */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <CheckCircle size={12} className="text-green-500" />
              <span>Processing Complete</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock size={12} />
              <span>{result.timestamp.toLocaleString()}</span>
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Eye size={12} />
            <span>Ready to use</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
