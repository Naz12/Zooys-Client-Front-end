"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { usePDFEditor } from '@/lib/hooks/use-pdf-editor';
import { PDFThumbnailGrid } from '@/components/pdf/pdf-thumbnail-grid';
import { PDFCanvas } from '@/components/pdf/pdf-canvas';
import { PageTools } from '@/components/pdf/page-tools';
import { toast } from 'react-hot-toast';

export default function PDFEditorInterface() {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showThumbnails, setShowThumbnails] = useState(false);
  const [showTools, setShowTools] = useState(false);
  
  const {
    document,
    pages,
    selectedPages,
    currentPage,
    zoom,
    modifications,
    isLoading,
    error,
    loadPDF,
    selectPage,
    selectAllPages,
    deselectAllPages,
    togglePageSelection,
    deleteSelectedPages,
    rotateSelectedPages,
    duplicateSelectedPages,
    reorderPages,
    setCurrentPage,
    setZoom,
    undo,
    redo,
    exportPDF,
    reset,
  } = usePDFEditor();

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load PDF from localStorage on mount
  useEffect(() => {
    const pdfData = localStorage.getItem('pdfEditorData');
    if (pdfData) {
      try {
        const data = JSON.parse(pdfData);
        if (data.file) {
          loadPDF(data.file);
        }
      } catch (error) {
        console.error('Error loading PDF data:', error);
        toast.error('Failed to load PDF data');
        router.push('/pdf-editor');
      }
    } else {
      router.push('/pdf-editor');
    }
  }, [loadPDF, router]);

  // Handle export
  const handleExport = useCallback(async () => {
    try {
      const blob = await exportPDF();
      if (blob) {
        // Create download link
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = document?.name ? `edited_${document.name}` : 'edited_document.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success('PDF downloaded successfully');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export PDF');
    }
  }, [exportPDF, document]);

  // Handle back to upload
  const handleBack = useCallback(() => {
    localStorage.removeItem('pdfEditorData');
    reset();
    router.push('/pdf-editor');
  }, [reset, router]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;

      switch (event.key) {
        case 'Delete':
          if (selectedPages.size > 0) {
            event.preventDefault();
            deleteSelectedPages();
          }
          break;
        case 'a':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            selectAllPages();
          }
          break;
        case 'z':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            if (event.shiftKey) {
              redo();
            } else {
              undo();
            }
          }
          break;
        case 'y':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            redo();
          }
          break;
        case 's':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleExport();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedPages.size, deleteSelectedPages, selectAllPages, undo, redo, handleExport]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <div className="p-8 text-center">
            <div className="text-red-500 mb-4">
              <Download size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Error Loading PDF</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-4">{error}</p>
            <Button onClick={handleBack} variant="outline">
              <ArrowLeft size={16} className="mr-2" />
              Back to Upload
            </Button>
          </div>
        </Card>
      </div>
    );
  }

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
                <h1 className="text-lg font-semibold">
                  {document?.name || 'PDF Editor'}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {pages.length} pages • {modifications.length} modifications
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handleExport}
                disabled={isLoading || pages.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Download size={16} className="mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Desktop Layout */}
        {!isMobile ? (
          <>
            {/* Sidebar - Thumbnails */}
            <div className={`bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 transition-all duration-300 ${
              isCollapsed ? 'w-0 overflow-hidden' : 'w-80'
            }`}>
              <div className="p-4 h-full overflow-y-auto">
                <PDFThumbnailGrid
                  pages={pages}
                  selectedPages={selectedPages}
                  currentPage={currentPage}
                  onPageSelect={selectPage}
                  onPageToggle={togglePageSelection}
                  onSelectAll={selectAllPages}
                  onDeselectAll={deselectAllPages}
                  onReorder={reorderPages}
                  onPageClick={setCurrentPage}
                  isLoading={isLoading}
                />
              </div>
            </div>

            {/* Collapse Button */}
            <div className="flex items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="rounded-l-none border-l-0"
              >
                {isCollapsed ? '→' : '←'}
              </Button>
            </div>

            {/* Main Editor Area */}
            <div className="flex-1 flex">
              {/* PDF Canvas */}
              <div className="flex-1">
                <PDFCanvas
                  documentUrl={document?.url}
                  pages={pages}
                  currentPage={currentPage}
                  zoom={zoom}
                  onPageChange={setCurrentPage}
                  onZoomChange={setZoom}
                  isLoading={isLoading}
                />
              </div>

              {/* Tools Sidebar */}
              <div className="w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700">
                <div className="p-4 h-full overflow-y-auto">
                  <PageTools
                    selectedPagesCount={selectedPages.size}
                    totalPages={pages.length}
                    modificationsCount={modifications.length}
                    canUndo={modifications.length > 0}
                    canRedo={false} // TODO: Implement proper redo logic
                    onDeleteSelected={deleteSelectedPages}
                    onRotateSelected={rotateSelectedPages}
                    onDuplicateSelected={duplicateSelectedPages}
                    onUndo={undo}
                    onRedo={redo}
                    onExport={handleExport}
                    isLoading={isLoading}
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Mobile Layout */
          <div className="flex-1 flex flex-col">
            {/* PDF Canvas - Full Width */}
            <div className="flex-1">
              <PDFCanvas
                documentUrl={document?.url}
                pages={pages}
                currentPage={currentPage}
                zoom={zoom}
                onPageChange={setCurrentPage}
                onZoomChange={setZoom}
                isLoading={isLoading}
              />
            </div>

            {/* Mobile Bottom Bar */}
            <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-2">
              <div className="flex items-center justify-between">
                <Sheet open={showThumbnails} onOpenChange={setShowThumbnails}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Menu size={16} className="mr-1" />
                      Pages ({pages.length})
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[60vh]">
                    <div className="h-full overflow-y-auto">
                      <PDFThumbnailGrid
                        pages={pages}
                        selectedPages={selectedPages}
                        currentPage={currentPage}
                        onPageSelect={selectPage}
                        onPageToggle={togglePageSelection}
                        onSelectAll={selectAllPages}
                        onDeselectAll={deselectAllPages}
                        onReorder={reorderPages}
                        onPageClick={(pageNumber) => {
                          setCurrentPage(pageNumber);
                          setShowThumbnails(false);
                        }}
                        isLoading={isLoading}
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                <Sheet open={showTools} onOpenChange={setShowTools}>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Menu size={16} className="mr-1" />
                      Tools
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="h-[60vh]">
                    <div className="h-full overflow-y-auto">
                      <PageTools
                        selectedPagesCount={selectedPages.size}
                        totalPages={pages.length}
                        modificationsCount={modifications.length}
                        canUndo={modifications.length > 0}
                        canRedo={false}
                        onDeleteSelected={deleteSelectedPages}
                        onRotateSelected={rotateSelectedPages}
                        onDuplicateSelected={duplicateSelectedPages}
                        onUndo={undo}
                        onRedo={redo}
                        onExport={handleExport}
                        isLoading={isLoading}
                      />
                    </div>
                  </SheetContent>
                </Sheet>

                <Button
                  onClick={handleExport}
                  disabled={isLoading || pages.length === 0}
                  className="bg-indigo-600 hover:bg-indigo-700"
                  size="sm"
                >
                  <Download size={16} className="mr-1" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
