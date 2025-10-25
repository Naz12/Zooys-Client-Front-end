"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Copy, 
  Download, 
  ExternalLink, 
  User, 
  Calendar, 
  Clock, 
  Hash,
  FileText,
  Brain,
  BarChart3
} from 'lucide-react';
import BundleDisplay from './bundle-display';
import type { JobResultData } from '@/lib/types/api';

interface YouTubeResultDisplayProps {
  result: JobResultData;
  onRegenerate?: () => void;
  onExport?: (format: 'text' | 'pdf' | 'markdown') => void;
  onShare?: () => void;
  showMetadata?: boolean;
  showActions?: boolean;
}

export default function YouTubeResultDisplay({
  result,
  onRegenerate,
  onExport,
  onShare,
  showMetadata = true,
  showActions = true,
}: YouTubeResultDisplayProps) {
  const [activeTab, setActiveTab] = useState('summary');

  const handleCopy = (content: string, type: string) => {
    navigator.clipboard.writeText(content);
    // You could add a toast notification here
    console.log(`Copied ${type} to clipboard`);
  };

  const handleDownload = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDuration = (duration: string) => {
    // Handle various duration formats
    if (duration.includes(':')) {
      return duration;
    }
    const seconds = parseInt(duration);
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Main Result Card */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              YouTube Summary
            </CardTitle>
            <div className="flex gap-2">
              <Badge variant="secondary">{(result.metadata?.[0]?.language || 'en').toUpperCase()}</Badge>
              <Badge variant="outline">{result.metadata?.[0]?.content_type || 'youtube'}</Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              {result.bundle && <TabsTrigger value="bundle">Bundle Data</TabsTrigger>}
            </TabsList>

            <TabsContent value="summary" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">AI Summary</h3>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopy(result.summary, 'summary')}
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(result.summary, 'summary.txt', 'text/plain')}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-64 w-full rounded-md border p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-900 dark:text-gray-100">{result.summary || 'No summary available'}</p>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Video Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ExternalLink className="h-4 w-4" />
                      Video Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Channel:</span>
                      <span className="text-sm text-gray-600">{result.source_info?.author || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Published:</span>
                      <span className="text-sm text-gray-600">{result.source_info?.published_date || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Words:</span>
                      <span className="text-sm text-gray-600">{(result.source_info?.word_count || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-gray-500" />
                      <a 
                        href={result.source_info?.url || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View on YouTube
                      </a>
                    </div>
                  </CardContent>
                </Card>

                {/* Processing Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Processing Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Processing Time:</span>
                      <span className="text-sm text-gray-600">{result.metadata?.[0]?.processing_time || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Tokens Used:</span>
                      <span className="text-sm text-gray-600">{(result.metadata?.[0]?.tokens_used || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Confidence:</span>
                      <span className="text-sm text-gray-600">{((result.metadata?.[0]?.confidence || 0) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Total Words:</span>
                      <span className="text-sm text-gray-600">{(result.metadata?.[0]?.total_words || 0).toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Video Description */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Video Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-32 w-full rounded-md border p-3">
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {result.source_info?.description || 'No description available'}
                    </p>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            {result.bundle && result.bundle.json && (
              <TabsContent value="bundle" className="space-y-4">
                <BundleDisplay 
                  bundle={result.bundle} 
                  onCopy={handleCopy}
                  onDownload={handleDownload}
                />
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {showActions && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 justify-center">
              {onRegenerate && (
                <Button onClick={onRegenerate} variant="outline">
                  Regenerate Summary
                </Button>
              )}
              
              {onExport && (
                <div className="flex gap-2">
                  <Button onClick={() => onExport('text')} variant="outline" size="sm">
                    Export as Text
                  </Button>
                  <Button onClick={() => onExport('pdf')} variant="outline" size="sm">
                    Export as PDF
                  </Button>
                  <Button onClick={() => onExport('markdown')} variant="outline" size="sm">
                    Export as Markdown
                  </Button>
                </div>
              )}
              
              {onShare && (
                <Button onClick={onShare} variant="outline">
                  Share Result
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
