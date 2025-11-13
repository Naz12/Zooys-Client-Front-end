"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  Save, 
  Plus, 
  Trash2, 
  Edit3, 
  Image, 
  Type, 
  Square, 
  Circle,
  Triangle,
  ArrowRight,
  ArrowLeft,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Upload
} from 'lucide-react';
import { useNotifications } from '@/lib/notifications';
import { PresentationOutline, Slide } from '@/lib/presentation-workflow-context';
import { presentationApi } from '@/lib/presentation-api-client';
import { debounce } from 'lodash';

interface PowerPointEditorProps {
  fileId: number;
  initialOutline: PresentationOutline;
  selectedTemplate?: string;
  onSave?: (content: { title: string; slides: Array<{ title: string; content: string; slide_type: string; order: number }> }) => void;
  onDownload?: () => void;
}

interface EditorSlide extends Slide {
  id: string;
  elements: EditorElement[];
}

interface EditorElement {
  id: string;
  type: 'text' | 'image' | 'shape';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  style: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    align?: 'left' | 'center' | 'right';
  };
}

const PowerPointEditor: React.FC<PowerPointEditorProps> = ({
  fileId,
  initialOutline,
  selectedTemplate = 'corporate_blue',
  onSave,
  onDownload
}) => {
  const { showSuccess, showError } = useNotifications();
  const [slides, setSlides] = useState<EditorSlide[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [presentationTitle, setPresentationTitle] = useState(initialOutline.title);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize slides from outline
  useEffect(() => {
    const editorSlides: EditorSlide[] = initialOutline.slides.map((slide, index) => ({
      ...slide,
      id: `slide-${index}`,
      elements: [
        {
          id: `element-${index}-0`,
          type: 'text',
          x: 50,
          y: 50,
          width: 600,
          height: 100,
          content: slide.title,
          style: {
            fontSize: 32,
            fontFamily: 'Arial',
            color: '#000000',
            bold: true,
            align: 'center'
          }
        },
        {
          id: `element-${index}-1`,
          type: 'text',
          x: 50,
          y: 200,
          width: 600,
          height: 300,
          content: slide.content,
          style: {
            fontSize: 16,
            fontFamily: 'Arial',
            color: '#333333',
            align: 'left'
          }
        }
      ]
    }));
    setSlides(editorSlides);
  }, [initialOutline]);

  const currentSlide = slides[currentSlideIndex];

  // Auto-save functionality
  // Note: Auto-save now just updates local state. Use Save button to save PPT file to backend.
  const autoSave = useCallback(
    debounce(async (presentationData: any) => {
      // Auto-save is now handled by the save button which generates and saves the PPT file
      // This function is kept for backward compatibility but doesn't save to backend
      console.log('Auto-save triggered (use Save button to save to backend):', presentationData);
    }, 2000),
    [fileId]
  );

  const addSlide = () => {
    const newSlide: EditorSlide = {
      id: `slide-${slides.length}`,
      title: `New Slide ${slides.length + 1}`,
      content: 'Add your content here...',
      slide_type: 'content',
      order: slides.length,
      elements: [
        {
          id: `element-${slides.length}-0`,
          type: 'text',
          x: 50,
          y: 50,
          width: 600,
          height: 100,
          content: `New Slide ${slides.length + 1}`,
          style: {
            fontSize: 32,
            fontFamily: 'Arial',
            color: '#000000',
            bold: true,
            align: 'center'
          }
        }
      ]
    };
    setSlides([...slides, newSlide]);
    setCurrentSlideIndex(slides.length);
  };

  const deleteSlide = (slideIndex: number) => {
    if (slides.length <= 1) {
      showError('Cannot delete the last slide');
      return;
    }
    
    const newSlides = slides.filter((_, index) => index !== slideIndex);
    setSlides(newSlides);
    
    if (currentSlideIndex >= newSlides.length) {
      setCurrentSlideIndex(newSlides.length - 1);
    }
  };

  const addTextElement = () => {
    if (!currentSlide) return;
    
    const newElement: EditorElement = {
      id: `element-${Date.now()}`,
      type: 'text',
      x: 100,
      y: 100,
      width: 200,
      height: 50,
      content: 'New Text',
      style: {
        fontSize: 16,
        fontFamily: 'Arial',
        color: '#000000',
        align: 'left'
      }
    };
    
    const updatedSlides = [...slides];
    updatedSlides[currentSlideIndex].elements.push(newElement);
    setSlides(updatedSlides);
  };

  const addShapeElement = (shapeType: 'square' | 'circle' | 'triangle') => {
    if (!currentSlide) return;
    
    const newElement: EditorElement = {
      id: `element-${Date.now()}`,
      type: 'shape',
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      content: shapeType,
      style: {
        backgroundColor: '#007bff',
        color: '#ffffff'
      }
    };
    
    const updatedSlides = [...slides];
    updatedSlides[currentSlideIndex].elements.push(newElement);
    setSlides(updatedSlides);
  };

  const updateElement = (elementId: string, updates: Partial<EditorElement>) => {
    const updatedSlides = slides.map(slide => ({
      ...slide,
      elements: slide.elements.map(element =>
        element.id === elementId ? { ...element, ...updates } : element
      )
    }));
    setSlides(updatedSlides);
    
    // Trigger auto-save
    const presentationData = {
      title: presentationTitle,
      slides: updatedSlides,
      template: selectedTemplate,
      color_scheme: selectedTemplate === 'corporate_blue' ? 'blue' : 
                   selectedTemplate === 'modern_white' ? 'white' :
                   selectedTemplate === 'creative_colorful' ? 'colorful' :
                   selectedTemplate === 'minimalist_gray' ? 'gray' :
                   selectedTemplate === 'academic_formal' ? 'dark' :
                   selectedTemplate === 'tech_modern' ? 'teal' :
                   selectedTemplate === 'elegant_purple' ? 'purple' :
                   selectedTemplate === 'professional_green' ? 'green' : 'blue',
      font_style: 'modern'
    };
    autoSave(presentationData);
  };

  const deleteElement = (elementId: string) => {
    const updatedSlides = slides.map(slide => ({
      ...slide,
      elements: slide.elements.filter(element => element.id !== elementId)
    }));
    setSlides(updatedSlides);
    setSelectedElement(null);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentSlide) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      const newElement: EditorElement = {
        id: `element-${Date.now()}`,
        type: 'image',
        x: 100,
        y: 100,
        width: 200,
        height: 150,
        content: imageUrl,
        style: {}
      };
      
      const updatedSlides = [...slides];
      updatedSlides[currentSlideIndex].elements.push(newElement);
      setSlides(updatedSlides);
    };
    reader.readAsDataURL(file);
  };

  const generatePowerPoint = async () => {
    setIsGenerating(true);
    try {
      // Ensure we're in the browser
      if (typeof window === 'undefined') {
        throw new Error('PowerPoint generation is only available in the browser');
      }
      
      // Dynamically import PptxGenJS to avoid Node.js module issues in browser
      let PptxGenJS;
      try {
        const pptxModule = await import('pptxgenjs');
        PptxGenJS = pptxModule.default || pptxModule;
      } catch (importError) {
        console.error('Failed to import pptxgenjs:', importError);
        throw new Error('Failed to load PowerPoint library. Please refresh the page and try again.');
      }
      
      if (!PptxGenJS) {
        throw new Error('PowerPoint library not available');
      }
      
      // Create a new PowerPoint presentation using PptxGenJS
      const pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_WIDE';
      pptx.author = 'Note GPT Dashboard';
      pptx.company = 'Note GPT';
      pptx.title = presentationTitle;

      // Add slides
      for (const slide of slides) {
        const pptxSlide = pptx.addSlide();
        
        // Add title
        if (slide.title) {
          pptxSlide.addText(slide.title, {
            x: 0.5,
            y: 0.5,
            w: 9,
            h: 1,
            fontSize: 32,
            bold: true,
            align: 'center',
            color: '363636'
          });
        }

        // Add content elements
        let yPos = 2;
        for (const element of slide.elements) {
          if (element.type === 'text') {
            pptxSlide.addText(element.content, {
              x: element.x / 100 * 10,
              y: yPos,
              w: (element.width / 100 * 10),
              h: (element.height / 100 * 10),
              fontSize: element.style?.fontSize || 18,
              bold: element.style?.bold || false,
              italic: element.style?.italic || false,
              underline: element.style?.underline || false,
              align: element.style?.align || 'left',
              color: element.style?.color || '000000'
            });
            yPos += (element.height / 100 * 10) + 0.3;
          } else if (element.type === 'image' && element.content.startsWith('data:')) {
            // Handle base64 images
            try {
              const base64Data = element.content.split(',')[1];
              pptxSlide.addImage({
                data: base64Data,
                x: element.x / 100 * 10,
                y: yPos,
                w: (element.width / 100 * 10),
                h: (element.height / 100 * 10)
              });
              yPos += (element.height / 100 * 10) + 0.3;
            } catch (imgError) {
              console.error('Error adding image:', imgError);
            }
          }
        }
      }

      // Generate the PPTX file as blob
      const blob = await pptx.write({ outputType: 'blob' });
      
      // Convert blob to File
      const fileName = `${presentationTitle.replace(/[^a-z0-9]/gi, '_')}.pptx`;
      const pptFile = new File([blob], fileName, { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
      
      // Store download URL for direct download
      const downloadUrl = URL.createObjectURL(blob);
      setDownloadUrl(downloadUrl);
      
      // Trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showSuccess('PowerPoint file generated and downloaded successfully!');
      
      if (onDownload) {
        onDownload();
      }
    } catch (error) {
      console.error('Error generating PowerPoint:', error);
      showError('Failed to generate PowerPoint file');
    } finally {
      setIsGenerating(false);
    }
  };

  const savePresentation = async () => {
    try {
      setIsSaving(true);
      
      // Ensure we're in the browser
      if (typeof window === 'undefined') {
        throw new Error('PowerPoint generation is only available in the browser');
      }
      
      // Dynamically import PptxGenJS to avoid Node.js module issues in browser
      let PptxGenJS;
      try {
        const pptxModule = await import('pptxgenjs');
        PptxGenJS = pptxModule.default || pptxModule;
      } catch (importError) {
        console.error('Failed to import pptxgenjs:', importError);
        throw new Error('Failed to load PowerPoint library. Please refresh the page and try again.');
      }
      
      if (!PptxGenJS) {
        throw new Error('PowerPoint library not available');
      }
      
      // Generate PPT file first
      const pptx = new PptxGenJS();
      pptx.layout = 'LAYOUT_WIDE';
      pptx.author = 'Note GPT Dashboard';
      pptx.company = 'Note GPT';
      pptx.title = presentationTitle;

      // Add slides
      for (const slide of slides) {
        const pptxSlide = pptx.addSlide();
        
        // Add title
        if (slide.title) {
          pptxSlide.addText(slide.title, {
            x: 0.5,
            y: 0.5,
            w: 9,
            h: 1,
            fontSize: 32,
            bold: true,
            align: 'center',
            color: '363636'
          });
        }

        // Add content elements
        let yPos = 2;
        for (const element of slide.elements) {
          if (element.type === 'text') {
            pptxSlide.addText(element.content, {
              x: element.x / 100 * 10,
              y: yPos,
              w: (element.width / 100 * 10),
              h: (element.height / 100 * 10),
              fontSize: element.style?.fontSize || 18,
              bold: element.style?.bold || false,
              italic: element.style?.italic || false,
              underline: element.style?.underline || false,
              align: element.style?.align || 'left',
              color: element.style?.color || '000000'
            });
            yPos += (element.height / 100 * 10) + 0.3;
          } else if (element.type === 'image' && element.content.startsWith('data:')) {
            try {
              const base64Data = element.content.split(',')[1];
              pptxSlide.addImage({
                data: base64Data,
                x: element.x / 100 * 10,
                y: yPos,
                w: (element.width / 100 * 10),
                h: (element.height / 100 * 10)
              });
              yPos += (element.height / 100 * 10) + 0.3;
            } catch (imgError) {
              console.error('Error adding image:', imgError);
            }
          }
        }
      }

      // Convert editor slides to content format for backend
      const contentToSave = {
        title: presentationTitle,
        slides: slides.map((slide) => {
          // Extract title and content from elements
          const titleElement = slide.elements.find(el => el.type === 'text' && el.style?.bold);
          const contentElement = slide.elements.find(el => el.type === 'text' && !el.style?.bold);
          
          return {
            title: titleElement?.content || slide.title,
            content: contentElement?.content || slide.content || '',
            slide_type: slide.slide_type || 'content',
            order: slide.order || slides.indexOf(slide) + 1
          };
        })
      };
      
      // Save to backend (will re-export via API)
      if (onSave) {
        await onSave(contentToSave);
        setLastSaved(new Date());
      } else {
        throw new Error('Save handler not available');
      }
    } catch (error) {
      console.error('Error saving presentation:', error);
      showError('Failed to save presentation');
    } finally {
      setIsSaving(false);
    }
  };

  const nextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  if (!currentSlide) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold">PowerPoint Editor</h2>
          <p className="text-sm text-gray-600">Edit your presentation</p>
          
          {/* Title Editor */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Presentation Title
            </label>
            <Input
              value={presentationTitle}
              onChange={(e) => setPresentationTitle(e.target.value)}
              className="w-full"
              placeholder="Enter presentation title..."
            />
          </div>
        </div>

        {/* Slide Navigation */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-2">
            {slides.map((slide, index) => (
              <Card
                key={slide.id}
                className={`cursor-pointer transition-colors ${
                  index === currentSlideIndex ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setCurrentSlideIndex(index)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{slide.title}</h4>
                      <p className="text-xs text-gray-500">
                        {slide.elements.length} elements
                      </p>
                    </div>
                    {slides.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSlide(index);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Button
            onClick={addSlide}
            className="w-full mt-4"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Slide
          </Button>
        </div>

        {/* Tools */}
        <div className="p-4 border-t border-gray-200">
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="text">Text</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="shapes">Shapes</TabsTrigger>
            </TabsList>
            
            <TabsContent value="text" className="space-y-2">
              <Button
                onClick={addTextElement}
                className="w-full"
                variant="outline"
                size="sm"
              >
                <Type className="h-4 w-4 mr-2" />
                Add Text
              </Button>
            </TabsContent>
            
            <TabsContent value="media" className="space-y-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                variant="outline"
                size="sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </TabsContent>
            
            <TabsContent value="shapes" className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => addShapeElement('square')}
                  variant="outline"
                  size="sm"
                >
                  <Square className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => addShapeElement('circle')}
                  variant="outline"
                  size="sm"
                >
                  <Circle className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => addShapeElement('triangle')}
                  variant="outline"
                  size="sm"
                >
                  <Triangle className="h-4 w-4" />
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                onClick={prevSlide}
                disabled={currentSlideIndex === 0}
                variant="outline"
                size="sm"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <span className="text-sm font-medium">
                Slide {currentSlideIndex + 1} of {slides.length}
              </span>
              
              <Button
                onClick={nextSlide}
                disabled={currentSlideIndex === slides.length - 1}
                variant="outline"
                size="sm"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                {isSaving && <span>Saving...</span>}
                {lastSaved && !isSaving && (
                  <span>Saved {lastSaved.toLocaleTimeString()}</span>
                )}
              </div>
              <Button
                onClick={savePresentation}
                variant="outline"
                size="sm"
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                onClick={generatePowerPoint}
                disabled={isGenerating}
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generating...' : 'Download'}
              </Button>
            </div>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 p-8 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <Card className="aspect-video bg-white shadow-lg">
              <CardContent className="p-8 h-full relative">
                {currentSlide.elements.map((element) => (
                  <div
                    key={element.id}
                    className={`absolute border-2 ${
                      selectedElement === element.id
                        ? 'border-blue-500'
                        : 'border-transparent hover:border-gray-300'
                    } cursor-pointer`}
                    style={{
                      left: `${element.x}px`,
                      top: `${element.y}px`,
                      width: `${element.width}px`,
                      height: `${element.height}px`,
                    }}
                    onClick={() => setSelectedElement(element.id)}
                  >
                    {element.type === 'text' && (
                      <div
                        className="w-full h-full p-2"
                        style={{
                          fontSize: `${element.style.fontSize}px`,
                          fontFamily: element.style.fontFamily,
                          color: element.style.color,
                          backgroundColor: element.style.backgroundColor,
                          fontWeight: element.style.bold ? 'bold' : 'normal',
                          fontStyle: element.style.italic ? 'italic' : 'normal',
                          textDecoration: element.style.underline ? 'underline' : 'none',
                          textAlign: element.style.align || 'left',
                        }}
                        contentEditable
                        onBlur={(e) => {
                          updateElement(element.id, { content: e.currentTarget.textContent || '' });
                        }}
                        suppressContentEditableWarning
                      >
                        {element.content}
                      </div>
                    )}
                    
                    {element.type === 'image' && (
                      <img
                        src={element.content}
                        alt="Slide element"
                        className="w-full h-full object-cover"
                      />
                    )}
                    
                    {element.type === 'shape' && (
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundColor: element.style.backgroundColor,
                          borderRadius: element.content === 'circle' ? '50%' : '0',
                          clipPath: element.content === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none',
                        }}
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PowerPointEditor;
