"use client";

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import type { UnlockParams } from '@/lib/types/api';
import { Unlock } from 'lucide-react';

export interface UnlockFormProps {
  params: UnlockParams;
  onParamsChange: (params: UnlockParams) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export function UnlockForm({ params, onParamsChange, onSubmit, disabled }: UnlockFormProps) {
  return (
    <Card className="p-4">
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">PDF Password</Label>
          <Input
            id="password"
            type="password"
            value={params.password || ''}
            onChange={(e) => onParamsChange({ ...params, password: e.target.value })}
            placeholder="Enter PDF password to unlock"
            disabled={disabled}
          />
          <p className="text-xs text-slate-500">
            Enter the password that protects this PDF
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

