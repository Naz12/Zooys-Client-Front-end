"use client";

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Crop, 
  Maximize2, 
  Image as ImageIcon, 
  RotateCw,
  X
} from 'lucide-react';

interface ImageEditorProps {
  imageUrl: string;
  onSave: (editedImageUrl: string) => void;
  onCancel: () => void;
  onReplace: (file: File) => void;
}

const ImageEditor: React.FC<ImageEditorProps> = ({
  imageUrl,
  onSave,
  onCancel,
  onReplace
}) => {
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(100);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const applyFilters = useCallback(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = img.width;
      canvas.height = img.height;

      // Apply rotation
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      // Apply scale
      const scaledWidth = (img.width * scale) / 100;
      const scaledHeight = (img.height * scale) / 100;
      const offsetX = (canvas.width - scaledWidth) / 2;
      const offsetY = (canvas.height - scaledHeight) / 2;

      ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
      ctx.restore();

      // Apply filters using CSS filters (for preview)
      const filterString = `
        brightness(${brightness}%)
        contrast(${contrast}%)
        saturate(${saturation}%)
      `;

      // Convert canvas to data URL
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
    };
  }, [imageUrl, brightness, contrast, saturation, rotation, scale, onSave]);

  const handleReplace = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onReplace(file);
    }
  };

  const resetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setRotation(0);
    setScale(100);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Edit Image</h3>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Image Preview */}
      <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
        <img
          src={imageUrl}
          alt="Preview"
          className="max-w-full max-h-64 mx-auto"
          style={{
            filter: `
              brightness(${brightness}%)
              contrast(${contrast}%)
              saturate(${saturation}%)
            `,
            transform: `rotate(${rotation}deg) scale(${scale / 100})`
          }}
        />
      </div>

      <Tabs defaultValue="adjust" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="adjust">Adjust</TabsTrigger>
          <TabsTrigger value="transform">Transform</TabsTrigger>
          <TabsTrigger value="replace">Replace</TabsTrigger>
        </TabsList>

        <TabsContent value="adjust" className="space-y-4">
          <div className="space-y-2">
            <Label>Brightness: {brightness}%</Label>
            <Input
              type="range"
              min="0"
              max="200"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>Contrast: {contrast}%</Label>
            <Input
              type="range"
              min="0"
              max="200"
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>Saturation: {saturation}%</Label>
            <Input
              type="range"
              min="0"
              max="200"
              value={saturation}
              onChange={(e) => setSaturation(Number(e.target.value))}
            />
          </div>

          <Button onClick={resetFilters} variant="outline" className="w-full">
            Reset Filters
          </Button>
        </TabsContent>

        <TabsContent value="transform" className="space-y-4">
          <div className="space-y-2">
            <Label>Rotation: {rotation}°</Label>
            <Input
              type="range"
              min="-180"
              max="180"
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>Scale: {scale}%</Label>
            <Input
              type="range"
              min="25"
              max="200"
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
            />
          </div>
        </TabsContent>

        <TabsContent value="replace" className="space-y-4">
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="w-full"
          >
            <ImageIcon className="h-4 w-4 mr-2" />
            Choose New Image
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleReplace}
            className="hidden"
          />
        </TabsContent>
      </Tabs>

      <div className="flex space-x-2">
        <Button onClick={applyFilters} className="flex-1">
          Apply Changes
        </Button>
        <Button onClick={onCancel} variant="outline" className="flex-1">
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default ImageEditor;

