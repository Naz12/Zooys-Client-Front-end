"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCw, ChevronLeft, ChevronRight, Maximize2, Minimize2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import dynamic from 'next/dynamic';
import type { PDFPage } from '@/lib/types/api';

// Dynamically import react-pdf with SSR disabled to avoid server-side issues
const Document = dynamic(
  () => import('react-pdf').then((mod) => mod.Document),
  { ssr: false }
);

const Page = dynamic(
  () => import('react-pdf').then((mod) => mod.Page),
  { ssr: false }
);

interface PDFCanvasProps {
  documentUrl?: string;
  pages: PDFPage[];
  currentPage: number;
  zoom: number;
  onPageChange: (pageNumber: number) => void;
  onZoomChange: (zoom: number) => void;
  isLoading?: boolean;
}

export function PDFCanvas({
  documentUrl,
  pages,
  currentPage,
  zoom,
  onPageChange,
  onZoomChange,
  isLoading = false,
}: PDFCanvasProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Configure PDF.js worker only on client side
  useEffect(() => {
    setIsClient(true);
    import('react-pdf').then((mod) => {
      const { pdfjs } = mod;
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
    });
  }, []);

  // Zoom levels
  const zoomLevels = [25, 50, 75, 100, 125, 150, 200, 300, 400];
  const currentZoomIndex = zoomLevels.findIndex(level => level === zoom) || 3;

  // Handle document load
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageError(null);
  }, []);

  // Handle document load error
  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('Error loading PDF:', error);
    setPageError('Failed to load PDF document');
  }, []);

  // Handle page load error
  const onPageLoadError = useCallback((error: Error) => {
    console.error('Error loading page:', error);
    setPageError('Failed to load page');
  }, []);

  // Navigate to previous page
  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, onPageChange]);

  // Navigate to next page
  const goToNextPage = useCallback(() => {
    if (currentPage < pages.length) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, pages.length, onPageChange]);

  // Handle page input change
  const handlePageInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const pageNumber = parseInt(event.target.value);
    if (pageNumber >= 1 && pageNumber <= pages.length) {
      onPageChange(pageNumber);
    }
  }, [pages.length, onPageChange]);

  // Zoom in
  const zoomIn = useCallback(() => {
    const currentIndex = zoomLevels.findIndex(level => level === zoom);
    if (currentIndex < zoomLevels.length - 1) {
      onZoomChange(zoomLevels[currentIndex + 1]);
    }
  }, [zoom, onZoomChange]);

  // Zoom out
  const zoomOut = useCallback(() => {
    const currentIndex = zoomLevels.findIndex(level => level === zoom);
    if (currentIndex > 0) {
      onZoomChange(zoomLevels[currentIndex - 1]);
    }
  }, [zoom, onZoomChange]);

  // Fit to width
  const fitToWidth = useCallback(() => {
    onZoomChange(100);
  }, [onZoomChange]);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement) return;

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          goToPreviousPage();
          break;
        case 'ArrowRight':
          event.preventDefault();
          goToNextPage();
          break;
        case '+':
        case '=':
          event.preventDefault();
          zoomIn();
          break;
        case '-':
          event.preventDefault();
          zoomOut();
          break;
        case '0':
          event.preventDefault();
          fitToWidth();
          break;
        case 'F11':
          event.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [goToPreviousPage, goToNextPage, zoomIn, zoomOut, fitToWidth, toggleFullscreen]);

  if (isLoading) {
    return (
      <Card className="flex-1">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            </div>
          </div>
          <div className="h-96 bg-slate-200 dark:bg-slate-700 rounded animate-pulse flex items-center justify-center">
            <div className="text-slate-500">Loading PDF...</div>
          </div>
        </div>
      </Card>
    );
  }

  if (pageError) {
    return (
      <Card className="flex-1">
        <div className="p-8 text-center">
          <div className="text-red-500 mb-4">
            <FileText size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Error Loading PDF</h3>
          <p className="text-slate-600 dark:text-slate-400">{pageError}</p>
        </div>
      </Card>
    );
  }

  if (!documentUrl || pages.length === 0) {
    return (
      <Card className="flex-1">
        <div className="p-8 text-center">
          <div className="text-slate-400 mb-4">
            <FileText size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No PDF Loaded</h3>
          <p className="text-slate-600 dark:text-slate-400">
            Upload a PDF file to start editing
          </p>
        </div>
      </Card>
    );
  }

  // Don't render PDF components until client-side is ready
  if (!isClient) {
    return (
      <Card className="flex-1">
        <div className="p-8 text-center">
          <div className="text-slate-500">Loading PDF viewer...</div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`flex-1 ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Toolbar */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          {/* Page Navigation */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage <= 1}
            >
              <ChevronLeft size={16} />
            </Button>
            
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={currentPage}
                onChange={handlePageInputChange}
                className="w-16 text-center"
                min={1}
                max={pages.length}
              />
              <span className="text-sm text-slate-500">of {pages.length}</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage >= pages.length}
            >
              <ChevronRight size={16} />
            </Button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={zoomOut}
              disabled={zoom <= zoomLevels[0]}
            >
              <ZoomOut size={16} />
            </Button>
            
            <Badge variant="secondary" className="px-3 py-1">
              {zoom}%
            </Badge>
            
            <Button
              variant="outline"
              size="sm"
              onClick={zoomIn}
              disabled={zoom >= zoomLevels[zoomLevels.length - 1]}
            >
              <ZoomIn size={16} />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={fitToWidth}
            >
              Fit
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </Button>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="p-4 overflow-auto" ref={canvasRef}>
        <div className="flex justify-center">
          <Document
            file={documentUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center h-96">
                <div className="text-slate-500">Loading PDF...</div>
              </div>
            }
          >
            <Page
              pageNumber={currentPage}
              scale={zoom / 100}
              onLoadError={onPageLoadError}
              loading={
                <div className="flex items-center justify-center h-96">
                  <div className="text-slate-500">Loading page...</div>
                </div>
              }
              error={
                <div className="flex items-center justify-center h-96 text-red-500">
                  Error loading page
                </div>
              }
            />
          </Document>
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="p-2 border-t bg-slate-50 dark:bg-slate-800">
        <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
          <span className="mr-4">← → Navigate</span>
          <span className="mr-4">+ - Zoom</span>
          <span className="mr-4">0 Fit to width</span>
          <span>F11 Fullscreen</span>
        </div>
      </div>
    </Card>
  );
}


