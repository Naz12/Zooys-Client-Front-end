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
  BarChart3,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import BundleDisplay from './youtube/bundle-display';
import type { JobResultData, TextJobResultData, YouTubeJobResultData } from '@/lib/types/api';

interface UniversalResultDisplayProps {
  result: JobResultData;
  onRegenerate?: () => void;
  onExport?: (format: 'text' | 'pdf' | 'markdown') => void;
  onShare?: () => void;
  showMetadata?: boolean;
  showActions?: boolean;
}

export default function UniversalResultDisplay({
  result,
  onRegenerate,
  onExport,
  onShare,
  showMetadata = true,
  showActions = true
}: UniversalResultDisplayProps) {
  const [copied, setCopied] = useState(false);

  // Type guards to determine result type
  const isTextResult = (result: JobResultData): result is TextJobResultData => {
    return 'key_points' in result && 'confidence_score' in result;
  };

  const isYouTubeResult = (result: JobResultData): result is YouTubeJobResultData => {
    return 'bundle' in result || 'ai_result' in result;
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  const handleExport = (format: 'text' | 'pdf' | 'markdown') => {
    if (onExport) {
      onExport(format);
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare();
    }
  };

  const handleRegenerate = () => {
    if (onRegenerate) {
      onRegenerate();
    }
  };

  // Render text summary result
  const renderTextResult = (result: TextJobResultData) => (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Text Summary
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Brain className="h-3 w-3" />
              {result.model_used}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              {Math.round(result.confidence_score * 100)}%
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="keypoints">Key Points</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="mt-4">
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm leading-relaxed text-gray-900 dark:text-gray-100">{result.summary}</p>
              </div>
              {showActions && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(result.summary)}
                  >
                    {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied!' : 'Copy Summary'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('text')}
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="keypoints" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                {result.key_points.map((point, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 bg-muted rounded-lg">
                    <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-gray-900 dark:text-gray-100">{point}</p>
                  </div>
                ))}
              </div>
              {showActions && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(result.key_points.join('\n'))}
                  >
                    {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied!' : 'Copy Key Points'}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );

  // Render YouTube summary result
  const renderYouTubeResult = (result: YouTubeJobResultData) => (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            YouTube Summary
          </CardTitle>
          <div className="flex items-center gap-2">
            {result.metadata?.[0]?.language && (
              <Badge variant="outline">
                {(result.metadata[0].language || 'en').toUpperCase()}
              </Badge>
            )}
            {result.metadata?.[0]?.content_type && (
              <Badge variant="outline">
                {result.metadata[0].content_type || 'youtube'}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="bundle">Bundle</TabsTrigger>
            <TabsTrigger value="metadata">Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="mt-4">
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm leading-relaxed text-gray-900 dark:text-gray-100">
                  {result.summary || 'No summary available'}
                </p>
              </div>
              {showActions && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(result.summary || '')}
                  >
                    {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied!' : 'Copy Summary'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('text')}
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="bundle" className="mt-4">
            {result.bundle && result.bundle.json && (
              <BundleDisplay bundle={result.bundle} />
            )}
          </TabsContent>
          
          <TabsContent value="metadata" className="mt-4">
            <div className="space-y-4">
              {result.metadata?.[0] && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Processing Info</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>Processing Time: {result.metadata[0].processing_time || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        <span>Tokens Used: {result.metadata[0].tokens_used || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        <span>Confidence: {result.metadata[0].confidence ? Math.round(result.metadata[0].confidence * 100) + '%' : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Video Info</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>Title: {result.metadata[0].title || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4" />
                        <span>Total Words: {result.metadata[0].total_words || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );

  // Render generic result
  const renderGenericResult = (result: JobResultData) => (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Summary Result
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm leading-relaxed text-gray-900 dark:text-gray-100">
              {result.summary || 'No summary available'}
            </p>
          </div>
          {showActions && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(result.summary || '')}
              >
                {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied!' : 'Copy Summary'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('text')}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Main render logic
  if (isTextResult(result)) {
    return renderTextResult(result);
  } else if (isYouTubeResult(result)) {
    return renderYouTubeResult(result);
  } else {
    return renderGenericResult(result);
  }
}
