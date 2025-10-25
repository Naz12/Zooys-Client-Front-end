"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Download, FileText, Clock, Hash } from 'lucide-react';
import type { BundleData, BundleSegment } from '@/lib/types/api';

interface BundleDisplayProps {
  bundle: BundleData;
  onCopy?: (content: string, type: string) => void;
  onDownload?: (content: string, filename: string, type: string) => void;
}

export default function BundleDisplay({ bundle, onCopy, onDownload }: BundleDisplayProps) {
  const [activeTab, setActiveTab] = useState('summary');

  const formatTimestamp = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = (content: string, type: string) => {
    if (onCopy) {
      onCopy(content, type);
    } else {
      navigator.clipboard.writeText(content);
    }
  };

  const handleDownload = (content: string, filename: string, type: string) => {
    if (onDownload) {
      onDownload(content, filename, type);
    } else {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Video Bundle Data
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="secondary">{bundle.language.toUpperCase()}</Badge>
            <Badge variant="outline">{bundle.format}</Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="article">Article</TabsTrigger>
            <TabsTrigger value="segments">Segments</TabsTrigger>
            <TabsTrigger value="srt">SRT</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">AI Summary</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(bundle.summary, 'summary')}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(bundle.summary, 'summary.txt', 'text/plain')}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
            <ScrollArea className="h-64 w-full rounded-md border p-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-900 dark:text-gray-100">{bundle.summary}</p>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="article" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Full Article</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(bundle.article, 'article')}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(bundle.article, 'article.txt', 'text/plain')}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
            <ScrollArea className="h-64 w-full rounded-md border p-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-900 dark:text-gray-100">{bundle.article}</p>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="segments" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Timeline Segments</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(
                    JSON.stringify(bundle.json?.segments || [], null, 2), 
                    'segments'
                  )}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy JSON
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(
                    JSON.stringify(bundle.json?.segments || [], null, 2), 
                    'segments.json', 
                    'application/json'
                  )}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
            <ScrollArea className="h-64 w-full rounded-md border">
              <div className="p-4 space-y-3">
                {(bundle.json?.segments || []).map((segment: BundleSegment, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                    <div className="flex-shrink-0">
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatTimestamp(segment.start)}
                      </Badge>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {segment.text}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span>Duration: {segment.duration.toFixed(1)}s</span>
                        <span>•</span>
                        <span>End: {formatTimestamp(segment.start + segment.duration)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="srt" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">SRT Subtitles</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(bundle.srt, 'srt')}
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(bundle.srt, 'subtitles.srt', 'text/plain')}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
            <ScrollArea className="h-64 w-full rounded-md border p-4">
              <pre className="text-xs font-mono leading-relaxed whitespace-pre-wrap">
                {bundle.srt}
              </pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Bundle Metadata */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Hash className="h-4 w-4" />
            Bundle Metadata
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Video ID:</span>
              <span className="ml-2 text-gray-600">{bundle.video_id}</span>
            </div>
            <div>
              <span className="font-medium">Language:</span>
              <span className="ml-2 text-gray-600">{bundle.language}</span>
            </div>
            <div>
              <span className="font-medium">AI Model:</span>
              <span className="ml-2 text-gray-600">{bundle.meta.ai_model_used}</span>
            </div>
            <div>
              <span className="font-medium">Tokens Used:</span>
              <span className="ml-2 text-gray-600">{bundle.meta.ai_tokens_used.toLocaleString()}</span>
            </div>
            <div>
              <span className="font-medium">Confidence:</span>
              <span className="ml-2 text-gray-600">{(bundle.meta.ai_confidence_score * 100).toFixed(1)}%</span>
            </div>
            <div>
              <span className="font-medium">Processing Time:</span>
              <span className="ml-2 text-gray-600">{bundle.meta.processing_time}</span>
            </div>
            <div>
              <span className="font-medium">Segments:</span>
              <span className="ml-2 text-gray-600">{bundle.json?.segments?.length || 0}</span>
            </div>
            <div>
              <span className="font-medium">Merged At:</span>
              <span className="ml-2 text-gray-600">
                {new Date(bundle.meta.merged_at).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
