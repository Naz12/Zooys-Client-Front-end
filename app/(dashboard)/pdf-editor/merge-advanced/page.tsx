"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, FileText, Trash2, Plus, Minus, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { pdfEditApi } from '@/lib/api/pdf-edit-api';
import { toast } from 'react-hot-toast';
import type { PDFDocument } from '@/lib/types/api';

interface PageRange {
  start: number;
  end: number;
}

interface FilePageSelection {
  fileId: string;
  fileName: string;
  pageRanges: PageRange[];
  isExpanded: boolean;
}

export default function AdvancedMergeWizard() {
  const router = useRouter();
  const [files, setFiles] = useState<PDFDocument[]>([]);
  const [fileSelections, setFileSelections] = useState<FilePageSelection[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeOrder, setMergeOrder] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Load files from localStorage on mount
  useEffect(() => {
    const mergeData = localStorage.getItem('pdfMergeData');
    if (mergeData) {
      try {
        const data = JSON.parse(mergeData);
        setFiles(data);
        setMergeOrder(data.map((file: PDFDocument) => file.id));
        
        // Initialize file selections with all pages selected by default
        const selections: FilePageSelection[] = data.map((file: PDFDocument) => ({
          fileId: file.id,
          fileName: file.name,
          pageRanges: [{ start: 1, end: file.pageCount }],
          isExpanded: false,
        }));
        setFileSelections(selections);
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
      setFileSelections(prevSelections => prevSelections.filter(s => s.fileId !== fileId));
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

  // Toggle file expansion
  const toggleFileExpansion = useCallback((fileId: string) => {
    setFileSelections(prev => prev.map(selection => 
      selection.fileId === fileId 
        ? { ...selection, isExpanded: !selection.isExpanded }
        : selection
    ));
  }, []);

  // Add page range
  const addPageRange = useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    setFileSelections(prev => prev.map(selection => 
      selection.fileId === fileId 
        ? { 
            ...selection, 
            pageRanges: [...selection.pageRanges, { start: 1, end: file.pageCount }]
          }
        : selection
    ));
  }, [files]);

  // Remove page range
  const removePageRange = useCallback((fileId: string, rangeIndex: number) => {
    setFileSelections(prev => prev.map(selection => 
      selection.fileId === fileId 
        ? { 
            ...selection, 
            pageRanges: selection.pageRanges.filter((_, index) => index !== rangeIndex)
          }
        : selection
    ));
  }, []);

  // Update page range
  const updatePageRange = useCallback((fileId: string, rangeIndex: number, field: 'start' | 'end', value: number) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    setFileSelections(prev => prev.map(selection => 
      selection.fileId === fileId 
        ? { 
            ...selection, 
            pageRanges: selection.pageRanges.map((range, index) => 
              index === rangeIndex 
                ? { ...range, [field]: Math.max(1, Math.min(value, file.pageCount)) }
                : range
            )
          }
        : selection
    ));
  }, [files]);

  // Select all pages for a file
  const selectAllPages = useCallback((fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    setFileSelections(prev => prev.map(selection => 
      selection.fileId === fileId 
        ? { 
            ...selection, 
            pageRanges: [{ start: 1, end: file.pageCount }]
          }
        : selection
    ));
  }, [files]);

  // Clear all page ranges for a file
  const clearAllPages = useCallback((fileId: string) => {
    setFileSelections(prev => prev.map(selection => 
      selection.fileId === fileId 
        ? { ...selection, pageRanges: [] }
        : selection
    ));
  }, []);

  // Get total selected pages
  const getTotalSelectedPages = useCallback(() => {
    return fileSelections.reduce((total, selection) => {
      return total + selection.pageRanges.reduce((sum, range) => sum + (range.end - range.start + 1), 0);
    }, 0);
  }, [fileSelections]);

  // Handle merge
  const handleMerge = useCallback(async () => {
    if (files.length < 2) {
      toast.error('Please add at least 2 files to merge');
      return;
    }

    const totalPages = getTotalSelectedPages();
    if (totalPages === 0) {
      toast.error('Please select pages to merge');
      return;
    }

    setIsMerging(true);
    try {
      // Create page selections for backend
      const pageSelections = fileSelections.map(selection => ({
        file_id: selection.fileId,
        page_ranges: selection.pageRanges
      }));

      const mergeRequest = {
        files: files.map(file => file.file),
        page_selections: pageSelections,
        merge_order: mergeOrder,
        metadata: {
          title: `Advanced Merge - ${new Date().toLocaleDateString()}`,
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
        a.download = `advanced_merge_${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success(`PDFs merged successfully! (${totalPages} pages)`);
      } else {
        throw new Error(response.message || 'Merge failed');
      }
    } catch (error) {
      console.error('Merge error:', error);
      toast.error('Failed to merge PDFs');
    } finally {
      setIsMerging(false);
    }
  }, [files, fileSelections, mergeOrder, getTotalSelectedPages]);

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

  const totalSelectedPages = getTotalSelectedPages();

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
                <h1 className="text-lg font-semibold">Advanced PDF Merge</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {files.length} files • {totalSelectedPages} pages selected
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
              >
                {showPreview ? <EyeOff size={16} /> : <Eye size={16} />}
                <span className="ml-1">{showPreview ? 'Hide' : 'Show'} Preview</span>
              </Button>
              
              <Button
                onClick={handleMerge}
                disabled={isMerging || files.length < 2 || totalSelectedPages === 0}
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
        <div className="max-w-6xl mx-auto">
          {/* Instructions */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Advanced Merge Instructions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <p>• Select specific page ranges from each PDF (not just complete files)</p>
              <p>• Use the arrow buttons to reorder files</p>
              <p>• Expand each file to configure page ranges</p>
              <p>• Supports merging ANY document type (backend converts to PDF)</p>
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
                  const selection = fileSelections.find(s => s.fileId === fileId);
                  if (!file || !selection) return null;

                  const selectedPagesCount = selection.pageRanges.reduce(
                    (sum, range) => sum + (range.end - range.start + 1), 0
                  );

                  return (
                    <Card key={fileId} className="transition-all duration-200 hover:shadow-md">
                      <CardContent className="p-4">
                        <div className="space-y-4">
                          {/* File Header */}
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
                                  <p className="text-sm text-slate-500">
                                    {formatFileSize(file.size)} • {file.pageCount} pages
                                  </p>
                                </div>
                              </div>

                              {/* Selection Summary */}
                              <Badge variant={selectedPagesCount > 0 ? "default" : "secondary"}>
                                {selectedPagesCount} of {file.pageCount} pages
                              </Badge>
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
                                ↑
                              </Button>

                              {/* Move Down */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => moveFileDown(fileId)}
                                disabled={index === files.length - 1}
                              >
                                ↓
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

                          {/* Page Range Configuration */}
                          <Collapsible open={selection.isExpanded} onOpenChange={() => toggleFileExpansion(fileId)}>
                            <CollapsibleTrigger asChild>
                              <Button variant="outline" size="sm" className="w-full">
                                {selection.isExpanded ? 'Hide' : 'Show'} Page Selection
                              </Button>
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent className="mt-4 space-y-4">
                              {/* Quick Actions */}
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => selectAllPages(fileId)}
                                >
                                  Select All Pages
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => clearAllPages(fileId)}
                                >
                                  Clear All
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addPageRange(fileId)}
                                >
                                  <Plus size={16} className="mr-1" />
                                  Add Range
                                </Button>
                              </div>

                              {/* Page Ranges */}
                              <div className="space-y-3">
                                {selection.pageRanges.map((range, rangeIndex) => (
                                  <div key={rangeIndex} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded">
                                    <Label className="text-sm font-medium">Range {rangeIndex + 1}:</Label>
                                    
                                    <div className="flex items-center gap-2">
                                      <Label htmlFor={`start-${fileId}-${rangeIndex}`} className="text-xs">From:</Label>
                                      <Input
                                        id={`start-${fileId}-${rangeIndex}`}
                                        type="number"
                                        value={range.start}
                                        onChange={(e) => updatePageRange(fileId, rangeIndex, 'start', parseInt(e.target.value) || 1)}
                                        className="w-20 h-8"
                                        min={1}
                                        max={file.pageCount}
                                      />
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                      <Label htmlFor={`end-${fileId}-${rangeIndex}`} className="text-xs">To:</Label>
                                      <Input
                                        id={`end-${fileId}-${rangeIndex}`}
                                        type="number"
                                        value={range.end}
                                        onChange={(e) => updatePageRange(fileId, rangeIndex, 'end', parseInt(e.target.value) || 1)}
                                        className="w-20 h-8"
                                        min={1}
                                        max={file.pageCount}
                                      />
                                    </div>
                                    
                                    <Badge variant="outline" className="text-xs">
                                      {range.end - range.start + 1} pages
                                    </Badge>
                                    
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => removePageRange(fileId, rangeIndex)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Minus size={16} />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Merge Summary */}
          {files.length >= 2 && totalSelectedPages > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Merge Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Total files:</span>
                    <Badge variant="secondary">{files.length}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Total pages to merge:</span>
                    <Badge variant="secondary">{totalSelectedPages}</Badge>
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
                        const selection = fileSelections.find(s => s.fileId === fileId);
                        const selectedPagesCount = selection?.pageRanges.reduce(
                          (sum, range) => sum + (range.end - range.start + 1), 0
                        ) || 0;
                        
                        return (
                          <div key={fileId} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-purple-600 dark:text-purple-400 font-medium">
                                {index + 1}.
                              </span>
                              <span>{file?.name}</span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {selectedPagesCount} pages
                            </Badge>
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


