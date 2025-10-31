"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, FileText, Scissors, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { pdfEditApi } from '@/lib/api/pdf-edit-api';
import { toast } from 'react-hot-toast';
import type { PDFDocument } from '@/lib/types/api';

export default function PDFSplitTool() {
  const router = useRouter();
  const [file, setFile] = useState<PDFDocument | null>(null);
  const [splitPoints, setSplitPoints] = useState<number[]>([]);
  const [isSplitting, setIsSplitting] = useState(false);

  // Load file from localStorage on mount
  useEffect(() => {
    const splitData = localStorage.getItem('pdfSplitData');
    if (splitData) {
      try {
        const data = JSON.parse(splitData);
        setFile(data);
      } catch (error) {
        console.error('Error loading split data:', error);
        toast.error('Failed to load split data');
        router.push('/pdf-editor');
      }
    } else {
      router.push('/pdf-editor');
    }
  }, [router]);

  // Add split point
  const addSplitPoint = useCallback((pageNumber: number) => {
    if (!file || pageNumber < 1 || pageNumber >= file.pageCount) return;
    
    setSplitPoints(prev => {
      const newPoints = [...prev, pageNumber].sort((a, b) => a - b);
      return [...new Set(newPoints)]; // Remove duplicates
    });
  }, [file]);

  // Remove split point
  const removeSplitPoint = useCallback((pageNumber: number) => {
    setSplitPoints(prev => prev.filter(point => point !== pageNumber));
  }, []);

  // Clear all split points
  const clearSplitPoints = useCallback(() => {
    setSplitPoints([]);
  }, []);

  // Generate split ranges
  const getSplitRanges = useCallback(() => {
    if (!file) return [];
    
    const ranges = [];
    let start = 1;
    
    for (const splitPoint of splitPoints) {
      ranges.push({
        start,
        end: splitPoint,
        pages: splitPoint - start + 1
      });
      start = splitPoint + 1;
    }
    
    // Add the last range
    if (start <= file.pageCount) {
      ranges.push({
        start,
        end: file.pageCount,
        pages: file.pageCount - start + 1
      });
    }
    
    return ranges;
  }, [file, splitPoints]);

  // Handle split
  const handleSplit = useCallback(async () => {
    if (!file || splitPoints.length === 0) {
      toast.error('Please select split points');
      return;
    }

    setIsSplitting(true);
    try {
      const splitRequest = {
        file: file.file,
        split_points: splitPoints,
        metadata: {
          title_prefix: file.name.replace('.pdf', ''),
          author: 'PDF Editor',
        }
      };

      const response = await pdfEditApi.splitPDF(splitRequest);
      
      if (response.success && response.zip_url) {
        // Download the ZIP file
        const blob = await pdfEditApi.downloadPDF(response.zip_url);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `split_${file.name.replace('.pdf', '')}_${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('PDF split successfully!');
      } else {
        throw new Error(response.message || 'Split failed');
      }
    } catch (error) {
      console.error('Split error:', error);
      toast.error('Failed to split PDF');
    } finally {
      setIsSplitting(false);
    }
  }, [file, splitPoints]);

  // Handle back
  const handleBack = useCallback(() => {
    localStorage.removeItem('pdfSplitData');
    router.push('/pdf-editor');
  }, [router]);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!file) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="text-red-500 mb-4">
              <FileText size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No File Loaded</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              Please go back and select a file to split
            </p>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft size={16} className="mr-2" />
              Back to Upload
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const splitRanges = getSplitRanges();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
              >
                <ArrowLeft size={16} className="mr-2" />
                Back
              </Button>
              
              <div>
                <h1 className="text-lg font-semibold">Split PDF</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {file.name} • {file.pageCount} pages
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSplit}
                disabled={isSplitting || splitPoints.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                <Scissors size={16} className="mr-2" />
                {isSplitting ? 'Splitting...' : 'Split & Download'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* File Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">File Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-red-500" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-slate-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Total pages:</span>
                <Badge variant="secondary">{file.pageCount}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Split Points Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Select Split Points</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <p>Click on page numbers to add split points. The PDF will be split after each selected page.</p>
              </div>
              
              {/* Page Grid */}
              <div className="grid grid-cols-10 gap-2">
                {Array.from({ length: file.pageCount }, (_, i) => {
                  const pageNumber = i + 1;
                  const isSplitPoint = splitPoints.includes(pageNumber);
                  
                  return (
                    <Button
                      key={pageNumber}
                      variant={isSplitPoint ? "default" : "outline"}
                      size="sm"
                      onClick={() => isSplitPoint ? removeSplitPoint(pageNumber) : addSplitPoint(pageNumber)}
                      className={`h-10 ${
                        isSplitPoint 
                          ? 'bg-green-600 hover:bg-green-700 text-white' 
                          : 'hover:bg-green-50 hover:border-green-300'
                      }`}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>
              
              {/* Split Points Summary */}
              {splitPoints.length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Split points:</span>
                    <div className="flex gap-1">
                      {splitPoints.map(point => (
                        <Badge key={point} variant="secondary" className="text-xs">
                          Page {point}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearSplitPoints}
                  >
                    <X size={16} className="mr-1" />
                    Clear All
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Split Preview */}
          {splitPoints.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Split Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Number of files:</span>
                    <Badge variant="secondary">{splitRanges.length}</Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Files to be created:</p>
                    {splitRanges.map((range, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800 rounded">
                        <div className="flex items-center gap-2">
                          <Check size={16} className="text-green-600" />
                          <span className="text-sm">
                            {file.name.replace('.pdf', '')}_part_{index + 1}.pdf
                          </span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Pages {range.start}-{range.end} ({range.pages} pages)
                        </Badge>
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    All files will be downloaded as a ZIP archive.
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <p>• Click on page numbers to mark split points</p>
              <p>• The PDF will be split after each selected page</p>
              <p>• Click again to remove a split point</p>
              <p>• All split files will be downloaded as a ZIP archive</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


