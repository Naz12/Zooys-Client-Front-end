"use client";

import { useState } from 'react';
import { 
  RotateCw, 
  Trash2, 
  Copy, 
  Download, 
  Settings,
  CheckSquare,
  Square,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'react-hot-toast';

interface BatchToolsProps {
  selectedPagesCount: number;
  totalPages: number;
  onBatchRotate: (degrees: number) => void;
  onBatchDelete: () => void;
  onBatchDuplicate: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onSelectRange: (start: number, end: number) => void;
  isLoading?: boolean;
}

export function BatchTools({
  selectedPagesCount,
  totalPages,
  onBatchRotate,
  onBatchDelete,
  onBatchDuplicate,
  onSelectAll,
  onDeselectAll,
  onSelectRange,
  isLoading = false,
}: BatchToolsProps) {
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(totalPages);
  const [showRangeSelector, setShowRangeSelector] = useState(false);

  // Handle range selection
  const handleSelectRange = () => {
    const start = Math.max(1, Math.min(rangeStart, totalPages));
    const end = Math.max(start, Math.min(rangeEnd, totalPages));
    
    if (start > end) {
      toast.error('Start page must be less than or equal to end page');
      return;
    }
    
    onSelectRange(start, end);
    setShowRangeSelector(false);
    toast.success(`Selected pages ${start} to ${end}`);
  };

  // Quick range presets
  const quickRanges = [
    { label: 'First 5 pages', start: 1, end: Math.min(5, totalPages) },
    { label: 'Last 5 pages', start: Math.max(1, totalPages - 4), end: totalPages },
    { label: 'Middle pages', start: Math.max(1, Math.floor(totalPages / 2) - 2), end: Math.min(totalPages, Math.floor(totalPages / 2) + 2) },
  ];

  return (
    <div className="space-y-4">
      {/* Selection Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Settings size={16} />
            Batch Operations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">Selected:</span>
            <Badge variant={selectedPagesCount > 0 ? "default" : "secondary"}>
              {selectedPagesCount} of {totalPages}
            </Badge>
          </div>
          
          {selectedPagesCount > 0 && (
            <div className="text-xs text-orange-600 dark:text-orange-400 flex items-center gap-1">
              <AlertTriangle size={12} />
              {selectedPagesCount} pages selected for batch operations
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selection Tools */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Selection Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onSelectAll}
              disabled={selectedPagesCount === totalPages || isLoading}
              className="flex-1"
            >
              <CheckSquare size={16} className="mr-1" />
              Select All
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onDeselectAll}
              disabled={selectedPagesCount === 0 || isLoading}
              className="flex-1"
            >
              <Square size={16} className="mr-1" />
              Deselect All
            </Button>
          </div>

          {/* Range Selection */}
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRangeSelector(!showRangeSelector)}
              className="w-full"
            >
              Select Range
            </Button>
            
            {showRangeSelector && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded space-y-3">
                <div className="flex items-center gap-2">
                  <Label htmlFor="range-start" className="text-xs">From:</Label>
                  <input
                    id="range-start"
                    type="number"
                    value={rangeStart}
                    onChange={(e) => setRangeStart(parseInt(e.target.value) || 1)}
                    className="w-16 h-6 px-2 text-xs border rounded"
                    min={1}
                    max={totalPages}
                  />
                  
                  <Label htmlFor="range-end" className="text-xs">To:</Label>
                  <input
                    id="range-end"
                    type="number"
                    value={rangeEnd}
                    onChange={(e) => setRangeEnd(parseInt(e.target.value) || totalPages)}
                    className="w-16 h-6 px-2 text-xs border rounded"
                    min={1}
                    max={totalPages}
                  />
                  
                  <Button
                    size="sm"
                    onClick={handleSelectRange}
                    className="h-6 px-2 text-xs"
                  >
                    Apply
                  </Button>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs text-slate-600 dark:text-slate-400">Quick ranges:</p>
                  <div className="flex flex-wrap gap-1">
                    {quickRanges.map((range, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setRangeStart(range.start);
                          setRangeEnd(range.end);
                          onSelectRange(range.start, range.end);
                        }}
                        className="h-6 px-2 text-xs"
                      >
                        {range.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Batch Operations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Batch Operations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Rotate Operations */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Rotate:</p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBatchRotate(90)}
                disabled={selectedPagesCount === 0 || isLoading}
                className="flex-1"
              >
                <RotateCw size={16} className="mr-1" />
                90°
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBatchRotate(180)}
                disabled={selectedPagesCount === 0 || isLoading}
                className="flex-1"
              >
                <RotateCw size={16} className="mr-1" />
                180°
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBatchRotate(270)}
                disabled={selectedPagesCount === 0 || isLoading}
                className="flex-1"
              >
                <RotateCw size={16} className="mr-1" />
                270°
              </Button>
            </div>
          </div>

          <Separator />

          {/* Other Operations */}
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onBatchDuplicate}
              disabled={selectedPagesCount === 0 || isLoading}
              className="w-full justify-start"
            >
              <Copy size={16} className="mr-2" />
              Duplicate Selected ({selectedPagesCount})
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full justify-start"
                  disabled={selectedPagesCount === 0 || isLoading}
                >
                  <Trash2 size={16} className="mr-2" />
                  Delete Selected ({selectedPagesCount})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Pages</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {selectedPagesCount} page{selectedPagesCount !== 1 ? 's' : ''}? 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onBatchDelete}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete Pages
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Batch Export */}
      {selectedPagesCount > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Export Selected</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              disabled={isLoading}
            >
              <Download size={16} className="mr-2" />
              Export Selected Pages ({selectedPagesCount})
            </Button>
            <p className="text-xs text-slate-500 mt-2">
              Export only the selected pages as a new PDF
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tips */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
          <p>• Use range selection for consecutive pages</p>
          <p>• Batch operations apply to all selected pages</p>
          <p>• Use Ctrl+A to select all pages quickly</p>
          <p>• Click individual page checkboxes for precise selection</p>
        </CardContent>
      </Card>
    </div>
  );
}


