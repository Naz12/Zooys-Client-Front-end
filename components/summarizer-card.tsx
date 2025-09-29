"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Youtube,
  FileText,
  Music2,
  Link as LinkIcon,
  Type,
  Settings,
} from "lucide-react";

export default function SummarizerCard() {
  return (
    <Card className="bg-card border border-border rounded-xl shadow-md">
      <CardContent className="p-6 space-y-4">
        {/* Content Type Row */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="bg-indigo-600 text-white hover:bg-indigo-500 flex items-center gap-2"
          >
            <Youtube size={16} /> YouTube
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <FileText size={16} /> PDF, Image & Files
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Music2 size={16} /> Audio, Video
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <LinkIcon size={16} /> Link
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Type size={16} /> Long Text
          </Button>

          {/* Language Dropdown */}
          <select
            className="ml-auto rounded-md border border-border bg-background px-3 py-1 text-sm"
            defaultValue="en"
          >
            <option value="en">English</option>
            <option value="am">አማርኛ</option>
          </select>

          {/* Settings Button */}
          <Button variant="ghost" size="icon">
            <Settings size={18} />
          </Button>
        </div>

        {/* Input field */}
        <Input
          placeholder="Enter the YouTube video link, for example: https://youtube.com/watch?v=12345"
          className="w-full rounded-md border border-indigo-600 focus:ring-2 focus:ring-indigo-500"
        />

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:opacity-90">
            Summarize Now
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-indigo-500 text-indigo-400 hover:bg-indigo-500 hover:text-white"
          >
            Batch Summarize
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
