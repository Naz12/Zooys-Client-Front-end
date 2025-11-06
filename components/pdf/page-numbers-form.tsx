"use client";

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import type { PageNumbersParams } from '@/lib/types/api';
import { Hash } from 'lucide-react';

export interface PageNumbersFormProps {
  params: PageNumbersParams;
  onParamsChange: (params: PageNumbersParams) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export function PageNumbersForm({ params, onParamsChange, onSubmit, disabled }: PageNumbersFormProps) {
  return (
    <Card className="p-4">
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="position">Position</Label>
          <Select
            value={params.position}
            onValueChange={(value: PageNumbersParams['position']) =>
              onParamsChange({ ...params, position: value })
            }
            disabled={disabled}
          >
            <SelectTrigger id="position">
              <SelectValue placeholder="Select position" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bottom_right">Bottom Right</SelectItem>
              <SelectItem value="bottom_left">Bottom Left</SelectItem>
              <SelectItem value="top_right">Top Right</SelectItem>
              <SelectItem value="top_left">Top Left</SelectItem>
              <SelectItem value="bottom_center">Bottom Center</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="format-type">Number Format</Label>
          <Select
            value={params.format_type}
            onValueChange={(value: 'arabic' | 'roman_lower' | 'roman_upper') =>
              onParamsChange({ ...params, format_type: value })
            }
            disabled={disabled}
          >
            <SelectTrigger id="format-type">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="arabic">Arabic (1, 2, 3...)</SelectItem>
              <SelectItem value="roman_lower">Roman Lowercase (i, ii, iii...)</SelectItem>
              <SelectItem value="roman_upper">Roman Uppercase (I, II, III...)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="font-size">Font Size (6-72)</Label>
          <Input
            id="font-size"
            type="number"
            value={params.font_size ?? 12}
            onChange={(e) => onParamsChange({ ...params, font_size: parseInt(e.target.value) || 12 })}
            min={6}
            max={72}
            disabled={disabled}
          />
        </div>

        <p className="text-xs text-slate-500">
          Page numbers will be added to all pages by default
        </p>
      </CardContent>
    </Card>
  );
}

