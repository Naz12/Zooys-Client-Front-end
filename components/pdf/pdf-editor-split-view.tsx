"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import dynamic from 'next/dynamic';
import { fileApi } from '@/lib/api/file-api';
import type { EditPDFParams } from '@/lib/types/api';

// Dynamically import react-pdf with SSR disabled
const Document = dynamic(
  () => import('react-pdf').then((mod) => mod.Document),
  { ssr: false }
);

const Page = dynamic(
  () => import('react-pdf').then((mod) => mod.Page),
  { ssr: false }
);

export interface PDFEditorSplitViewProps {
  fileId: string;
  fileName: string | null;
  params: EditPDFParams;
  onParamsChange: (params: EditPDFParams) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

interface PageInfo {
  id: string;
  pageNumber: number;
  originalPageNumber: number;
}

export function PDFEditorSplitView({
  fileId,
  fileName,
  params,
  onParamsChange,
  onSubmit,
  disabled = false,
}: PDFEditorSplitViewProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [workerReady, setWorkerReady] = useState(false);
  const paramsRef = useRef(params);
  
  // Keep paramsRef in sync with params prop
  useEffect(() => {
    paramsRef.current = params;
  }, [params]);

  // Configure PDF.js worker only on client side
  useEffect(() => {
    setIsClient(true);
    // Use dynamic import to avoid SSR issues
    if (typeof window !== 'undefined') {
      import('react-pdf').then((mod) => {
        const { pdfjs } = mod;
        // Use CDN worker to avoid webpack bundling issues
        pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
        console.log('✅ PDF.js worker configured:', pdfjs.GlobalWorkerOptions.workerSrc);
        setWorkerReady(true);
      }).catch((err) => {
        console.error('❌ Failed to load react-pdf:', err);
        setError('Failed to initialize PDF viewer');
      });
    }
  }, []);

  // Fetch PDF file and create URL
  useEffect(() => {
    const fetchPDF = async () => {
      if (!fileId || !isClient || !workerReady) return;

      setIsLoading(true);
      setError(null);

      try {
        // Get file data to get file URL
        let fileUrl: string | undefined;
        
        try {
          const fileResponse = await fileApi.getFile(fileId);
          
          // Handle different response structures based on actual API response
          const response = fileResponse as any;
          
          // Prefer download_url (goes through API with proper CORS headers)
          // Then check for file_url in various locations
          // Based on upload response: file_url is at data.file_url or top level
          // Based on GET response: likely at file.download_url, file.file_url or file.file_path
          if (response.file?.download_url) {
            fileUrl = response.file.download_url;
          } else if (response.download_url) {
            fileUrl = response.download_url;
          } else if (response.file?.file_url) {
            fileUrl = response.file.file_url;
          } else if (response.file?.file_path) {
            // Construct URL from file_path - this is likely the case for GET /files/{id}
            const filePath = response.file.file_path;
            fileUrl = `http://localhost:8000/storage/${filePath}`;
          } else if (response.data?.file_url) {
            fileUrl = response.data.file_url;
          } else if (response.file_url) {
            fileUrl = response.file_url;
          } else if (response.data?.file_upload?.file_path) {
            // Construct URL from file_path
            const filePath = response.data.file_upload.file_path;
            fileUrl = `http://localhost:8000/storage/${filePath}`;
          } else if (response.file_path) {
            fileUrl = `http://localhost:8000/storage/${response.file_path}`;
          } else if (response.file?.stored_name) {
            // Fallback: construct from stored_name
            const storedName = response.file.stored_name;
            fileUrl = `http://localhost:8000/storage/uploads/files/${storedName}`;
          } else if (response.data?.file_upload?.stored_name) {
            // Fallback: construct from stored_name
            const storedName = response.data.file_upload.stored_name;
            fileUrl = `http://localhost:8000/storage/uploads/files/${storedName}`;
          }
        } catch (getFileError) {
          console.warn('getFile failed, trying getFileMetadata:', getFileError);
          // Fallback to getFileMetadata
          try {
            const fileData = await fileApi.getFileMetadata(fileId);
            console.log('📄 File metadata:', fileData);
            
            const metadata = fileData as any;
            // Check for file_url or construct from file_path
            if (metadata.file_url) {
              fileUrl = metadata.file_url;
            } else if (metadata.file_path) {
              fileUrl = `http://localhost:8000/storage/${metadata.file_path}`;
            } else if (metadata.data?.file_url) {
              fileUrl = metadata.data.file_url;
            } else if (metadata.data?.file_upload?.file_path) {
              const filePath = metadata.data.file_upload.file_path;
              fileUrl = `http://localhost:8000/storage/${filePath}`;
            }
          } catch (metadataError) {
            console.error('Both getFile and getFileMetadata failed:', metadataError);
            throw new Error('Failed to fetch file metadata');
          }
        }

        if (!fileUrl) {
          console.error('❌ File URL not found in response');
          throw new Error('File URL not found in API response');
        }

        // Make URL absolute if needed (should already be absolute from above, but just in case)
        const absoluteUrl = fileUrl.startsWith('http')
          ? fileUrl
          : `http://localhost:8000${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;

        console.log('📄 Setting PDF URL:', absoluteUrl);
        setPdfUrl(absoluteUrl);
      } catch (err: any) {
        console.error('❌ Error fetching PDF:', err);
        setError(err.message || 'Failed to load PDF file');
        setIsLoading(false);
      }
    };

    fetchPDF();
  }, [fileId, isClient, workerReady]);

  // Handle document load success
  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    console.log('✅ PDF document loaded successfully:', numPages, 'pages');
    setNumPages(numPages);
    
    // Initialize pages array with original order
    const initialPages: PageInfo[] = Array.from({ length: numPages }, (_, i) => ({
      id: `page-${i + 1}`,
      pageNumber: i + 1,
      originalPageNumber: i + 1,
    }));
    
    setPages(initialPages);
    setIsLoading(false);
    setError(null);
  }, []);

  // Handle document load error
  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('❌ Error loading PDF document:', error);
    console.error('PDF URL was:', pdfUrl);
    setError(`Failed to load PDF document: ${error.message || 'Unknown error'}`);
    setIsLoading(false);
  }, [pdfUrl]);

  // Handle drag end for reordering pages
  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination) {
      return;
    }

    const fromIndex = result.source.index;
    const toIndex = result.destination.index;

    if (fromIndex !== toIndex) {
      // Calculate new page order before updating state
      const newPages = Array.from(pages);
      const [removed] = newPages.splice(fromIndex, 1);
      newPages.splice(toIndex, 0, removed);
      const newPageOrder = newPages.map((p) => p.originalPageNumber).join(',');
      
      setPages((prevPages) => {
        const updatedPages = Array.from(prevPages);
        const [moved] = updatedPages.splice(fromIndex, 1);
        updatedPages.splice(toIndex, 0, moved);

        // Update page numbers
        return updatedPages.map((page, index) => ({
          ...page,
          pageNumber: index + 1,
        }));
      });
      
      // Update params with custom page order - create new object to avoid mutation
      const currentParams = paramsRef.current;
      const newParams: EditPDFParams = {
        page_order: newPageOrder,
        remove_blank_pages: currentParams.remove_blank_pages ?? false,
        remove_pages: currentParams.remove_pages || '',
      };
      
      // Use requestAnimationFrame to ensure state update completes first
      requestAnimationFrame(() => {
        onParamsChange(newParams);
      });
    }
  }, [pages, onParamsChange]);

  // Handle page click in thumbnail
  const handlePageClick = useCallback((pageNumber: number) => {
    setCurrentPage(pageNumber);
  }, []);

  if (!isClient || !workerReady) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {!isClient ? 'Initializing...' : 'Loading PDF viewer...'}
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error || !pdfUrl) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-sm text-red-500">{error || 'PDF not available'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Edit PDF: {fileName || 'Document'}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Drag pages to reorder • Click thumbnail to view page
            </p>
          </div>
          <Button
            onClick={onSubmit}
            disabled={disabled || pages.length === 0}
            className="bg-purple-600 hover:bg-purple-500"
          >
            Apply Changes
          </Button>
        </div>
      </div>

      {/* Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Thumbnail Preview */}
        <div className="w-full md:w-1/3 border-r bg-background overflow-y-auto">
          <div className="p-4">
            <Label className="text-sm font-medium mb-3 block">
              Page Order ({pages.length} pages)
            </Label>
            
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="pdf-pages">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 ${
                      snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    {pages.map((page, index) => (
                      <Draggable
                        key={page.id}
                        draggableId={page.id}
                        index={index}
                        isDragDisabled={disabled}
                      >
                        {(provided, snapshot) => (
                          <Card
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`cursor-pointer transition-all ${
                              snapshot.isDragging
                                ? 'shadow-lg opacity-90 scale-105'
                                : 'hover:shadow-md'
                            } ${
                              currentPage === page.pageNumber
                                ? 'ring-2 ring-purple-500 border-purple-500'
                                : ''
                            }`}
                            onClick={() => handlePageClick(page.pageNumber)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center gap-2">
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground flex-shrink-0"
                                >
                                  <GripVertical size={16} />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium">
                                      Page {page.pageNumber}
                                    </span>
                                    {page.originalPageNumber !== page.pageNumber && (
                                      <span className="text-xs text-muted-foreground">
                                        (was {page.originalPageNumber})
                                      </span>
                                    )}
                                  </div>
                                  
                                  {/* Thumbnail */}
                                  <div className="border rounded bg-muted/20 overflow-hidden">
                                    <Document
                                      file={pdfUrl}
                                      loading={
                                        <div className="flex items-center justify-center h-24">
                                          <Loader2 className="h-4 w-4 animate-spin" />
                                        </div>
                                      }
                                    >
                                      <Page
                                        pageNumber={page.originalPageNumber}
                                        width={120}
                                        renderTextLayer={false}
                                        renderAnnotationLayer={false}
                                        loading={
                                          <div className="flex items-center justify-center h-24">
                                            <FileText className="h-8 w-8 text-muted-foreground" />
                                          </div>
                                        }
                                      />
                                    </Document>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>

        {/* Right Side - PDF Viewer */}
        <div className="w-full md:w-2/3 bg-muted/20 overflow-y-auto">
          <div className="p-4">
            <div className="sticky top-0 bg-background border rounded-lg p-2 mb-4 z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  ←
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {numPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))}
                  disabled={currentPage === numPages}
                >
                  →
                </Button>
              </div>
            </div>

            <div className="flex justify-center bg-white dark:bg-slate-900 rounded-lg shadow-sm p-4">
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={(error) => {
                  console.error('PDF Document load error:', error);
                  onDocumentLoadError(error);
                }}
                loading={
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Loading PDF document...</p>
                    </div>
                  </div>
                }
                error={
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <p className="text-sm text-red-500 mb-2">Failed to load PDF document</p>
                      <p className="text-xs text-muted-foreground">URL: {pdfUrl}</p>
                    </div>
                  </div>
                }
                options={{
                  cMapUrl: 'https://unpkg.com/pdfjs-dist@3.11.174/cmaps/',
                  cMapPacked: true,
                }}
              >
                <Page
                  pageNumber={currentPage}
                  scale={1.2}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  loading={
                    <div className="flex items-center justify-center h-96">
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
        </div>
      </div>
    </div>
  );
}

