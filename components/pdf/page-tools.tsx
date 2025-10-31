"use client";

import { useState } from 'react';
import { 
  Trash2, 
  RotateCw, 
  Copy, 
  Undo, 
  Redo, 
  Download, 
  Save,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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

interface PageToolsProps {
  selectedPagesCount: number;
  totalPages: number;
  modificationsCount: number;
  canUndo: boolean;
  canRedo: boolean;
  onDeleteSelected: () => void;
  onRotateSelected: (degrees: number) => void;
  onDuplicateSelected: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => Promise<void>;
  onSave?: () => Promise<void>;
  isLoading?: boolean;
}

export function PageTools({
  selectedPagesCount,
  totalPages,
  modificationsCount,
  canUndo,
  canRedo,
  onDeleteSelected,
  onRotateSelected,
  onDuplicateSelected,
  onUndo,
  onRedo,
  onExport,
  onSave,
  isLoading = false,
}: PageToolsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Handle export with loading state
  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport();
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export PDF');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle save with loading state
  const handleSave = async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      await onSave();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save PDF');
    } finally {
      setIsSaving(false);
    }
  };

  // Get status badge
  const getStatusBadge = () => {
    if (modificationsCount === 0) {
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          <CheckCircle size={12} className="mr-1" />
          No changes
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="text-orange-600 border-orange-600">
        <AlertTriangle size={12} className="mr-1" />
        {modificationsCount} change{modificationsCount !== 1 ? 's' : ''}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      {/* Status Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Document Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">Pages:</span>
            <Badge variant="secondary">{totalPages}</Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">Selected:</span>
            <Badge variant={selectedPagesCount > 0 ? "default" : "secondary"}>
              {selectedPagesCount}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">Status:</span>
            {getStatusBadge()}
          </div>
        </CardContent>
      </Card>

      {/* Page Operations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Page Operations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Delete */}
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
                  onClick={onDeleteSelected}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete Pages
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Rotate */}
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => onRotateSelected(90)}
              disabled={selectedPagesCount === 0 || isLoading}
            >
              <RotateCw size={16} className="mr-2" />
              Rotate 90° ({selectedPagesCount})
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => onRotateSelected(180)}
              disabled={selectedPagesCount === 0 || isLoading}
            >
              <RotateCw size={16} className="mr-2" />
              Rotate 180° ({selectedPagesCount})
            </Button>
          </div>

          {/* Duplicate */}
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={onDuplicateSelected}
            disabled={selectedPagesCount === 0 || isLoading}
          >
            <Copy size={16} className="mr-2" />
            Duplicate ({selectedPagesCount})
          </Button>
        </CardContent>
      </Card>

      {/* History Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onUndo}
              disabled={!canUndo || isLoading}
            >
              <Undo size={16} className="mr-1" />
              Undo
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onRedo}
              disabled={!canRedo || isLoading}
            >
              <Redo size={16} className="mr-1" />
              Redo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export & Save */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Export & Save</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            onClick={handleExport}
            disabled={isExporting || isLoading || totalPages === 0}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            size="sm"
          >
            <Download size={16} className="mr-2" />
            {isExporting ? 'Exporting...' : 'Download PDF'}
          </Button>
          
          {onSave && (
            <Button
              onClick={handleSave}
              disabled={isSaving || isLoading || modificationsCount === 0}
              variant="outline"
              className="w-full"
              size="sm"
            >
              <Save size={16} className="mr-2" />
              {isSaving ? 'Saving...' : 'Save to Account'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Keyboard Shortcuts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex justify-between">
            <span>Delete selected:</span>
            <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">Del</kbd>
          </div>
          <div className="flex justify-between">
            <span>Select all:</span>
            <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">Ctrl+A</kbd>
          </div>
          <div className="flex justify-between">
            <span>Undo:</span>
            <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">Ctrl+Z</kbd>
          </div>
          <div className="flex justify-between">
            <span>Redo:</span>
            <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-700 rounded">Ctrl+Y</kbd>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


