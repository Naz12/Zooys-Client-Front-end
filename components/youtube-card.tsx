"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Settings } from "lucide-react";
import { useState } from "react";

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
  const [linkType, setLinkType] = useState<"video" | "playlist">("video");
  const [inputLink, setInputLink] = useState("");
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
            defaultValue="en"
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
        <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3">
          Transcribe & Summarize Now
        </Button>

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
