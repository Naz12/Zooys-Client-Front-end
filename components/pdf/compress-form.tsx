"use client";

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { CompressParams } from '@/lib/types/api';

export interface CompressFormProps {
  params: CompressParams;
  onParamsChange: (params: CompressParams) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function CompressForm({
  params,
  onParamsChange,
  disabled = false,
}: CompressFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Compression Level</Label>
        <Select
          value={params.compression_level}
          onValueChange={(value: 'low' | 'medium' | 'high') =>
            onParamsChange({ ...params, compression_level: value })
          }
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low (Better Quality)</SelectItem>
            <SelectItem value="medium">Medium (Balanced)</SelectItem>
            <SelectItem value="high">High (Smaller File)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="quality">Quality (50-100)</Label>
        <Input
          id="quality"
          type="number"
          value={params.quality || 85}
          onChange={(e) =>
            onParamsChange({ ...params, quality: parseInt(e.target.value) || 85 })
          }
          min={50}
          max={100}
          disabled={disabled}
        />
        <p className="text-xs text-slate-500">
          Higher quality results in larger file size (50-100)
        </p>
      </div>
    </div>
  );
}

