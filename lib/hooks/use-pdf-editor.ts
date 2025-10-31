"use client";

import { useState, useCallback, useRef, useEffect } from 'react';
import { PDFDocument as PDFLibDocument, PDFPage as PDFLibPage } from 'pdf-lib';
import { toast } from 'react-hot-toast';
import type { PDFDocument, PDFPage, PDFEditOperation } from '@/lib/types/api';

export interface PDFEditorState {
  document: PDFDocument | null;
  pages: PDFPage[];
  selectedPages: Set<string>;
  currentPage: number;
  zoom: number;
  modifications: PDFEditOperation[];
  isLoading: boolean;
  error: string | null;
}

export interface PDFEditorActions {
  loadPDF: (file: File) => Promise<void>;
  selectPage: (pageId: string) => void;
  selectAllPages: () => void;
  deselectAllPages: () => void;
  togglePageSelection: (pageId: string) => void;
  deleteSelectedPages: () => void;
  rotateSelectedPages: (degrees: number) => void;
  duplicateSelectedPages: () => void;
  reorderPages: (fromIndex: number, toIndex: number) => void;
  setCurrentPage: (pageNumber: number) => void;
  setZoom: (zoom: number) => void;
  undo: () => void;
  redo: () => void;
  exportPDF: () => Promise<Blob | null>;
  reset: () => void;
}

export function usePDFEditor(): PDFEditorState & PDFEditorActions {
  const [state, setState] = useState<PDFEditorState>({
    document: null,
    pages: [],
    selectedPages: new Set(),
    currentPage: 1,
    zoom: 100,
    modifications: [],
    isLoading: false,
    error: null,
  });

  const pdfDocRef = useRef<PDFLibDocument | null>(null);
  const historyRef = useRef<PDFEditOperation[]>([]);
  const historyIndexRef = useRef(-1);

  // Load PDF file
  const loadPDF = useCallback(async (file: File) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFLibDocument.load(arrayBuffer);
      pdfDocRef.current = pdfDoc;

      const pages: PDFPage[] = [];
      for (let i = 0; i < pdfDoc.getPageCount(); i++) {
        const page = pdfDoc.getPage(i);
        const { width, height } = page.getSize();
        
        pages.push({
          id: `page-${i}`,
          pageNumber: i + 1,
          rotation: 0,
          width,
          height,
        });
      }

      const document: PDFDocument = {
        id: `doc-${Date.now()}`,
        name: file.name,
        size: file.size,
        pageCount: pdfDoc.getPageCount(),
        pages,
        file,
        url: URL.createObjectURL(file),
      };

      setState(prev => ({
        ...prev,
        document,
        pages,
        selectedPages: new Set(),
        currentPage: 1,
        modifications: [],
        isLoading: false,
      }));

      // Reset history
      historyRef.current = [];
      historyIndexRef.current = -1;

      toast.success(`PDF loaded successfully (${pages.length} pages)`);
    } catch (error) {
      console.error('Error loading PDF:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load PDF file',
      }));
      toast.error('Failed to load PDF file');
    }
  }, []);

  // Add operation to history
  const addToHistory = useCallback((operation: PDFEditOperation) => {
    // Remove any operations after current index
    historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    
    // Add new operation
    historyRef.current.push(operation);
    historyIndexRef.current = historyRef.current.length - 1;

    // Limit history to 20 operations
    if (historyRef.current.length > 20) {
      historyRef.current.shift();
      historyIndexRef.current--;
    }
  }, []);

  // Select page
  const selectPage = useCallback((pageId: string) => {
    setState(prev => ({
      ...prev,
      selectedPages: new Set([pageId]),
    }));
  }, []);

  // Select all pages
  const selectAllPages = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedPages: new Set(prev.pages.map(p => p.id)),
    }));
  }, []);

  // Deselect all pages
  const deselectAllPages = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedPages: new Set(),
    }));
  }, []);

  // Toggle page selection
  const togglePageSelection = useCallback((pageId: string) => {
    setState(prev => {
      const newSelected = new Set(prev.selectedPages);
      if (newSelected.has(pageId)) {
        newSelected.delete(pageId);
      } else {
        newSelected.add(pageId);
      }
      return {
        ...prev,
        selectedPages: newSelected,
      };
    });
  }, []);

  // Delete selected pages
  const deleteSelectedPages = useCallback(() => {
    if (!pdfDocRef.current || state.selectedPages.size === 0) return;

    setState(prev => {
      const pagesToDelete = Array.from(prev.selectedPages);
      const newPages = prev.pages.filter(page => !pagesToDelete.includes(page.id));
      
      // Update page numbers
      const updatedPages = newPages.map((page, index) => ({
        ...page,
        pageNumber: index + 1,
      }));

      // Add to history
      const operation: PDFEditOperation = {
        type: 'delete',
        pageIds: pagesToDelete,
        timestamp: Date.now(),
      };
      addToHistory(operation);

      return {
        ...prev,
        pages: updatedPages,
        selectedPages: new Set(),
        modifications: [...prev.modifications, operation],
        currentPage: Math.min(prev.currentPage, updatedPages.length),
      };
    });

    toast.success(`Deleted ${state.selectedPages.size} page(s)`);
  }, [state.selectedPages, addToHistory]);

  // Rotate selected pages
  const rotateSelectedPages = useCallback((degrees: number) => {
    if (!pdfDocRef.current || state.selectedPages.size === 0) return;

    setState(prev => {
      const updatedPages = prev.pages.map(page => {
        if (prev.selectedPages.has(page.id)) {
          return {
            ...page,
            rotation: (page.rotation + degrees) % 360,
          };
        }
        return page;
      });

      // Add to history
      const operation: PDFEditOperation = {
        type: 'rotate',
        pageIds: Array.from(prev.selectedPages),
        data: { degrees },
        timestamp: Date.now(),
      };
      addToHistory(operation);

      return {
        ...prev,
        pages: updatedPages,
        modifications: [...prev.modifications, operation],
      };
    });

    toast.success(`Rotated ${state.selectedPages.size} page(s) by ${degrees}°`);
  }, [state.selectedPages, addToHistory]);

  // Duplicate selected pages
  const duplicateSelectedPages = useCallback(() => {
    if (!pdfDocRef.current || state.selectedPages.size === 0) return;

    setState(prev => {
      const pagesToDuplicate = prev.pages.filter(page => prev.selectedPages.has(page.id));
      const newPages: PDFPage[] = [];
      let insertIndex = prev.pages.length;

      // Find the highest page number among selected pages
      const maxPageNumber = Math.max(...pagesToDuplicate.map(p => p.pageNumber));

      pagesToDuplicate.forEach((page, index) => {
        const duplicatedPage: PDFPage = {
          ...page,
          id: `page-${Date.now()}-${index}`,
          pageNumber: maxPageNumber + index + 1,
        };
        newPages.push(duplicatedPage);
      });

      // Add to history
      const operation: PDFEditOperation = {
        type: 'duplicate',
        pageIds: Array.from(prev.selectedPages),
        data: { duplicatedIds: newPages.map(p => p.id) },
        timestamp: Date.now(),
      };
      addToHistory(operation);

      return {
        ...prev,
        pages: [...prev.pages, ...newPages],
        selectedPages: new Set(newPages.map(p => p.id)),
        modifications: [...prev.modifications, operation],
      };
    });

    toast.success(`Duplicated ${state.selectedPages.size} page(s)`);
  }, [state.selectedPages, addToHistory]);

  // Reorder pages
  const reorderPages = useCallback((fromIndex: number, toIndex: number) => {
    if (!pdfDocRef.current) return;

    setState(prev => {
      const newPages = [...prev.pages];
      const [movedPage] = newPages.splice(fromIndex, 1);
      newPages.splice(toIndex, 0, movedPage);

      // Update page numbers
      const updatedPages = newPages.map((page, index) => ({
        ...page,
        pageNumber: index + 1,
      }));

      // Add to history
      const operation: PDFEditOperation = {
        type: 'reorder',
        pageIds: [movedPage.id],
        data: { fromIndex, toIndex },
        timestamp: Date.now(),
      };
      addToHistory(operation);

      return {
        ...prev,
        pages: updatedPages,
        modifications: [...prev.modifications, operation],
      };
    });
  }, []);

  // Set current page
  const setCurrentPage = useCallback((pageNumber: number) => {
    setState(prev => ({
      ...prev,
      currentPage: Math.max(1, Math.min(pageNumber, prev.pages.length)),
    }));
  }, []);

  // Set zoom level
  const setZoom = useCallback((zoom: number) => {
    setState(prev => ({
      ...prev,
      zoom: Math.max(25, Math.min(zoom, 400)),
    }));
  }, []);

  // Undo operation
  const undo = useCallback(() => {
    if (historyIndexRef.current < 0) return;

    const operation = historyRef.current[historyIndexRef.current];
    historyIndexRef.current--;

    // Apply reverse operation
    setState(prev => {
      const newModifications = prev.modifications.filter(op => op.timestamp !== operation.timestamp);
      
      // TODO: Implement reverse operations based on operation type
      // This would require storing the previous state for each operation
      
      return {
        ...prev,
        modifications: newModifications,
      };
    });

    toast.success('Undo completed');
  }, []);

  // Redo operation
  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;

    historyIndexRef.current++;
    const operation = historyRef.current[historyIndexRef.current];

    // Re-apply operation
    setState(prev => ({
      ...prev,
      modifications: [...prev.modifications, operation],
    }));

    toast.success('Redo completed');
  }, []);

  // Export PDF
  const exportPDF = useCallback(async (): Promise<Blob | null> => {
    if (!pdfDocRef.current) return null;

    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Create a new PDF document
      const newPdfDoc = await PDFLibDocument.create();
      
      // Add pages in the current order
      for (const page of state.pages) {
        const [copiedPage] = await newPdfDoc.copyPages(pdfDocRef.current, [page.pageNumber - 1]);
        
        // Apply rotation if needed
        if (page.rotation !== 0) {
          copiedPage.setRotation(page.rotation);
        }
        
        newPdfDoc.addPage(copiedPage);
      }

      // Generate PDF bytes
      const pdfBytes = await newPdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });

      setState(prev => ({ ...prev, isLoading: false }));
      toast.success('PDF exported successfully');
      
      return blob;
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      toast.error('Failed to export PDF');
      return null;
    }
  }, [state.pages]);

  // Reset editor
  const reset = useCallback(() => {
    setState({
      document: null,
      pages: [],
      selectedPages: new Set(),
      currentPage: 1,
      zoom: 100,
      modifications: [],
      isLoading: false,
      error: null,
    });
    
    pdfDocRef.current = null;
    historyRef.current = [];
    historyIndexRef.current = -1;
  }, []);

  return {
    ...state,
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
  };
}


