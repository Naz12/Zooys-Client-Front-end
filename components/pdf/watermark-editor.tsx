"use client";

import { useState, useCallback } from 'react';
import { 
  Type, 
  Image, 
  Upload, 
  Eye, 
  EyeOff, 
  RotateCw, 
  Move, 
  Palette,
  Settings,
  Download,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'react-hot-toast';

interface WatermarkEditorProps {
  onApplyWatermark: (watermark: WatermarkConfig) => Promise<void>;
  onRemoveWatermark: () => Promise<void>;
  isLoading?: boolean;
  hasWatermark?: boolean;
}

interface WatermarkConfig {
  type: 'text' | 'image';
  content: string; // Text content or image URL
  position: {
    x: number; // Percentage from left (0-100)
    y: number; // Percentage from top (0-100)
  };
  size: {
    width: number; // Percentage of page width
    height: number; // Percentage of page height
  };
  rotation: number; // Degrees
  opacity: number; // 0-100
  color?: string; // For text watermarks
  fontFamily?: string;
  fontSize?: number;
  applyToAllPages: boolean;
  selectedPages?: number[]; // If not applying to all pages
}

export function WatermarkEditor({ 
  onApplyWatermark, 
  onRemoveWatermark, 
  isLoading = false,
  hasWatermark = false 
}: WatermarkEditorProps) {
  const [watermark, setWatermark] = useState<WatermarkConfig>({
    type: 'text',
    content: 'DRAFT',
    position: { x: 50, y: 50 },
    size: { width: 30, height: 10 },
    rotation: -45,
    opacity: 30,
    color: '#000000',
    fontFamily: 'Arial',
    fontSize: 48,
    applyToAllPages: true,
  });

  const [previewMode, setPreviewMode] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Update watermark property
  const updateWatermark = <K extends keyof WatermarkConfig>(key: K, value: WatermarkConfig[K]) => {
    setWatermark(prev => ({ ...prev, [key]: value }));
  };

  // Update nested properties
  const updatePosition = (key: 'x' | 'y', value: number) => {
    setWatermark(prev => ({
      ...prev,
      position: { ...prev.position, [key]: value }
    }));
  };

  const updateSize = (key: 'width' | 'height', value: number) => {
    setWatermark(prev => ({
      ...prev,
      size: { ...prev.size, [key]: value }
    }));
  };

  // Handle image upload
  const handleImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file is too large (max 5MB)');
      return;
    }

    setImageFile(file);
    
    // Create object URL for preview
    const imageUrl = URL.createObjectURL(file);
    updateWatermark('content', imageUrl);
    updateWatermark('type', 'image');
    
    toast.success('Image uploaded successfully');
  }, []);

  // Apply watermark
  const handleApplyWatermark = useCallback(async () => {
    try {
      await onApplyWatermark(watermark);
      toast.success('Watermark applied successfully');
    } catch (error) {
      console.error('Error applying watermark:', error);
      toast.error('Failed to apply watermark');
    }
  }, [watermark, onApplyWatermark]);

  // Remove watermark
  const handleRemoveWatermark = useCallback(async () => {
    try {
      await onRemoveWatermark();
      toast.success('Watermark removed successfully');
    } catch (error) {
      console.error('Error removing watermark:', error);
      toast.error('Failed to remove watermark');
    }
  }, [onRemoveWatermark]);

  // Quick position presets
  const positionPresets = [
    { label: 'Center', x: 50, y: 50 },
    { label: 'Top Left', x: 10, y: 10 },
    { label: 'Top Right', x: 90, y: 10 },
    { label: 'Bottom Left', x: 10, y: 90 },
    { label: 'Bottom Right', x: 90, y: 90 },
  ];

  // Quick rotation presets
  const rotationPresets = [
    { label: 'Horizontal', value: 0 },
    { label: 'Diagonal', value: -45 },
    { label: 'Vertical', value: -90 },
    { label: 'Reverse Diagonal', value: 45 },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Settings size={16} />
            Watermark Editor
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewMode(!previewMode)}
              >
                {previewMode ? <EyeOff size={16} /> : <Eye size={16} />}
                <span className="ml-1">{previewMode ? 'Hide' : 'Show'} Preview</span>
              </Button>
            </div>
            
            <div className="flex gap-2">
              {hasWatermark && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRemoveWatermark}
                  disabled={isLoading}
                  className="text-red-600 hover:text-red-700"
                >
                  <X size={16} className="mr-1" />
                  Remove
                </Button>
              )}
              
              <Button
                onClick={handleApplyWatermark}
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700"
                size="sm"
              >
                <Download size={16} className="mr-1" />
                Apply Watermark
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Watermark Configuration */}
      <Tabs value={watermark.type} onValueChange={(value) => updateWatermark('type', value as 'text' | 'image')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text" className="flex items-center gap-2">
            <Type size={16} />
            Text Watermark
          </TabsTrigger>
          <TabsTrigger value="image" className="flex items-center gap-2">
            <Image size={16} />
            Image Watermark
          </TabsTrigger>
        </TabsList>

        {/* Text Watermark */}
        <TabsContent value="text" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Text Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="watermark-text" className="text-sm">Watermark Text</Label>
                <Input
                  id="watermark-text"
                  value={watermark.content}
                  onChange={(e) => updateWatermark('content', e.target.value)}
                  placeholder="Enter watermark text"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="font-family" className="text-sm">Font Family</Label>
                  <Select
                    value={watermark.fontFamily}
                    onValueChange={(value) => updateWatermark('fontFamily', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                      <SelectItem value="Courier New">Courier New</SelectItem>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="font-size" className="text-sm">Font Size</Label>
                  <Input
                    id="font-size"
                    type="number"
                    value={watermark.fontSize}
                    onChange={(e) => updateWatermark('fontSize', parseInt(e.target.value) || 48)}
                    className="mt-1"
                    min="8"
                    max="200"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="text-color" className="text-sm">Text Color</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    id="text-color"
                    type="color"
                    value={watermark.color}
                    onChange={(e) => updateWatermark('color', e.target.value)}
                    className="w-12 h-8 border rounded cursor-pointer"
                  />
                  <Input
                    value={watermark.color}
                    onChange={(e) => updateWatermark('color', e.target.value)}
                    className="flex-1"
                    placeholder="#000000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Image Watermark */}
        <TabsContent value="image" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Image Upload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                <Upload size={32} className="mx-auto text-slate-400 mb-2" />
                <Label htmlFor="watermark-image" className="cursor-pointer">
                  <span className="text-sm font-medium">Upload Image</span>
                </Label>
                <Input
                  id="watermark-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <p className="text-xs text-slate-500 mt-1">
                  PNG, JPG, GIF up to 5MB
                </p>
              </div>

              {imageFile && (
                <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded">
                  <Image size={16} className="text-slate-500" />
                  <span className="text-sm flex-1">{imageFile.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {(imageFile.size / 1024 / 1024).toFixed(1)} MB
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Position & Size */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Move size={16} />
            Position & Size
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Position Presets */}
          <div>
            <Label className="text-sm">Quick Position</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {positionPresets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    updatePosition('x', preset.x);
                    updatePosition('y', preset.y);
                  }}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Position Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Horizontal Position: {watermark.position.x}%</Label>
              <Slider
                value={[watermark.position.x]}
                onValueChange={([value]) => updatePosition('x', value)}
                max={100}
                step={1}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label className="text-sm">Vertical Position: {watermark.position.y}%</Label>
              <Slider
                value={[watermark.position.y]}
                onValueChange={([value]) => updatePosition('y', value)}
                max={100}
                step={1}
                className="mt-2"
              />
            </div>
          </div>

          {/* Size Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Width: {watermark.size.width}%</Label>
              <Slider
                value={[watermark.size.width]}
                onValueChange={([value]) => updateSize('width', value)}
                max={100}
                step={1}
                className="mt-2"
              />
            </div>
            
            <div>
              <Label className="text-sm">Height: {watermark.size.height}%</Label>
              <Slider
                value={[watermark.size.height]}
                onValueChange={([value]) => updateSize('height', value)}
                max={100}
                step={1}
                className="mt-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Palette size={16} />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Rotation */}
          <div>
            <Label className="text-sm">Rotation: {watermark.rotation}°</Label>
            <div className="flex items-center gap-2 mt-2">
              <Slider
                value={[watermark.rotation]}
                onValueChange={([value]) => updateWatermark('rotation', value)}
                min={-180}
                max={180}
                step={1}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateWatermark('rotation', 0)}
              >
                <RotateCw size={16} />
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {rotationPresets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => updateWatermark('rotation', preset.value)}
                  className="text-xs"
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Opacity */}
          <div>
            <Label className="text-sm">Opacity: {watermark.opacity}%</Label>
            <Slider
              value={[watermark.opacity]}
              onValueChange={([value]) => updateWatermark('opacity', value)}
              max={100}
              step={1}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Page Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Page Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="apply-all-pages"
              checked={watermark.applyToAllPages}
              onCheckedChange={(checked) => updateWatermark('applyToAllPages', !!checked)}
            />
            <Label htmlFor="apply-all-pages" className="text-sm">
              Apply to all pages
            </Label>
          </div>
          
          {!watermark.applyToAllPages && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Select specific pages in the thumbnail panel to apply watermark only to those pages.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      {previewMode && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative w-full h-64 bg-slate-100 dark:bg-slate-800 rounded border-2 border-dashed border-slate-300 dark:border-slate-600">
              <div
                className="absolute"
                style={{
                  left: `${watermark.position.x}%`,
                  top: `${watermark.position.y}%`,
                  width: `${watermark.size.width}%`,
                  height: `${watermark.size.height}%`,
                  transform: `rotate(${watermark.rotation}deg)`,
                  opacity: watermark.opacity / 100,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {watermark.type === 'text' ? (
                  <span
                    style={{
                      fontFamily: watermark.fontFamily,
                      fontSize: `${watermark.fontSize}px`,
                      color: watermark.color,
                      fontWeight: 'bold',
                    }}
                  >
                    {watermark.content}
                  </span>
                ) : (
                  <img
                    src={watermark.content}
                    alt="Watermark preview"
                    className="max-w-full max-h-full object-contain"
                  />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


