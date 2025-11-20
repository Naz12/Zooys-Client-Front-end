"use client";
import { useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { GripVertical, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MergeParams, UploadedFile } from '@/lib/types/api';

export interface MergeFormProps {
  files: UploadedFile[];
  selectedFileIds: string[];
  onSelectedFileIdsChange: (ids: string[]) => void;
  params: MergeParams;
  onParamsChange: (params: MergeParams) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function MergeForm({
  files,
  selectedFileIds,
  onSelectedFileIdsChange,
  params,
  onParamsChange,
  disabled = false,
}: MergeFormProps) {
  const toggleFile = (fileId: string) => {
    if (selectedFileIds.includes(fileId)) {
      onSelectedFileIdsChange(selectedFileIds.filter(id => id !== fileId));
    } else {
      onSelectedFileIdsChange([...selectedFileIds, fileId]);
    }
  };

  const removeFile = (fileId: string) => {
    onSelectedFileIdsChange(selectedFileIds.filter(id => id !== fileId));
  };

  // Handle drag end for reordering selected files
  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination) {
      return;
    }

    const fromIndex = result.source.index;
    const toIndex = result.destination.index;

    if (fromIndex !== toIndex) {
      const newOrder = Array.from(selectedFileIds);
      const [removed] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, removed);
      onSelectedFileIdsChange(newOrder);
    }
  }, [selectedFileIds, onSelectedFileIdsChange]);

  // Get selected files in order
  const selectedFiles = selectedFileIds
    .map(id => files.find(f => f.file_id === id))
    .filter((f): f is UploadedFile => f !== undefined);

  // Get unselected files
  const unselectedFiles = files.filter(f => !selectedFileIds.includes(f.file_id));

  return (
    <div className="space-y-4">
      {/* File Selection */}
      <div className="space-y-2">
        <Label>Select Files to Merge (min 2)</Label>
        
        {/* Selected Files - Draggable List */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2 mb-3">
            <Label className="text-sm font-medium text-muted-foreground">
              Selected Files (drag to reorder):
            </Label>
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="selected-files">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`border rounded-lg p-3 space-y-2 min-h-[100px] ${
                      snapshot.isDraggingOver ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    {selectedFiles.map((file, index) => (
                      <Draggable
                        key={file.file_id}
                        draggableId={file.file_id}
                        index={index}
                        isDragDisabled={disabled}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`flex items-center gap-2 p-2 rounded-md bg-background border ${
                              snapshot.isDragging ? 'shadow-lg opacity-90' : ''
                            }`}
                          >
                            <div
                              {...provided.dragHandleProps}
                              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                            >
                              <GripVertical size={16} />
                            </div>
                            <div className="flex-1">
                              <Label className="font-normal cursor-pointer">
                                {index + 1}. {file.filename}
                                <span className="text-xs text-slate-500 ml-2">
                                  ({(file.size / 1024).toFixed(1)} KB)
                                </span>
                              </Label>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => removeFile(file.file_id)}
                              disabled={disabled}
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        )}

        {/* Unselected Files */}
        {unselectedFiles.length > 0 && (
          <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
            {unselectedFiles.map((file) => (
              <div key={file.file_id} className="flex items-center gap-2">
                <Checkbox
                  checked={false}
                  onCheckedChange={() => toggleFile(file.file_id)}
                  disabled={disabled}
                />
                <Label className="font-normal cursor-pointer flex-1">
                  {file.filename}
                  <span className="text-xs text-slate-500 ml-2">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </Label>
              </div>
            ))}
          </div>
        )}

        <p className="text-xs text-slate-500">
          {selectedFileIds.length} file(s) selected
        </p>
      </div>

      {/* Merge Parameters */}
      <div className="space-y-3">
        <div className="space-y-2">
          <Label>Page Order</Label>
          <Select
            value={params.page_order || 'as_uploaded'}
            onValueChange={(value: 'as_uploaded' | 'reverse') =>
              onParamsChange({ ...params, page_order: value })
            }
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="as_uploaded">As Uploaded</SelectItem>
              <SelectItem value="reverse">Reverse Order</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            checked={params.remove_blank_pages || false}
            onCheckedChange={(checked: boolean) =>
              onParamsChange({ ...params, remove_blank_pages: !!checked })
            }
            disabled={disabled}
            id="remove-blank"
          />
          <Label htmlFor="remove-blank" className="font-normal cursor-pointer">
            Remove blank pages
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            checked={params.add_page_numbers || false}
            onCheckedChange={(checked: boolean) =>
              onParamsChange({ ...params, add_page_numbers: !!checked })
            }
            disabled={disabled}
            id="add-numbers"
          />
          <Label htmlFor="add-numbers" className="font-normal cursor-pointer">
            Add page numbers
          </Label>
        </div>
      </div>
    </div>
  );
}

