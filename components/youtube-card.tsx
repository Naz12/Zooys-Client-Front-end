"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Settings, Loader2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { summarizerApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useNotifications } from "@/lib/notifications";
import type { YouTubeSummarizeResponse } from "@/lib/types/api";

// helper to extract ID from a YouTube link
function extractVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1);
    }
    if (parsed.searchParams.has("v")) {
      return parsed.searchParams.get("v");
    }
    return null;
  } catch {
    return null;
  }
}

export default function YoutubeCard() {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotifications();
  
  const [linkType, setLinkType] = useState<"video" | "playlist">("video");
  const [inputLink, setInputLink] = useState("");
  const [language, setLanguage] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<YouTubeSummarizeResponse | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [videos, setVideos] = useState<{ id: string; title: string }[]>([
    { id: "jNQXAC9IVRw", title: "Me at the Zoo" },
    { id: "HhwXxjiqDEU", title: "Fear will lead you..." },
  ]);

  const handleAddVideo = () => {
    const id = extractVideoId(inputLink.trim());
    if (id && !videos.find((v) => v.id === id)) {
      setVideos([{ id, title: "New Video" }, ...videos]);
      setInputLink("");
    }
  };

  const handleSummarize = async () => {
    if (!inputLink.trim()) {
      showError("Error", "Please enter a YouTube video URL");
      return;
    }

    if (!user) {
      showError("Error", "Please log in to use this feature");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await summarizerApi.summarizeYouTube({ url: inputLink.trim(), options: { language } });
      setResult(response);
      showSuccess("Success", "Video summarized successfully!");
    } catch (error) {
      console.error("YouTube summarization error:", error);
      showError("Error", error instanceof Error ? error.message : "Failed to summarize video");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySummary = async () => {
    if (!result?.summary) return;
    
    try {
      await navigator.clipboard.writeText(result.summary);
      setCopied(true);
      showSuccess("Success", "Summary copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      showError("Error", "Failed to copy summary");
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

  return (
    <Card className="bg-card border border-border rounded-xl shadow-md">
      <CardContent className="p-6 space-y-6">
        {/* Promo banner */}
        <div className="bg-background border border-border rounded-lg p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-sm font-medium">
              🚀 <span className="font-semibold">300K+ users</span> love YouTube
              Extension —{" "}
              <span className="text-indigo-400">
                skip 1,000 copy-pastes a year
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Summarize in ⚡ 1 second without leaving YouTube, done before the
              ad ends!
            </p>
          </div>
          <Button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs">
            Add to Chrome – Free
          </Button>
        </div>

        {/* Video vs Playlist toggle + lang */}
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            className={
              linkType === "video"
                ? "bg-indigo-600 text-white"
                : "border border-border text-muted-foreground"
            }
            onClick={() => setLinkType("video")}
          >
            Video Link
          </Button>
          <Button
            size="sm"
            className={
              linkType === "playlist"
                ? "bg-indigo-600 text-white"
                : "border border-border text-muted-foreground"
            }
            onClick={() => setLinkType("playlist")}
          >
            Playlist Link
          </Button>

          <select
            className="ml-auto rounded-md border border-border bg-background px-3 py-1 text-sm"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="am">አማርኛ</option>
          </select>

          <Button variant="ghost" size="icon">
            <Settings size={18} />
          </Button>
        </div>

        {/* Input + add button */}
        <div className="flex gap-2">
          <Input
            value={inputLink}
            onChange={(e) => setInputLink(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddVideo()}
            placeholder="Enter the YouTube video link, e.g. https://youtube.com/watch?v=example"
            className="flex-1 rounded-md border border-border"
          />
          <Button
            onClick={handleAddVideo}
            variant="outline"
            className="border-dashed border-indigo-500 text-indigo-400 hover:bg-indigo-500/10"
          >
            + Add
          </Button>
        </div>

        {/* Info line */}
        <p className="text-xs text-muted-foreground">
          Tired of copying links? Subscribe to a YouTube channel instead!
        </p>

        {/* Action button */}
        <Button 
          onClick={handleSummarize}
          disabled={isLoading || !inputLink.trim()}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Summarizing...
            </>
          ) : (
            "Transcribe & Summarize Now"
          )}
        </Button>

        {/* Results Section */}
        {result && (
          <div className="space-y-4">
            {/* Video Info */}
            <div className="bg-background border border-border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">{result.video_info.title}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>📺 {result.video_info.channel}</span>
                <span>⏱️ {formatDuration(result.video_info.duration)}</span>
                <span>👀 {formatViews(result.video_info.views)} views</span>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-background border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-lg">Summary</h3>
                <Button
                  onClick={handleCopySummary}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <div className="prose prose-sm max-w-none text-muted-foreground whitespace-pre-line">
                {result.summary}
              </div>
            </div>
          </div>
        )}

        {/* Video previews */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {videos.map((video) => (
            <div
              key={video.id}
              className="rounded-lg overflow-hidden border border-border bg-card shadow-sm hover:shadow-md transition cursor-pointer"
            >
              <img
                src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
                alt={video.title}
                className="w-full aspect-video object-cover"
              />
              <div className="p-2 text-sm font-medium truncate">
                {video.title}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
