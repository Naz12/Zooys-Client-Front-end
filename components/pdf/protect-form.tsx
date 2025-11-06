"use client";

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import type { ProtectParams } from '@/lib/types/api';
import { Lock } from 'lucide-react';

export interface ProtectFormProps {
  params: ProtectParams;
  onParamsChange: (params: ProtectParams) => void;
  onSubmit: () => void;
  disabled: boolean;
}

export function ProtectForm({ params, onParamsChange, onSubmit, disabled }: ProtectFormProps) {
  const togglePermission = (permission: 'print' | 'copy' | 'modify') => {
    const current = params.permissions || [];
    const newPermissions = current.includes(permission)
      ? current.filter(p => p !== permission)
      : [...current, permission];
    onParamsChange({ ...params, permissions: newPermissions });
  };

  return (
    <Card className="p-4">
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={params.password || ''}
            onChange={(e) => onParamsChange({ ...params, password: e.target.value })}
            placeholder="Enter password"
            disabled={disabled}
          />
          <p className="text-xs text-slate-500">
            Password will be required to open the PDF
          </p>
        </div>

        <div className="space-y-2">
          <Label>Permissions</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="permission-print"
                checked={params.permissions?.includes('print') ?? false}
                onCheckedChange={() => togglePermission('print')}
                disabled={disabled}
              />
              <Label htmlFor="permission-print" className="text-sm cursor-pointer">
                Allow Printing
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="permission-copy"
                checked={params.permissions?.includes('copy') ?? false}
                onCheckedChange={() => togglePermission('copy')}
                disabled={disabled}
              />
              <Label htmlFor="permission-copy" className="text-sm cursor-pointer">
                Allow Copying
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="permission-modify"
                checked={params.permissions?.includes('modify') ?? false}
                onCheckedChange={() => togglePermission('modify')}
                disabled={disabled}
              />
              <Label htmlFor="permission-modify" className="text-sm cursor-pointer">
                Allow Modifying
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

