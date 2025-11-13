"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FileText,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useWorkflow } from '@/lib/presentation-workflow-context';
import { PresentationContent } from '@/lib/presentation-api-client';
import { useNotifications } from '@/lib/notifications';

export function ContentStep() {
  const { state, dispatch } = useWorkflow();
  const { showError } = useNotifications();
  const [editableContent, setEditableContent] = useState<PresentationContent | null>(state.content);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasChangesRef = useRef(false);

  useEffect(() => {
    if (state.content) {
      setEditableContent(state.content);
      hasChangesRef.current = false;
    }
  }, [state.content]);

  // Auto-save function
  const autoSave = useCallback(async (content: PresentationContent) => {
    if (!content || isSaving) return;

    setIsSaving(true);
    try {
      dispatch({
        type: 'UPDATE_CONTENT',
        payload: content
      });
      setLastSaved(new Date());
      hasChangesRef.current = false;
    } catch (error) {
      console.error('Auto-save failed:', error);
      showError('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }, [dispatch, isSaving, showError]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!editableContent || !hasChangesRef.current) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout for auto-save (2 seconds after last change)
    saveTimeoutRef.current = setTimeout(() => {
      autoSave(editableContent);
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editableContent, autoSave]);

  const handleTitleEdit = (title: string) => {
    if (!editableContent) return;

    setEditableContent({
      ...editableContent,
      title
    });
    hasChangesRef.current = true;
  };

  const handleContentEdit = (slideIndex: number, content: string) => {
    if (!editableContent) return;

    const updatedSlides = [...editableContent.slides];
    updatedSlides[slideIndex] = {
      ...updatedSlides[slideIndex],
      content
    };

    setEditableContent({
      ...editableContent,
      slides: updatedSlides
    });
    hasChangesRef.current = true;
  };

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 5) return "Just now";
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getSlideTypeColor = (type: string) => {
    switch (type) {
      case 'title':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'content':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'conclusion':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (!state.content) {
    return (
      <div className="text-center py-8">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No content available. Please generate content from the outline first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Label htmlFor="presentation-title" className="text-sm font-medium mb-2 block">
              Presentation Title
            </Label>
            <Input
              id="presentation-title"
              value={editableContent?.title || ''}
              onChange={(e) => handleTitleEdit(e.target.value)}
              className="text-2xl font-bold h-auto py-2"
              placeholder="Enter presentation title..."
            />
          </div>
        </div>
        
        {/* Auto-save Status */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : lastSaved ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Saved {formatLastSaved(lastSaved)}</span>
            </>
          ) : (
            <span>Changes will be saved automatically</span>
          )}
        </div>
      </div>

      {/* Slides with Content */}
      <div className="space-y-4">
        {editableContent?.slides.map((slide, index) => (
          <Card key={slide.slide_number}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-sm font-normal text-muted-foreground">
                    Slide {slide.slide_number}
                  </span>
                  <Badge className={getSlideTypeColor(slide.slide_type)}>
                    {slide.slide_type}
                  </Badge>
                </CardTitle>
              </div>
              <h3 className="text-lg font-semibold mt-2">{slide.header}</h3>
              {slide.subheaders && slide.subheaders.length > 0 && (
                <div className="mt-2">
                  {slide.subheaders.map((subheader, subIndex) => (
                    <p key={subIndex} className="text-sm text-muted-foreground">
                      • {subheader}
                    </p>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor={`slide-content-${index}`}>Content</Label>
                <Textarea
                  id={`slide-content-${index}`}
                  value={slide.content || ''}
                  onChange={(e) => handleContentEdit(index, e.target.value)}
                  className="min-h-[200px]"
                  placeholder="Enter slide content..."
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Instructions */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-blue-900 dark:text-blue-100">
                Editing Instructions
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Edit the title and content text for each slide</li>
                <li>• Changes are automatically saved after 2 seconds of inactivity</li>
                <li>• You can format text with line breaks</li>
                <li>• Content will be used when generating the PowerPoint</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

