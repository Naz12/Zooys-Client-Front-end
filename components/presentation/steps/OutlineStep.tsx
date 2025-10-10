"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DragDropContext,
  Droppable,
  Draggable,
  DropResult
} from '@hello-pangea/dnd';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  GripVertical,
  Presentation,
  Clock,
  FileText,
  CheckCircle
} from 'lucide-react';
import { useWorkflow } from '@/lib/presentation-workflow-context';
import { presentationApi, PresentationSlide } from '@/lib/presentation-api-client';
import { useNotifications } from '@/lib/notifications';

export function OutlineStep() {
  const { state, dispatch } = useWorkflow();
  const { showSuccess, showError } = useNotifications();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editableOutline, setEditableOutline] = useState(state.outline);

  React.useEffect(() => {
    if (state.outline) {
      setEditableOutline(state.outline);
    }
  }, [state.outline]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !editableOutline) return;

    const newSlides = Array.from(editableOutline.slides);
    const [reorderedSlide] = newSlides.splice(result.source.index, 1);
    newSlides.splice(result.destination.index, 0, reorderedSlide);

    // Update slide numbers
    const updatedSlides = newSlides.map((slide, index) => ({
      ...slide,
      slide_number: index + 1
    }));

    setEditableOutline({
      ...editableOutline,
      slides: updatedSlides
    });
  };

  const handleSlideEdit = (slideIndex: number, field: keyof PresentationSlide, value: string | string[]) => {
    if (!editableOutline) return;

    const updatedSlides = [...editableOutline.slides];
    updatedSlides[slideIndex] = {
      ...updatedSlides[slideIndex],
      [field]: value
    };

    setEditableOutline({
      ...editableOutline,
      slides: updatedSlides
    });
  };

  const handleAddSlide = () => {
    if (!editableOutline) return;

    const newSlide: PresentationSlide = {
      slide_number: editableOutline.slides.length + 1,
      header: 'New Slide',
      subheaders: ['Add your content here'],
      slide_type: 'content'
    };

    setEditableOutline({
      ...editableOutline,
      slides: [...editableOutline.slides, newSlide]
    });
  };

  const handleRemoveSlide = (slideIndex: number) => {
    if (!editableOutline || editableOutline.slides.length <= 1) return;

    const updatedSlides = editableOutline.slides.filter((_, index) => index !== slideIndex);
    
    // Update slide numbers
    const renumberedSlides = updatedSlides.map((slide, index) => ({
      ...slide,
      slide_number: index + 1
    }));

    setEditableOutline({
      ...editableOutline,
      slides: renumberedSlides
    });
  };

  const handleSaveChanges = async () => {
    if (!editableOutline || !state.aiResultId) return;

    setIsSaving(true);
    try {
      const response = await presentationApi.updateOutline(state.aiResultId, {
        outline: editableOutline
      });

      if (response.success) {
        dispatch({
          type: 'UPDATE_OUTLINE',
          payload: response.data.outline
        });
        setIsEditing(false);
        showSuccess('Outline updated successfully!');
      } else {
        throw new Error('Failed to update outline');
      }
    } catch (error) {
      console.error('Error updating outline:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update outline';
      showError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    setEditableOutline(state.outline);
    setIsEditing(false);
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

  if (!state.outline) {
    return (
      <div className="text-center py-8">
        <Presentation className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-muted-foreground">No outline available. Please generate an outline first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Outline Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{editableOutline?.title}</h3>
            <div className="flex items-center gap-4 mt-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {editableOutline?.slides.length} slides
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {editableOutline?.estimated_duration}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                Edit Outline
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={handleDiscardChanges}
                  disabled={isSaving}
                >
                  Discard
                </Button>
                <Button
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                  className="flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Slides List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Presentation Slides</Label>
          {isEditing && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddSlide}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Slide
            </Button>
          )}
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="slides">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-3"
              >
                {editableOutline?.slides.map((slide, index) => (
                  <Draggable
                    key={slide.slide_number}
                    draggableId={slide.slide_number.toString()}
                    index={index}
                    isDragDisabled={!isEditing}
                  >
                    {(provided, snapshot) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`transition-all ${
                          snapshot.isDragging ? 'shadow-lg' : ''
                        } ${isEditing ? 'hover:shadow-md' : ''}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            {isEditing && (
                              <div
                                {...provided.dragHandleProps}
                                className="mt-1 cursor-grab active:cursor-grabbing"
                              >
                                <GripVertical className="h-4 w-4 text-gray-400" />
                              </div>
                            )}
                            
                            <div className="flex-1 space-y-3">
                              <div className="flex items-center gap-3">
                                <Badge className={getSlideTypeColor(slide.slide_type)}>
                                  {slide.slide_type}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  Slide {slide.slide_number}
                                </span>
                                {isEditing && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveSlide(index)}
                                    disabled={editableOutline.slides.length <= 1}
                                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>

                              <div className="space-y-2">
                                <div>
                                  <Label className="text-sm font-medium">Title</Label>
                                  {isEditing ? (
                                    <Input
                                      value={slide.header}
                                      onChange={(e) => handleSlideEdit(index, 'header', e.target.value)}
                                      className="mt-1"
                                    />
                                  ) : (
                                    <p className="text-sm font-medium mt-1">{slide.header}</p>
                                  )}
                                </div>

                                <div>
                                  <Label className="text-sm font-medium">Content</Label>
                                  {isEditing ? (
                                    <Textarea
                                      value={slide.subheaders.join('\n')}
                                      onChange={(e) => handleSlideEdit(index, 'subheaders', e.target.value.split('\n'))}
                                      className="mt-1 min-h-[80px]"
                                      placeholder="Enter content points (one per line)"
                                    />
                                  ) : (
                                    <div className="mt-1">
                                      {slide.subheaders.map((subheader, subIndex) => (
                                        <p key={subIndex} className="text-sm text-muted-foreground">
                                          • {subheader}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {isEditing && (
                                  <div>
                                    <Label className="text-sm font-medium">Type</Label>
                                    <select
                                      value={slide.slide_type}
                                      onChange={(e) => handleSlideEdit(index, 'slide_type', e.target.value as 'title' | 'content' | 'conclusion')}
                                      className="mt-1 w-full p-2 border border-input rounded-md bg-background text-sm"
                                    >
                                      <option value="title">Title Slide</option>
                                      <option value="content">Content Slide</option>
                                      <option value="conclusion">Conclusion Slide</option>
                                    </select>
                                  </div>
                                )}
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

      {/* Instructions */}
      {isEditing && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  Editing Instructions
                </h4>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                  <li>• Drag slides to reorder them</li>
                  <li>• Click on titles and content to edit them</li>
                  <li>• Add new slides using the &quot;Add Slide&quot; button</li>
                  <li>• Remove slides using the trash icon (minimum 1 slide required)</li>
                  <li>• Change slide types to organize your presentation</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
