"use client";

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import type { EditPDFParams } from '@/lib/types/api';
import { FileEdit } from 'lucide-react';

export interface EditPDFFormProps {
  params: EditPDFParams;
  onParamsChange: (params: EditPDFParams) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export function EditPDFForm({ params, onParamsChange, onSubmit, disabled }: EditPDFFormProps) {
  return (
    <Card className="p-4">
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="page-order">Page Order</Label>
          <Select
            value={typeof params.page_order === 'string' && !['as_is', 'reverse'].includes(params.page_order) 
              ? 'custom' 
              : (params.page_order || 'as_is')}
            onValueChange={(value) => {
              if (value === 'custom') {
                onParamsChange({ ...params, page_order: '' });
              } else {
                onParamsChange({ ...params, page_order: value as 'as_is' | 'reverse' });
              }
            }}
            disabled={disabled}
          >
            <SelectTrigger id="page-order">
              <SelectValue placeholder="Select page order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="as_is">As Is (Keep Current Order)</SelectItem>
              <SelectItem value="reverse">Reverse Order</SelectItem>
              <SelectItem value="custom">Custom Order</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(params.page_order === 'custom' || (typeof params.page_order === 'string' && params.page_order && !['as_is', 'reverse'].includes(params.page_order))) && (
          <div className="space-y-2">
            <Label htmlFor="custom-order">Custom Page Order (comma-separated)</Label>
            <Input
              id="custom-order"
              type="text"
              value={typeof params.page_order === 'string' && params.page_order && !['as_is', 'reverse'].includes(params.page_order) ? params.page_order : ''}
              onChange={(e) => onParamsChange({ ...params, page_order: e.target.value })}
              placeholder="e.g., 3,1,2,5"
              disabled={disabled}
            />
            <p className="text-xs text-slate-500">
              Specify page numbers in the order you want (e.g., "3,1,2,5")
            </p>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Checkbox
            id="remove-blank-pages"
            checked={params.remove_blank_pages ?? false}
            onCheckedChange={(checked) => onParamsChange({ ...params, remove_blank_pages: !!checked })}
            disabled={disabled}
          />
          <Label htmlFor="remove-blank-pages" className="text-sm cursor-pointer">
            Remove Blank Pages
          </Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="remove-pages">Remove Pages (comma-separated)</Label>
          <Input
            id="remove-pages"
            type="text"
            value={params.remove_pages || ''}
            onChange={(e) => onParamsChange({ ...params, remove_pages: e.target.value })}
            placeholder="e.g., 1,3,5"
            disabled={disabled}
          />
          <p className="text-xs text-slate-500">
            Specify page numbers to remove (e.g., "1,3,5")
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

