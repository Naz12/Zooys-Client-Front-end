"use client";

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import type { WatermarkParams } from '@/lib/types/api';
import { Droplets } from 'lucide-react';

export interface WatermarkFormProps {
  params: WatermarkParams;
  onParamsChange: (params: WatermarkParams) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export function WatermarkForm({ params, onParamsChange, onSubmit, disabled }: WatermarkFormProps) {
  return (
    <Card className="p-4">
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="watermark-type">Watermark Type</Label>
          <Select
            value={params.watermark_type}
            onValueChange={(value: 'text' | 'image') =>
              onParamsChange({ ...params, watermark_type: value })
            }
            disabled={disabled}
          >
            <SelectTrigger id="watermark-type">
              <SelectValue placeholder="Select watermark type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="image">Image</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="watermark-content">
            {params.watermark_type === 'text' ? 'Watermark Text' : 'Image URL'}
          </Label>
          <Input
            id="watermark-content"
            type={params.watermark_type === 'text' ? 'text' : 'url'}
            value={params.watermark_content || ''}
            onChange={(e) => onParamsChange({ ...params, watermark_content: e.target.value })}
            placeholder={params.watermark_type === 'text' ? 'e.g., DRAFT, CONFIDENTIAL' : 'https://example.com/image.png'}
            disabled={disabled}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="position-x">Position X (0-100)</Label>
            <Input
              id="position-x"
              type="number"
              value={params.position_x ?? 50}
              onChange={(e) => onParamsChange({ ...params, position_x: parseInt(e.target.value) || 50 })}
              min={0}
              max={100}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="position-y">Position Y (0-100)</Label>
            <Input
              id="position-y"
              type="number"
              value={params.position_y ?? 50}
              onChange={(e) => onParamsChange({ ...params, position_y: parseInt(e.target.value) || 50 })}
              min={0}
              max={100}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="rotation">Rotation (degrees)</Label>
            <Input
              id="rotation"
              type="number"
              value={params.rotation ?? -45}
              onChange={(e) => onParamsChange({ ...params, rotation: parseInt(e.target.value) || -45 })}
              min={-180}
              max={180}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="opacity">Opacity (0.0-1.0)</Label>
            <Input
              id="opacity"
              type="number"
              step="0.1"
              value={params.opacity ?? 0.3}
              onChange={(e) => onParamsChange({ ...params, opacity: parseFloat(e.target.value) || 0.3 })}
              min={0}
              max={1}
              disabled={disabled}
            />
          </div>
        </div>

        {params.watermark_type === 'text' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="font-size">Font Size</Label>
              <Input
                id="font-size"
                type="number"
                value={params.font_size ?? 24}
                onChange={(e) => onParamsChange({ ...params, font_size: parseInt(e.target.value) || 24 })}
                min={8}
                max={72}
                disabled={disabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Color (Hex)</Label>
              <Input
                id="color"
                type="text"
                value={params.color || '#000000'}
                onChange={(e) => onParamsChange({ ...params, color: e.target.value })}
                placeholder="#000000"
                disabled={disabled}
              />
            </div>
          </>
        )}

        <div className="flex items-center space-x-2">
          <Checkbox
            id="apply-to-all"
            checked={params.apply_to_all ?? true}
            onCheckedChange={(checked) => onParamsChange({ ...params, apply_to_all: !!checked })}
            disabled={disabled}
          />
          <Label htmlFor="apply-to-all" className="text-sm">Apply to All Pages</Label>
        </div>

        {!params.apply_to_all && (
          <div className="space-y-2">
            <Label htmlFor="selected-pages">Selected Pages (comma-separated)</Label>
            <Input
              id="selected-pages"
              type="text"
              value={params.selected_pages || ''}
              onChange={(e) => onParamsChange({ ...params, selected_pages: e.target.value })}
              placeholder="e.g., 1,3,5"
              disabled={disabled}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

