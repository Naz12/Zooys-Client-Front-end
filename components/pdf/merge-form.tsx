"use client";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
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

  return (
    <div className="space-y-4">
      {/* File Selection */}
      <div className="space-y-2">
        <Label>Select Files to Merge (min 2)</Label>
        <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
          {files.map((file) => (
            <div key={file.file_id} className="flex items-center gap-2">
              <Checkbox
                checked={selectedFileIds.includes(file.file_id)}
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

