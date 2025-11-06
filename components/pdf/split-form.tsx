"use client";

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import type { SplitParams } from '@/lib/types/api';

export interface SplitFormProps {
  params: SplitParams;
  onParamsChange: (params: SplitParams) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export function SplitForm({
  params,
  onParamsChange,
  onSubmit,
  disabled = false,
}: SplitFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="split-points">
          Split Points (comma-separated page numbers)
        </Label>
        <Input
          id="split-points"
          value={params.split_points}
          onChange={(e) =>
            onParamsChange({ ...params, split_points: e.target.value })
          }
          placeholder="e.g., 1,3,5"
          disabled={disabled}
        />
        <p className="text-xs text-slate-500">
          Enter page numbers where PDF should be split (e.g., "1,3,5" splits after pages 1, 3, and 5)
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title-prefix">Title Prefix (optional)</Label>
        <Input
          id="title-prefix"
          value={params.title_prefix || ''}
          onChange={(e) =>
            onParamsChange({ ...params, title_prefix: e.target.value })
          }
          placeholder="Chapter"
          disabled={disabled}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="author">Author (optional)</Label>
        <Input
          id="author"
          value={params.author || ''}
          onChange={(e) =>
            onParamsChange({ ...params, author: e.target.value })
          }
          placeholder="Author Name"
          disabled={disabled}
        />
      </div>
    </div>
  );
}

