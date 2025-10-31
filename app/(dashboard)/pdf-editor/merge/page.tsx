"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowUp, ArrowDown, Download, FileText, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { pdfEditApi } from '@/lib/api/pdf-edit-api';
import { toast } from 'react-hot-toast';
import type { PDFDocument } from '@/lib/types/api';

export default function PDFMergeWizard() {
  const router = useRouter();
  const [files, setFiles] = useState<PDFDocument[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeOrder, setMergeOrder] = useState<string[]>([]);

  // Load files from localStorage on mount
  useEffect(() => {
    const mergeData = localStorage.getItem('pdfMergeData');
    if (mergeData) {
      try {
        const data = JSON.parse(mergeData);
        setFiles(data);
        setMergeOrder(data.map((file: PDFDocument) => file.id));
      } catch (error) {
        console.error('Error loading merge data:', error);
        toast.error('Failed to load merge data');
        router.push('/pdf-editor');
      }
    } else {
      router.push('/pdf-editor');
    }
  }, [router]);

  // Remove file from merge
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => {
      const updated = prev.filter(f => f.id !== fileId);
      setMergeOrder(prevOrder => prevOrder.filter(id => id !== fileId));
      return updated;
    });
  }, []);

  // Move file up in order
  const moveFileUp = useCallback((fileId: string) => {
    setMergeOrder(prevOrder => {
      const index = prevOrder.indexOf(fileId);
      if (index > 0) {
        const newOrder = [...prevOrder];
        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
        return newOrder;
      }
      return prevOrder;
    });
  }, []);

  // Move file down in order
  const moveFileDown = useCallback((fileId: string) => {
    setMergeOrder(prevOrder => {
      const index = prevOrder.indexOf(fileId);
      if (index < prevOrder.length - 1) {
        const newOrder = [...prevOrder];
        [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
        return newOrder;
      }
      return prevOrder;
    });
  }, []);

  // Handle merge
  const handleMerge = useCallback(async () => {
    if (files.length < 2) {
      toast.error('Please add at least 2 files to merge');
      return;
    }

    setIsMerging(true);
    try {
      // Create merge request
      const mergeRequest = {
        files: files.map(file => file.file),
        merge_order: mergeOrder,
        metadata: {
          title: `Merged Document - ${new Date().toLocaleDateString()}`,
          author: 'PDF Editor',
        }
      };

      const response = await pdfEditApi.mergePDFs(mergeRequest);
      
      if (response.success && response.download_url) {
        // Download the merged PDF
        const blob = await pdfEditApi.downloadPDF(response.download_url);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `merged_document_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('PDFs merged successfully!');
      } else {
        throw new Error(response.message || 'Merge failed');
      }
    } catch (error) {
      console.error('Merge error:', error);
      toast.error('Failed to merge PDFs');
    } finally {
      setIsMerging(false);
    }
  }, [files, mergeOrder]);

  // Handle back
  const handleBack = useCallback(() => {
    localStorage.removeItem('pdfMergeData');
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
                <h1 className="text-lg font-semibold">Merge PDFs</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {files.length} files • Drag to reorder
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handleMerge}
                disabled={isMerging || files.length < 2}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Download size={16} className="mr-2" />
                {isMerging ? 'Merging...' : 'Merge & Download'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Instructions */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Merge Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <p>• Files will be merged in the order shown below</p>
              <p>• Use the arrow buttons to reorder files</p>
              <p>• Remove files you don't want to include</p>
              <p>• Click "Merge & Download" to create the combined PDF</p>
            </CardContent>
          </Card>

          {/* Files List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Files to Merge ({files.length})</h2>
            
            {files.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText size={48} className="mx-auto text-slate-400 mb-4" />
                  <p className="text-slate-600 dark:text-slate-400">No files to merge</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {mergeOrder.map((fileId, index) => {
                  const file = files.find(f => f.id === fileId);
                  if (!file) return null;

                  return (
                    <Card key={fileId} className="transition-all duration-200 hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {/* Order Number */}
                            <div className="flex-shrink-0 w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                                {index + 1}
                              </span>
                            </div>

                            {/* File Info */}
                            <div className="flex items-center gap-3">
                              <FileText size={20} className="text-red-500" />
                              <div>
                                <p className="font-medium">{file.name}</p>
                                <p className="text-sm text-slate-500">{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                          </div>

                          {/* Controls */}
                          <div className="flex items-center gap-2">
                            {/* Move Up */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moveFileUp(fileId)}
                              disabled={index === 0}
                            >
                              <ArrowUp size={16} />
                            </Button>

                            {/* Move Down */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => moveFileDown(fileId)}
                              disabled={index === files.length - 1}
                            >
                              <ArrowDown size={16} />
                            </Button>

                            {/* Remove */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeFile(fileId)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Merge Preview */}
          {files.length >= 2 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Merge Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Total files:</span>
                    <Badge variant="secondary">{files.length}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Total size:</span>
                    <Badge variant="secondary">
                      {formatFileSize(files.reduce((sum, file) => sum + file.size, 0))}
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div className="text-sm">
                    <p className="font-medium mb-2">Merge order:</p>
                    <div className="space-y-1">
                      {mergeOrder.map((fileId, index) => {
                        const file = files.find(f => f.id === fileId);
                        return (
                          <div key={fileId} className="flex items-center gap-2">
                            <span className="text-purple-600 dark:text-purple-400 font-medium">
                              {index + 1}.
                            </span>
                            <span>{file?.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}


