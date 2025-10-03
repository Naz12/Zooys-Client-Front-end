"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Link as LinkIcon, 
  ExternalLink, 
  Globe, 
  AlertCircle,
  Check,
  Loader2,
  Copy,
  RefreshCw
} from "lucide-react";

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  domain?: string;
  favicon?: string;
  status: "loading" | "success" | "error";
}

interface LinkInputProps {
  value: string;
  onChange: (value: string) => void;
  onPreview?: (preview: LinkPreview) => void;
  placeholder?: string;
  className?: string;
  showPreview?: boolean;
}

export default function LinkInput({
  value,
  onChange,
  onPreview,
  placeholder = "Enter a URL to summarize",
  className = "",
  showPreview = true,
}: LinkInputProps) {
  const [preview, setPreview] = useState<LinkPreview | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const extractDomain = (url: string): string => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const fetchLinkPreview = async (url: string) => {
    if (!isValidUrl(url)) {
      setError("Please enter a valid URL");
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      // Simulate API call for link preview
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockPreview: LinkPreview = {
        url,
        title: "Sample Article Title",
        description: "This is a sample description of the article content that would be extracted from the URL.",
        domain: extractDomain(url),
        status: "success",
      };

      setPreview(mockPreview);
      onPreview?.(mockPreview);
    } catch (err) {
      setError("Failed to fetch link preview");
      setPreview({
        url,
        status: "error",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleUrlChange = (newUrl: string) => {
    onChange(newUrl);
    if (preview && preview.url !== newUrl) {
      setPreview(null);
    }
  };

  const handleValidate = () => {
    if (value.trim()) {
      fetchLinkPreview(value.trim());
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch (err) {
      console.error("Failed to copy URL");
    }
  };

  const handleRefreshPreview = () => {
    if (value.trim()) {
      fetchLinkPreview(value.trim());
    }
  };

  // Auto-validate URL when user stops typing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (value.trim() && isValidUrl(value.trim())) {
        fetchLinkPreview(value.trim());
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [value]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* URL Input */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <LinkIcon size={20} className="text-indigo-500" />
          <span className="text-sm font-medium">URL</span>
        </div>
        <div className="flex space-x-2">
          <Input
            value={value}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder={placeholder}
            className="flex-1"
            type="url"
          />
          <Button
            onClick={handleValidate}
            disabled={!value.trim() || isValidating}
            variant="outline"
            size="sm"
          >
            {isValidating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Check size={16} />
            )}
          </Button>
        </div>
        {error && (
          <div className="flex items-center space-x-2 text-red-500 text-sm">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Link Preview */}
      {showPreview && preview && (
        <Card className="bg-background border border-border">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Globe size={16} className="text-indigo-500" />
                <span className="text-sm font-medium">Link Preview</span>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshPreview}
                  disabled={isValidating}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw size={14} className={isValidating ? "animate-spin" : ""} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyUrl}
                  className="h-8 w-8 p-0"
                >
                  <Copy size={14} />
                </Button>
              </div>
            </div>

            {preview.status === "loading" && (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">Fetching link preview...</span>
              </div>
            )}

            {preview.status === "success" && (
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  {preview.image && (
                    <img
                      src={preview.image}
                      alt="Preview"
                      className="w-16 h-16 rounded object-cover flex-shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-sm line-clamp-2">
                      {preview.title || "No title available"}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {preview.description || "No description available"}
                    </p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {preview.domain}
                      </span>
                      <ExternalLink size={12} className="text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {preview.status === "error" && (
              <div className="flex items-center space-x-2 text-red-500">
                <AlertCircle size={16} />
                <span className="text-sm">Failed to fetch link preview</span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* URL Statistics */}
      {value.trim() && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-4">
            <span>Characters: {value.length}</span>
            <span>Domain: {extractDomain(value)}</span>
          </div>
          <div className="flex items-center space-x-1">
            {isValidUrl(value) ? (
              <>
                <Check size={12} className="text-green-500" />
                <span className="text-green-500">Valid URL</span>
              </>
            ) : (
              <>
                <AlertCircle size={12} className="text-red-500" />
                <span className="text-red-500">Invalid URL</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
