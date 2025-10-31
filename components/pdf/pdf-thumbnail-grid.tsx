"use client";

import { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { FileText, RotateCw, Check, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PDFPage } from '@/lib/types/api';

interface PDFThumbnailGridProps {
  pages: PDFPage[];
  selectedPages: Set<string>;
  currentPage: number;
  onPageSelect: (pageId: string) => void;
  onPageToggle: (pageId: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onPageClick: (pageNumber: number) => void;
  isLoading?: boolean;
}

export function PDFThumbnailGrid({
  pages,
  selectedPages,
  currentPage,
  onPageSelect,
  onPageToggle,
  onSelectAll,
  onDeselectAll,
  onReorder,
  onPageClick,
  isLoading = false,
}: PDFThumbnailGridProps) {
  const [isDragDisabled, setIsDragDisabled] = useState(false);

  // Handle drag end
  const handleDragEnd = useCallback((result: any) => {
    setIsDragDisabled(false);
    
    if (!result.destination) {
      return;
    }

    const fromIndex = result.source.index;
    const toIndex = result.destination.index;

    if (fromIndex !== toIndex) {
      onReorder(fromIndex, toIndex);
    }
  }, [onReorder]);

  // Handle drag start
  const handleDragStart = useCallback(() => {
    setIsDragDisabled(true);
  }, []);

  // Get rotation icon
  const getRotationIcon = (rotation: number) => {
    if (rotation === 0) return null;
    return (
      <div className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1">
        <RotateCw size={12} />
      </div>
    );
  };

  // Get page dimensions for thumbnail
  const getThumbnailDimensions = (page: PDFPage) => {
    const maxWidth = 120;
    const maxHeight = 160;
    const aspectRatio = page.width / page.height;
    
    let width = maxWidth;
    let height = maxWidth / aspectRatio;
    
    if (height > maxHeight) {
      height = maxHeight;
      width = maxHeight * aspectRatio;
    }
    
    return { width, height };
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Pages</h3>
          <div className="flex gap-2">
            <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
            <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-20 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Pages ({pages.length})</h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSelectAll}
            disabled={selectedPages.size === pages.length}
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDeselectAll}
            disabled={selectedPages.size === 0}
          >
            Deselect All
          </Button>
        </div>
      </div>

      {/* Selection Info */}
      {selectedPages.size > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {selectedPages.size} selected
          </Badge>
          <span className="text-sm text-slate-600 dark:text-slate-400">
            Click to select individual pages, drag to reorder
          </span>
        </div>
      )}

      {/* Thumbnail Grid */}
      <DragDropContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <Droppable droppableId="pages" isDropDisabled={isDragDisabled}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`space-y-2 transition-colors ${
                snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              {pages.map((page, index) => {
                const isSelected = selectedPages.has(page.id);
                const isCurrent = page.pageNumber === currentPage;
                const dimensions = getThumbnailDimensions(page);

                return (
                  <Draggable
                    key={page.id}
                    draggableId={page.id}
                    index={index}
                    isDragDisabled={isDragDisabled}
                  >
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                            : isCurrent
                            ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800'
                        } ${
                          snapshot.isDragging
                            ? 'shadow-lg scale-105 rotate-2'
                            : ''
                        }`}
                        onClick={() => onPageClick(page.pageNumber)}
                      >
                        <div className="p-3">
                          {/* Thumbnail */}
                          <div className="relative mb-2">
                            <div
                              className="bg-slate-100 dark:bg-slate-700 rounded border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center"
                              style={{
                                width: dimensions.width,
                                height: dimensions.height,
                              }}
                            >
                              <FileText size={24} className="text-slate-400" />
                            </div>
                            
                            {/* Rotation indicator */}
                            {getRotationIcon(page.rotation)}
                            
                            {/* Selection checkbox */}
                            <div className="absolute top-1 left-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPageToggle(page.id);
                                }}
                                className="bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm border"
                              >
                                {isSelected ? (
                                  <Check size={12} className="text-indigo-600" />
                                ) : (
                                  <Square size={12} className="text-slate-400" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Page Info */}
                          <div className="text-center">
                            <p className="text-sm font-medium">
                              Page {page.pageNumber}
                            </p>
                            <p className="text-xs text-slate-500">
                              {Math.round(dimensions.width)} × {Math.round(dimensions.height)}
                            </p>
                            {page.rotation !== 0 && (
                              <p className="text-xs text-orange-600">
                                {page.rotation}°
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Empty State */}
      {pages.length === 0 && (
        <div className="text-center py-8 text-slate-500 dark:text-slate-400">
          <FileText size={48} className="mx-auto mb-4 opacity-50" />
          <p>No pages loaded</p>
          <p className="text-sm">Upload a PDF to get started</p>
        </div>
      )}

      {/* Instructions */}
      {pages.length > 0 && (
        <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
          <p>• Click to select individual pages</p>
          <p>• Drag thumbnails to reorder pages</p>
          <p>• Use checkboxes for batch operations</p>
        </div>
      )}
    </div>
  );
}


