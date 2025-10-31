"use client";

import { useState, useEffect } from 'react';
import { HelpCircle, Keyboard, Mouse, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Delete, RotateCw, Copy, Undo, Redo, Download, ZoomIn, ZoomOut, Maximize2, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface KeyboardShortcutsProps {
  onClose?: () => void;
}

interface Shortcut {
  keys: string[];
  description: string;
  category: 'navigation' | 'selection' | 'editing' | 'view' | 'export';
  icon?: React.ReactNode;
}

export function KeyboardShortcutsModal({ onClose }: KeyboardShortcutsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts: Shortcut[] = [
    // Navigation
    { keys: ['←', '→'], description: 'Navigate between pages', category: 'navigation', icon: <ArrowLeft size={16} /> },
    { keys: ['Page Up', 'Page Down'], description: 'Jump to previous/next page', category: 'navigation' },
    { keys: ['Home'], description: 'Go to first page', category: 'navigation' },
    { keys: ['End'], description: 'Go to last page', category: 'navigation' },
    
    // Selection
    { keys: ['Ctrl', 'A'], description: 'Select all pages', category: 'selection', icon: <CheckSquare size={16} /> },
    { keys: ['Escape'], description: 'Deselect all pages', category: 'selection', icon: <Square size={16} /> },
    { keys: ['Shift', 'Click'], description: 'Select range of pages', category: 'selection' },
    { keys: ['Ctrl', 'Click'], description: 'Toggle page selection', category: 'selection' },
    
    // Editing
    { keys: ['Delete'], description: 'Delete selected pages', category: 'editing', icon: <Delete size={16} /> },
    { keys: ['Ctrl', 'Z'], description: 'Undo last operation', category: 'editing', icon: <Undo size={16} /> },
    { keys: ['Ctrl', 'Y'], description: 'Redo last operation', category: 'editing', icon: <Redo size={16} /> },
    { keys: ['Ctrl', 'D'], description: 'Duplicate selected pages', category: 'editing', icon: <Copy size={16} /> },
    { keys: ['R'], description: 'Rotate selected pages 90°', category: 'editing', icon: <RotateCw size={16} /> },
    
    // View
    { keys: ['+', '='], description: 'Zoom in', category: 'view', icon: <ZoomIn size={16} /> },
    { keys: ['-'], description: 'Zoom out', category: 'view', icon: <ZoomOut size={16} /> },
    { keys: ['0'], description: 'Reset zoom to fit', category: 'view' },
    { keys: ['F11'], description: 'Toggle fullscreen', category: 'view', icon: <Maximize2 size={16} /> },
    { keys: ['Space'], description: 'Toggle page thumbnails', category: 'view' },
    
    // Export
    { keys: ['Ctrl', 'S'], description: 'Export PDF', category: 'export', icon: <Download size={16} /> },
    { keys: ['Ctrl', 'Shift', 'S'], description: 'Advanced export options', category: 'export' },
  ];

  const categories = {
    navigation: { label: 'Navigation', icon: <ArrowUp size={16} /> },
    selection: { label: 'Selection', icon: <CheckSquare size={16} /> },
    editing: { label: 'Editing', icon: <RotateCw size={16} /> },
    view: { label: 'View', icon: <ZoomIn size={16} /> },
    export: { label: 'Export', icon: <Download size={16} /> },
  };

  // Handle keyboard shortcuts for the modal itself
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const renderKey = (key: string) => {
    const keyMap: { [key: string]: string } = {
      'Ctrl': '⌘',
      'Shift': '⇧',
      'Alt': '⌥',
      'Delete': '⌫',
      'Escape': '⎋',
      'Space': '␣',
      'Enter': '↵',
      'Tab': '⇥',
      'ArrowUp': '↑',
      'ArrowDown': '↓',
      'ArrowLeft': '←',
      'ArrowRight': '→',
      'Page Up': '⇞',
      'Page Down': '⇟',
      'Home': '⇱',
      'End': '⇲',
      'F11': 'F11',
    };

    return keyMap[key] || key;
  };

  const renderShortcut = (keys: string[]) => {
    return (
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <span key={index}>
            <kbd className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 rounded border border-slate-300 dark:border-slate-600">
              {renderKey(key)}
            </kbd>
            {index < keys.length - 1 && <span className="text-slate-400 mx-1">+</span>}
          </span>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <HelpCircle size={16} className="mr-1" />
          Keyboard Shortcuts
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard size={20} />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Learn all the keyboard shortcuts available in the PDF Editor
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">All</TabsTrigger>
            {Object.entries(categories).map(([key, category]) => (
              <TabsTrigger key={key} value={key} className="flex items-center gap-1">
                {category.icon}
                <span className="hidden sm:inline">{category.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* All Shortcuts */}
          <TabsContent value="all" className="space-y-4">
            {Object.entries(categories).map(([categoryKey, category]) => {
              const categoryShortcuts = shortcuts.filter(s => s.category === categoryKey);
              
              return (
                <Card key={categoryKey}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      {category.icon}
                      {category.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {categoryShortcuts.map((shortcut, index) => (
                      <div key={index} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          {shortcut.icon && (
                            <div className="text-slate-500">
                              {shortcut.icon}
                            </div>
                          )}
                          <span className="text-sm">{shortcut.description}</span>
                        </div>
                        {renderShortcut(shortcut.keys)}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Individual Category Tabs */}
          {Object.entries(categories).map(([categoryKey, category]) => {
            const categoryShortcuts = shortcuts.filter(s => s.category === categoryKey);
            
            return (
              <TabsContent key={categoryKey} value={categoryKey} className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {category.icon}
                      {category.label} Shortcuts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {categoryShortcuts.map((shortcut, index) => (
                      <div key={index} className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          {shortcut.icon && (
                            <div className="text-slate-500">
                              {shortcut.icon}
                            </div>
                          )}
                          <span className="text-sm">{shortcut.description}</span>
                        </div>
                        {renderShortcut(shortcut.keys)}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Tips */}
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Mouse size={16} />
              Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <p>• Most shortcuts work when the PDF canvas is focused</p>
            <p>• Use Tab to navigate between UI elements</p>
            <p>• Press Escape to close dialogs or deselect pages</p>
            <p>• Hold Shift while clicking to select page ranges</p>
            <p>• Use Ctrl+Click to toggle individual page selection</p>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


