"use client";

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { AnnotateParams } from '@/lib/types/api';
import { Highlighter, Plus, Trash2 } from 'lucide-react';

export interface AnnotateFormProps {
  params: AnnotateParams;
  onParamsChange: (params: AnnotateParams) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export function AnnotateForm({ params, onParamsChange, onSubmit, disabled }: AnnotateFormProps) {
  const annotations = params.annotations || [];

  const addAnnotation = () => {
    const newAnnotation = {
      type: 'note' as const,
      page_number: 1,
      x: 50,
      y: 50,
      text: 'New annotation',
    };
    onParamsChange({
      ...params,
      annotations: [...annotations, newAnnotation],
    });
  };

  const removeAnnotation = (index: number) => {
    onParamsChange({
      ...params,
      annotations: annotations.filter((_, i) => i !== index),
    });
  };

  const updateAnnotation = (index: number, field: string, value: any) => {
    const updated = [...annotations];
    updated[index] = { ...updated[index], [field]: value };
    onParamsChange({ ...params, annotations: updated });
  };

  return (
    <Card className="p-4">
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Annotations</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addAnnotation}
            disabled={disabled}
          >
            <Plus size={16} className="mr-1" />
            Add
          </Button>
        </div>

        {annotations.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">
            No annotations added. Click "Add" to create one.
          </p>
        ) : (
          <div className="space-y-4">
            {annotations.map((annotation, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Annotation {index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAnnotation(index)}
                    disabled={disabled}
                  >
                    <Trash2 size={16} className="text-red-500" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select
                      value={annotation.type}
                      onValueChange={(value: 'note' | 'highlight' | 'text') =>
                        updateAnnotation(index, 'type', value)
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="note">Note</SelectItem>
                        <SelectItem value="highlight">Highlight</SelectItem>
                        <SelectItem value="text">Text</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Page</Label>
                    <Input
                      type="number"
                      value={annotation.page_number}
                      onChange={(e) => updateAnnotation(index, 'page_number', parseInt(e.target.value) || 1)}
                      min={1}
                      className="h-8"
                      disabled={disabled}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">X Position (0-100)</Label>
                    <Input
                      type="number"
                      value={annotation.x}
                      onChange={(e) => updateAnnotation(index, 'x', parseInt(e.target.value) || 50)}
                      min={0}
                      max={100}
                      className="h-8"
                      disabled={disabled}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Y Position (0-100)</Label>
                    <Input
                      type="number"
                      value={annotation.y}
                      onChange={(e) => updateAnnotation(index, 'y', parseInt(e.target.value) || 50)}
                      min={0}
                      max={100}
                      className="h-8"
                      disabled={disabled}
                    />
                  </div>
                </div>

                {(annotation.type === 'note' || annotation.type === 'text') && (
                  <div className="space-y-1">
                    <Label className="text-xs">Text</Label>
                    <Input
                      type="text"
                      value={annotation.text || ''}
                      onChange={(e) => updateAnnotation(index, 'text', e.target.value)}
                      className="h-8"
                      disabled={disabled}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

