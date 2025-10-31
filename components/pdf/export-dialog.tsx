"use client";

import { useState } from 'react';
import { Download, Settings, Lock, FileText, Image, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ExportDialogProps {
  onExport: (options: ExportOptions) => Promise<void>;
  isLoading?: boolean;
  totalPages: number;
  selectedPagesCount: number;
}

interface ExportOptions {
  compression: 'high' | 'medium' | 'low';
  quality: number;
  password?: string;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
  };
  pageSize: 'original' | 'a4' | 'letter' | 'legal';
  orientation: 'portrait' | 'landscape';
  includeSelectedOnly: boolean;
  pdfACompliance: boolean;
}

export function ExportDialog({ onExport, isLoading = false, totalPages, selectedPagesCount }: ExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    compression: 'medium',
    quality: 80,
    metadata: {
      title: '',
      author: '',
      subject: '',
      keywords: [],
    },
    pageSize: 'original',
    orientation: 'portrait',
    includeSelectedOnly: false,
    pdfACompliance: false,
  });

  const [keywordsInput, setKeywordsInput] = useState('');

  // Handle export
  const handleExport = async () => {
    try {
      // Parse keywords
      const keywords = keywordsInput
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      const exportOptions = {
        ...options,
        metadata: {
          ...options.metadata,
          keywords,
        },
      };

      await onExport(exportOptions);
      setIsOpen(false);
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  // Update options
  const updateOption = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  // Update metadata
  const updateMetadata = <K extends keyof ExportOptions['metadata']>(key: K, value: ExportOptions['metadata'][K]) => {
    setOptions(prev => ({
      ...prev,
      metadata: { ...prev.metadata, [key]: value }
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          disabled={isLoading}
        >
          <Settings size={16} className="mr-2" />
          Advanced Export Options
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download size={20} />
            Advanced Export Options
          </DialogTitle>
          <DialogDescription>
            Configure compression, security, metadata, and other export settings
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="compression">Compression</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Page Selection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="selected-only"
                    checked={options.includeSelectedOnly}
                    onCheckedChange={(checked) => updateOption('includeSelectedOnly', !!checked)}
                  />
                  <Label htmlFor="selected-only" className="text-sm">
                    Export only selected pages ({selectedPagesCount} of {totalPages})
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pdfa-compliance"
                    checked={options.pdfACompliance}
                    onCheckedChange={(checked) => updateOption('pdfACompliance', !!checked)}
                  />
                  <Label htmlFor="pdfa-compliance" className="text-sm">
                    PDF/A compliance (archival standard)
                  </Label>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Page Size & Orientation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="page-size" className="text-sm">Page Size</Label>
                    <Select
                      value={options.pageSize}
                      onValueChange={(value: any) => updateOption('pageSize', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="original">Original</SelectItem>
                        <SelectItem value="a4">A4</SelectItem>
                        <SelectItem value="letter">Letter</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="orientation" className="text-sm">Orientation</Label>
                    <Select
                      value={options.orientation}
                      onValueChange={(value: any) => updateOption('orientation', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="portrait">Portrait</SelectItem>
                        <SelectItem value="landscape">Landscape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Compression Settings */}
          <TabsContent value="compression" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Compression Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm">Compression Level</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {[
                      { value: 'high', label: 'High', description: 'Smaller file, lower quality' },
                      { value: 'medium', label: 'Medium', description: 'Balanced size/quality' },
                      { value: 'low', label: 'Low', description: 'Larger file, higher quality' },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        variant={options.compression === option.value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateOption('compression', option.value as any)}
                        className="h-auto p-3 flex flex-col items-start"
                      >
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs opacity-70">{option.description}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="quality" className="text-sm">
                    Image Quality: {options.quality}%
                  </Label>
                  <input
                    id="quality"
                    type="range"
                    min="10"
                    max="100"
                    step="10"
                    value={options.quality}
                    onChange={(e) => updateOption('quality', parseInt(e.target.value))}
                    className="w-full mt-2"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>Lower quality</span>
                    <span>Higher quality</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield size={16} />
                  Security Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="password" className="text-sm">Password Protection</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password (optional)"
                    value={options.password || ''}
                    onChange={(e) => updateOption('password', e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Leave empty for no password protection
                  </p>
                </div>

                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-start gap-2">
                    <Lock size={16} className="text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        Password Protection
                      </p>
                      <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                        If you set a password, users will need it to open the PDF. 
                        Make sure to remember or save the password securely.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Metadata Settings */}
          <TabsContent value="metadata" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText size={16} />
                  Document Metadata
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-sm">Title</Label>
                  <Input
                    id="title"
                    placeholder="Document title"
                    value={options.metadata.title || ''}
                    onChange={(e) => updateMetadata('title', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="author" className="text-sm">Author</Label>
                  <Input
                    id="author"
                    placeholder="Document author"
                    value={options.metadata.author || ''}
                    onChange={(e) => updateMetadata('author', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="subject" className="text-sm">Subject</Label>
                  <Textarea
                    id="subject"
                    placeholder="Document subject or description"
                    value={options.metadata.subject || ''}
                    onChange={(e) => updateMetadata('subject', e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="keywords" className="text-sm">Keywords</Label>
                  <Input
                    id="keywords"
                    placeholder="keyword1, keyword2, keyword3"
                    value={keywordsInput}
                    onChange={(e) => setKeywordsInput(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Separate keywords with commas
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Download size={16} className="mr-2" />
            {isLoading ? 'Exporting...' : 'Export PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


