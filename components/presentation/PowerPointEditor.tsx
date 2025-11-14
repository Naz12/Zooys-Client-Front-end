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
  Upload,
  FileText,
  BarChart3
} from 'lucide-react';
import { useNotifications } from '@/lib/notifications';
import { PresentationOutline, Slide } from '@/lib/presentation-workflow-context';
import { presentationApi } from '@/lib/presentation-api-client';
import { debounce } from 'lodash';
import RichTextEditor from './RichTextEditor';
import ImageEditor from './ImageEditor';
import TableEditor, { TableData } from './TableEditor';
import ChartEditor, { ChartData } from './ChartEditor';
import SlideTemplates from './SlideTemplates';
import { useEditorHistory } from '@/lib/hooks/useEditorHistory';

interface PowerPointEditorProps {
  fileId: number;
  initialOutline: PresentationOutline;
  selectedTemplate?: string;
  onSave?: (content: { title: string; slides: Array<{ title: string; content: string; slide_type: string; order: number }> }) => void;
  onDownload?: () => void;
}

// EditorSlide and EditorElement are imported from lib/presentation-editor-types.ts
// EditorSlide extends the base Slide interface from workflow context
type EditorSlideWithBase = EditorSlide & Slide;

const PowerPointEditor: React.FC<PowerPointEditorProps> = ({
  fileId,
  initialOutline,
  selectedTemplate = 'corporate_blue',
  onSave,
  onDownload
}) => {
  const { showSuccess, showError } = useNotifications();
  const [slides, setSlides] = useState<EditorSlideWithBase[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [presentationTitle, setPresentationTitle] = useState(initialOutline.title);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(10);
  const [alignmentGuides, setAlignmentGuides] = useState<{ x?: number; y?: number }>({});
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [editingTableId, setEditingTableId] = useState<string | null>(null);
  const [editingChartId, setEditingChartId] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  // Initialize history
  const { saveState, undo: undoHistory, redo: redoHistory, canUndo, canRedo, clearHistory } = useEditorHistory({
    slides: [],
    currentSlideIndex: 0,
    selectedElement: null,
    presentationTitle: initialOutline.title
  });

  // Initialize slides from outline
  useEffect(() => {
    const editorSlides: EditorSlideWithBase[] = initialOutline.slides.map((slide, index): EditorSlideWithBase => {
      const elements = [];
      
      // Add title element if slide has a title
      // Handle title as string or convert to string
      const titleText = typeof slide.title === 'string' 
        ? slide.title 
        : slide.title?.toString() || '';
      
      if (titleText && titleText.trim()) {
        elements.push({
          id: `element-${index}-0`,
          type: 'text' as const,
          x: 30, // Small margin from left
          y: 30, // Small margin from top - visible area
          width: 700, // Reasonable width that fits most screens
          height: 100, // Enough for title
          content: titleText,
          htmlContent: `<h1 style="margin: 0; padding: 0;">${titleText}</h1>`,
          style: {
            fontSize: 36,
            fontFamily: 'Arial',
            color: '#000000',
            bold: true,
            align: 'center' as const
          }
        });
      }
      
      // Add content element if slide has content
      // Handle content as string, array, or other types
      const contentText = typeof slide.content === 'string' 
        ? slide.content 
        : Array.isArray(slide.content) 
          ? slide.content.join('\n')
          : slide.content?.toString() || '';
      
      if (contentText && contentText.trim()) {
        elements.push({
          id: `element-${index}-1`,
          type: 'text' as const,
          x: 30,
          y: titleText && titleText.trim() ? 150 : 30, // Position below title or start near top if no title
          width: 700,
          height: 350,
          content: contentText,
          htmlContent: `<p style="margin: 0; padding: 0;">${contentText.replace(/\n/g, '<br>')}</p>`,
          style: {
            fontSize: 18,
            fontFamily: 'Arial',
            color: '#333333',
            align: 'left' as const
          }
        });
      }
      
      // If no elements, add a placeholder
      if (elements.length === 0) {
        elements.push({
          id: `element-${index}-0`,
          type: 'text' as const,
          x: 30,
          y: 200,
          width: 700,
          height: 100,
          content: 'Click to edit',
          htmlContent: '<p style="margin: 0; padding: 0;">Click to edit</p>',
          style: {
            fontSize: 24,
            fontFamily: 'Arial',
            color: '#999999',
            align: 'center' as const
          }
        });
      }
      
      return {
        ...slide,
        id: `slide-${index}`,
        elements
      };
    });
    
    setSlides(editorSlides);
    
    // Initialize history with the first state
    if (editorSlides.length > 0) {
      saveState({
        slides: editorSlides,
        currentSlideIndex: 0,
        selectedElement: null,
        presentationTitle: initialOutline.title
      });
    }
  }, [initialOutline, saveState]);

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
    const newSlide: EditorSlideWithBase = {
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
    const updatedSlides = [...slides, newSlide];
    setSlides(updatedSlides);
    setCurrentSlideIndex(slides.length);
    
    // Save to history
    saveState({
      slides: updatedSlides,
      currentSlideIndex: slides.length,
      selectedElement,
      presentationTitle
    });
  };

  const deleteSlide = (slideIndex: number) => {
    if (slides.length <= 1) {
      showError('Cannot delete the last slide');
      return;
    }
    
    const newSlides = slides.filter((_, index) => index !== slideIndex);
    const newIndex = currentSlideIndex >= newSlides.length ? newSlides.length - 1 : currentSlideIndex;
    setSlides(newSlides);
    setCurrentSlideIndex(newIndex);
    
    // Save to history
    saveState({
      slides: newSlides,
      currentSlideIndex: newIndex,
      selectedElement,
      presentationTitle
    });
  };

  const duplicateSlide = (slideIndex: number) => {
    const slideToDuplicate = slides[slideIndex];
    if (!slideToDuplicate) return;
    
    // Create a deep copy of the slide with new IDs
    const duplicatedSlide: EditorSlideWithBase = {
      ...slideToDuplicate,
      id: `slide-${Date.now()}`,
      title: `${slideToDuplicate.title} (Copy)`,
      order: slides.length,
      elements: slideToDuplicate.elements.map((element, index) => ({
        ...element,
        id: `element-${Date.now()}-${index}`,
        content: element.content,
        htmlContent: element.htmlContent,
        tableData: element.tableData ? { ...element.tableData } : undefined,
        chartData: element.chartData ? { ...element.chartData, data: [...element.chartData.data] } : undefined
      }))
    };
    
    const newSlides = [...slides];
    newSlides.splice(slideIndex + 1, 0, duplicatedSlide);
    setSlides(newSlides);
    setCurrentSlideIndex(slideIndex + 1);
    
    // Save to history
    saveState({
      slides: newSlides,
      currentSlideIndex: slideIndex + 1,
      selectedElement,
      presentationTitle
    });
  };

  const moveSlide = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    
    const newSlides = [...slides];
    const [movedSlide] = newSlides.splice(fromIndex, 1);
    newSlides.splice(toIndex, 0, movedSlide);
    
    // Update order property
    newSlides.forEach((slide, index) => {
      slide.order = index;
    });
    
    setSlides(newSlides);
    setCurrentSlideIndex(toIndex);
    
    // Save to history
    saveState({
      slides: newSlides,
      currentSlideIndex: toIndex,
      selectedElement,
      presentationTitle
    });
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

  const addTableElement = () => {
    if (!currentSlide) return;
    
    const defaultTableData: TableData = {
      rows: 3,
      cols: 3,
      cells: [
        ['', '', ''],
        ['', '', ''],
        ['', '', '']
      ],
      headerRow: true,
      borderColor: '#d1d5db',
      borderWidth: 1,
      cellPadding: 8
    };
    
    const newElement: EditorElement = {
      id: `element-${Date.now()}`,
      type: 'table',
      x: 100,
      y: 100,
      width: 400,
      height: 200,
      content: 'Table',
      tableData: defaultTableData,
      style: {}
    };
    
    const updatedSlides = [...slides];
    updatedSlides[currentSlideIndex].elements.push(newElement);
    setSlides(updatedSlides);
    setEditingTableId(newElement.id);
  };

  const handleTableSave = (tableData: TableData) => {
    if (editingTableId) {
      updateElement(editingTableId, { tableData });
      setEditingTableId(null);
    }
  };

  const handleApplyTemplate = (template: SlideTemplate) => {
    if (!currentSlide) return;
    
    // Generate unique IDs for template elements
    const templateElements = template.elements.map((element, index) => ({
      ...element,
      id: `element-${Date.now()}-${index}`,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height
    }));
    
    // Replace current slide elements with template elements
    const updatedSlides = [...slides];
    updatedSlides[currentSlideIndex] = {
      ...updatedSlides[currentSlideIndex],
      elements: templateElements
    };
    
    setSlides(updatedSlides);
    
    // Save to history
    saveState({
      slides: updatedSlides,
      currentSlideIndex,
      selectedElement: null,
      presentationTitle
    });
  };

  const addChartElement = () => {
    if (!currentSlide) return;
    
    const defaultChartData: ChartData = {
      type: 'bar',
      data: [
        { name: 'Item 1', value: 10 },
        { name: 'Item 2', value: 20 },
        { name: 'Item 3', value: 15 }
      ],
      dataKey: 'value',
      nameKey: 'name',
      title: 'Chart Title'
    };
    
    const newElement: EditorElement = {
      id: `element-${Date.now()}`,
      type: 'chart',
      x: 100,
      y: 100,
      width: 500,
      height: 400,
      content: 'Chart',
      chartData: defaultChartData,
      style: {}
    };
    
    const updatedSlides = [...slides];
    updatedSlides[currentSlideIndex].elements.push(newElement);
    setSlides(updatedSlides);
    setEditingChartId(newElement.id);
    
    // Save to history
    saveState({
      slides: updatedSlides,
      currentSlideIndex,
      selectedElement,
      presentationTitle
    });
  };

  const handleChartSave = (chartData: ChartData) => {
    if (editingChartId) {
      updateElement(editingChartId, { chartData });
      setEditingChartId(null);
    }
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
    
    // Save to history
    saveState({
      slides: updatedSlides,
      currentSlideIndex,
      selectedElement,
      presentationTitle
    });
  };

  // Helper function to snap value to grid
  const snapToGridValue = (value: number): number => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  };

  // Helper function to detect alignment with other elements
  const detectAlignment = (elementId: string, newX: number, newY: number) => {
    const currentElement = currentSlide?.elements.find(el => el.id === elementId);
    if (!currentElement) return { x: undefined, y: undefined };

    const guides: { x?: number; y?: number } = {};
    const threshold = 5; // pixels

    // Check alignment with other elements
    currentSlide?.elements.forEach(el => {
      if (el.id === elementId) return;

      // Check horizontal alignment (same Y)
      if (Math.abs(newY - el.y) < threshold) {
        guides.y = el.y;
      }

      // Check vertical alignment (same X)
      if (Math.abs(newX - el.x) < threshold) {
        guides.x = el.x;
      }

      // Check alignment with element edges
      if (Math.abs(newX - (el.x + el.width)) < threshold) {
        guides.x = el.x + el.width;
      }
      if (Math.abs(newY - (el.y + el.height)) < threshold) {
        guides.y = el.y + el.height;
      }
    });

    return guides;
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

  // Handle element drag
  const handleElementDrag = (elementId: string, data: { x: number; y: number }) => {
    const snappedX = snapToGridValue(data.x);
    const snappedY = snapToGridValue(data.y);
    const guides = detectAlignment(elementId, snappedX, snappedY);
    
    setAlignmentGuides(guides);
    
    // Apply alignment if detected
    const finalX = guides.x !== undefined ? guides.x : snappedX;
    const finalY = guides.y !== undefined ? guides.y : snappedY;
    
    updateElement(elementId, { x: finalX, y: finalY });
  };

  // Handle element drag end
  const handleElementDragEnd = () => {
    setAlignmentGuides({});
    // Save to history after drag ends
    saveState({
      slides,
      currentSlideIndex,
      selectedElement,
      presentationTitle
    });
  };

  // Handle element resize
  const handleElementResize = (elementId: string, width: number, height: number) => {
    const snappedWidth = snapToGridValue(width);
    const snappedHeight = snapToGridValue(height);
    updateElement(elementId, { width: snappedWidth, height: snappedHeight });
  };

  const deleteElement = (elementId: string) => {
    const updatedSlides = slides.map(slide => ({
      ...slide,
      elements: slide.elements.filter(element => element.id !== elementId)
    }));
    setSlides(updatedSlides);
    setSelectedElement(null);
    
    // Save to history
    saveState({
      slides: updatedSlides,
      currentSlideIndex,
      selectedElement: null,
      presentationTitle
    });
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
      
      // Save to history
      saveState({
        slides: updatedSlides,
        currentSlideIndex,
        selectedElement,
        presentationTitle
      });
    };
    reader.readAsDataURL(file);
  };

  const handleImageEdit = (elementId: string) => {
    setEditingImageId(elementId);
  };

  const handleImageSave = (editedImageUrl: string) => {
    if (editingImageId) {
      updateElement(editingImageId, { content: editedImageUrl });
      setEditingImageId(null);
    }
  };

  const handleImageReplace = (file: File) => {
    if (!editingImageId) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      updateElement(editingImageId, { content: imageUrl });
      setEditingImageId(null);
    };
    reader.readAsDataURL(file);
  };

  // Helper function to parse HTML and extract text with formatting
  const parseHtmlToTextOptions = (html: string, defaultStyle: EditorElement['style']) => {
    if (!html) {
      return {
        text: '',
        options: {
          fontSize: defaultStyle?.fontSize || 18,
          bold: defaultStyle?.bold || false,
          italic: defaultStyle?.italic || false,
          underline: defaultStyle?.underline || false,
          align: defaultStyle?.align || 'left',
          color: defaultStyle?.color?.replace('#', '') || '000000',
        }
      };
    }

    // Create a temporary DOM element to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Extract plain text
    const text = tempDiv.textContent || tempDiv.innerText || '';
    
    // Detect formatting from HTML
    const hasBold = tempDiv.querySelector('strong, b') !== null || html.includes('<strong>') || html.includes('<b>');
    const hasItalic = tempDiv.querySelector('em, i') !== null || html.includes('<em>') || html.includes('<i>');
    const hasUnderline = tempDiv.querySelector('u') !== null || html.includes('<u>');
    
    // Extract color from style attribute or color tag
    let color = defaultStyle?.color?.replace('#', '') || '000000';
    const colorMatch = html.match(/color:\s*([^;]+)/i) || html.match(/<span[^>]*color:\s*([^;]+)/i);
    if (colorMatch) {
      const colorValue = colorMatch[1].trim();
      if (colorValue.startsWith('#')) {
        color = colorValue.substring(1);
      } else if (colorValue.startsWith('rgb')) {
        // Convert RGB to hex (simplified)
        const rgbMatch = colorValue.match(/\d+/g);
        if (rgbMatch && rgbMatch.length >= 3) {
          const r = parseInt(rgbMatch[0]).toString(16).padStart(2, '0');
          const g = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
          const b = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
          color = r + g + b;
        }
      }
    }
    
    // Detect alignment
    let align: 'left' | 'center' | 'right' = defaultStyle?.align || 'left';
    if (html.includes('text-align:center') || html.includes('text-align: center')) {
      align = 'center';
    } else if (html.includes('text-align:right') || html.includes('text-align: right')) {
      align = 'right';
    }

    return {
      text,
      options: {
        fontSize: defaultStyle?.fontSize || 18,
        bold: hasBold || defaultStyle?.bold || false,
        italic: hasItalic || defaultStyle?.italic || false,
        underline: hasUnderline || defaultStyle?.underline || false,
        align,
        color,
      }
    };
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
            // Use HTML content if available, otherwise use plain text
            const htmlContent = element.htmlContent || element.content || '';
            const { text, options } = parseHtmlToTextOptions(htmlContent, element.style);
            
            // Handle bullet lists
            if (htmlContent.includes('<ul>') || htmlContent.includes('<ol>')) {
              const listItems: string[] = [];
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = htmlContent;
              const listElements = tempDiv.querySelectorAll('li');
              listElements.forEach(li => listItems.push(li.textContent || ''));
              
              if (listItems.length > 0) {
                pptxSlide.addText(listItems, {
                  x: element.x / 100 * 10,
                  y: yPos,
                  w: (element.width / 100 * 10),
                  h: (element.height / 100 * 10),
                  bullet: htmlContent.includes('<ul>'),
                  fontSize: options.fontSize,
                  bold: options.bold,
                  italic: options.italic,
                  underline: options.underline,
                  align: options.align,
                  color: options.color
                });
              }
            } else {
              pptxSlide.addText(text, {
                x: element.x / 100 * 10,
                y: yPos,
                w: (element.width / 100 * 10),
                h: (element.height / 100 * 10),
                fontSize: options.fontSize,
                bold: options.bold,
                italic: options.italic,
                underline: options.underline,
                align: options.align,
                color: options.color
              });
            }
            yPos += (element.height / 100 * 10) + 0.3;
          } else if (element.type === 'table' && element.tableData) {
            // Handle tables
            try {
              const tableRows: any[] = [];
              element.tableData.cells.forEach((row, rowIndex) => {
                const tableRow: any[] = [];
                row.forEach(cell => {
                  tableRow.push({
                    text: cell || '',
                    options: {
                      fill: element.tableData?.headerRow && rowIndex === 0 ? 'f0f0f0' : 'ffffff',
                      color: '363636',
                      align: 'left',
                      valign: 'middle'
                    }
                  });
                });
                tableRows.push(tableRow);
              });

              pptxSlide.addTable(tableRows, {
                x: element.x / 100 * 10,
                y: yPos,
                w: (element.width / 100 * 10),
                h: (element.height / 100 * 10),
                border: {
                  type: 'solid',
                  color: element.tableData.borderColor?.replace('#', '') || 'd1d5db',
                  pt: element.tableData.borderWidth || 1
                },
                colW: (element.width / 100 * 10) / element.tableData.cols,
                rowH: (element.height / 100 * 10) / element.tableData.rows
              });
              yPos += (element.height / 100 * 10) + 0.3;
            } catch (tableError) {
              console.error('Error adding table:', tableError);
            }
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
            // Use HTML content if available, otherwise use plain text
            const htmlContent = element.htmlContent || element.content || '';
            const { text, options } = parseHtmlToTextOptions(htmlContent, element.style);
            
            // Handle bullet lists
            if (htmlContent.includes('<ul>') || htmlContent.includes('<ol>')) {
              const listItems: string[] = [];
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = htmlContent;
              const listElements = tempDiv.querySelectorAll('li');
              listElements.forEach(li => listItems.push(li.textContent || ''));
              
              if (listItems.length > 0) {
                pptxSlide.addText(listItems, {
                  x: element.x / 100 * 10,
                  y: yPos,
                  w: (element.width / 100 * 10),
                  h: (element.height / 100 * 10),
                  bullet: htmlContent.includes('<ul>'),
                  fontSize: options.fontSize,
                  bold: options.bold,
                  italic: options.italic,
                  underline: options.underline,
                  align: options.align,
                  color: options.color
                });
              }
            } else {
              pptxSlide.addText(text, {
                x: element.x / 100 * 10,
                y: yPos,
                w: (element.width / 100 * 10),
                h: (element.height / 100 * 10),
                fontSize: options.fontSize,
                bold: options.bold,
                italic: options.italic,
                underline: options.underline,
                align: options.align,
                color: options.color
              });
            }
            yPos += (element.height / 100 * 10) + 0.3;
          } else if (element.type === 'table' && element.tableData) {
            // Handle tables
            try {
              const tableRows: any[] = [];
              element.tableData.cells.forEach((row, rowIndex) => {
                const tableRow: any[] = [];
                row.forEach(cell => {
                  tableRow.push({
                    text: cell || '',
                    options: {
                      fill: element.tableData?.headerRow && rowIndex === 0 ? 'f0f0f0' : 'ffffff',
                      color: '363636',
                      align: 'left',
                      valign: 'middle'
                    }
                  });
                });
                tableRows.push(tableRow);
              });

              pptxSlide.addTable(tableRows, {
                x: element.x / 100 * 10,
                y: yPos,
                w: (element.width / 100 * 10),
                h: (element.height / 100 * 10),
                border: {
                  type: 'solid',
                  color: element.tableData.borderColor?.replace('#', '') || 'd1d5db',
                  pt: element.tableData.borderWidth || 1
                },
                colW: (element.width / 100 * 10) / element.tableData.cols,
                rowH: (element.height / 100 * 10) / element.tableData.rows
              });
              yPos += (element.height / 100 * 10) + 0.3;
            } catch (tableError) {
              console.error('Error adding table:', tableError);
            }
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

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const state = undoHistory();
        if (state) {
          setSlides(state.slides);
          setCurrentSlideIndex(state.currentSlideIndex);
          setSelectedElement(state.selectedElement);
          setPresentationTitle(state.presentationTitle);
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        const state = redoHistory();
        if (state) {
          setSlides(state.slides);
          setCurrentSlideIndex(state.currentSlideIndex);
          setSelectedElement(state.selectedElement);
          setPresentationTitle(state.presentationTitle);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undoHistory, redoHistory]);

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
              onChange={(e) => {
                const newTitle = e.target.value;
                setPresentationTitle(newTitle);
                // Save to history
                saveState({
                  slides,
                  currentSlideIndex,
                  selectedElement,
                  presentationTitle: newTitle
                });
              }}
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
                    {index === currentSlideIndex && (
                      <div className="flex items-center space-x-1">
                        {index > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveSlide(index, index - 1);
                            }}
                            title="Move up"
                          >
                            ↑
                          </Button>
                        )}
                        {index < slides.length - 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              moveSlide(index, index + 1);
                            }}
                            title="Move down"
                          >
                            ↓
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            duplicateSlide(index);
                          }}
                          title="Duplicate"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        {slides.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSlide(index);
                            }}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-2 mt-4">
            <Button
              onClick={addSlide}
              className="w-full"
              variant="outline"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Slide
            </Button>
            <Button
              onClick={() => setShowTemplates(true)}
              className="w-full"
              variant="outline"
            >
              <FileText className="h-4 w-4 mr-2" />
              Apply Template
            </Button>
          </div>
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
              <Button
                onClick={addTableElement}
                className="w-full"
                variant="outline"
                size="sm"
              >
                <Type className="h-4 w-4 mr-2" />
                Insert Table
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
              <Button
                onClick={addChartElement}
                className="w-full"
                variant="outline"
                size="sm"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Insert Chart
              </Button>
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
                onClick={() => {
                  const state = undoHistory();
                  if (state) {
                    setSlides(state.slides);
                    setCurrentSlideIndex(state.currentSlideIndex);
                    setSelectedElement(state.selectedElement);
                    setPresentationTitle(state.presentationTitle);
                  }
                }}
                variant="outline"
                size="sm"
                disabled={!canUndo}
                title="Undo (Ctrl+Z)"
              >
                ↶ Undo
              </Button>
              <Button
                onClick={() => {
                  const state = redoHistory();
                  if (state) {
                    setSlides(state.slides);
                    setCurrentSlideIndex(state.currentSlideIndex);
                    setSelectedElement(state.selectedElement);
                    setPresentationTitle(state.presentationTitle);
                  }
                }}
                variant="outline"
                size="sm"
                disabled={!canRedo}
                title="Redo (Ctrl+Y)"
              >
                ↷ Redo
              </Button>
              <Button
                onClick={() => setShowGrid(!showGrid)}
                variant={showGrid ? 'default' : 'outline'}
                size="sm"
              >
                Grid
              </Button>
              <Button
                onClick={() => setSnapToGrid(!snapToGrid)}
                variant={snapToGrid ? 'default' : 'outline'}
                size="sm"
              >
                Snap
              </Button>
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
        <div className="flex-1 p-8 overflow-auto bg-gray-100">
          <div className="max-w-5xl mx-auto">
            <Card className="aspect-video bg-white shadow-2xl border-2 border-gray-300">
              <CardContent className="p-4 sm:p-6 md:p-8 h-full relative overflow-visible">
                {/* Grid Overlay */}
                {showGrid && (
                  <div 
                    className="absolute inset-0 pointer-events-none z-0"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
                      `,
                      backgroundSize: `${gridSize}px ${gridSize}px`
                    }}
                  />
                )}

                {/* Alignment Guides */}
                {alignmentGuides.x !== undefined && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-blue-500 pointer-events-none z-50"
                    style={{ left: `${alignmentGuides.x}px` }}
                  />
                )}
                {alignmentGuides.y !== undefined && (
                  <div
                    className="absolute left-0 right-0 h-0.5 bg-blue-500 pointer-events-none z-50"
                    style={{ top: `${alignmentGuides.y}px` }}
                  />
                )}

                {/* Empty State */}
                {(!currentSlide || !currentSlide.elements || currentSlide.elements.length === 0) && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <Type className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Empty Slide</p>
                      <p className="text-sm mt-2">Click "Add Text" or "Upload Image" to add content</p>
                    </div>
                  </div>
                )}

                {/* Slide Elements */}
                {currentSlide && currentSlide.elements && currentSlide.elements.map((element) => (
                  <div
                    key={element.id}
                    className={`absolute border-2 z-10 ${
                      selectedElement === element.id
                        ? 'border-blue-500 shadow-lg'
                        : 'border-transparent hover:border-gray-300'
                    } ${selectedElement === element.id ? 'cursor-move' : 'cursor-pointer'}`}
                    style={{
                      left: `${element.x}px`,
                      top: `${element.y}px`,
                      width: `${element.width}px`,
                      height: `${element.height}px`,
                    }}
                    onClick={() => setSelectedElement(element.id)}
                    onMouseDown={(e) => {
                      if (selectedElement !== element.id) return;
                      e.preventDefault();
                      const startX = e.clientX;
                      const startY = e.clientY;
                      const startElementX = element.x;
                      const startElementY = element.y;

                      const handleMouseMove = (moveEvent: MouseEvent) => {
                        const deltaX = moveEvent.clientX - startX;
                        const deltaY = moveEvent.clientY - startY;
                        const newX = startElementX + deltaX;
                        const newY = startElementY + deltaY;
                        handleElementDrag(element.id, { x: newX, y: newY });
                      };

                      const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                        handleElementDragEnd();
                      };

                      document.addEventListener('mousemove', handleMouseMove);
                      document.addEventListener('mouseup', handleMouseUp);
                    }}
                  >
                      {/* Resize Handles */}
                      {selectedElement === element.id && (
                        <>
                          {/* Corner handles */}
                          <div
                            className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded cursor-nwse-resize drag-handle"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              const startX = e.clientX;
                              const startY = e.clientY;
                              const startWidth = element.width;
                              const startHeight = element.height;
                              const startElementX = element.x;
                              const startElementY = element.y;

                              const handleMouseMove = (moveEvent: MouseEvent) => {
                                const deltaX = moveEvent.clientX - startX;
                                const deltaY = moveEvent.clientY - startY;
                                const newWidth = Math.max(20, startWidth - deltaX);
                                const newHeight = Math.max(20, startHeight - deltaY);
                                const newX = startElementX + (startWidth - newWidth);
                                const newY = startElementY + (startHeight - newHeight);
                                updateElement(element.id, { width: newWidth, height: newHeight, x: newX, y: newY });
                              };

                              const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                              };

                              document.addEventListener('mousemove', handleMouseMove);
                              document.addEventListener('mouseup', handleMouseUp);
                            }}
                          />
                          <div
                            className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded cursor-nesw-resize drag-handle"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              const startX = e.clientX;
                              const startY = e.clientY;
                              const startWidth = element.width;
                              const startHeight = element.height;
                              const startElementY = element.y;

                              const handleMouseMove = (moveEvent: MouseEvent) => {
                                const deltaX = moveEvent.clientX - startX;
                                const deltaY = moveEvent.clientY - startY;
                                const newWidth = Math.max(20, startWidth + deltaX);
                                const newHeight = Math.max(20, startHeight - deltaY);
                                const newY = startElementY + (startHeight - newHeight);
                                updateElement(element.id, { width: newWidth, height: newHeight, y: newY });
                              };

                              const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                              };

                              document.addEventListener('mousemove', handleMouseMove);
                              document.addEventListener('mouseup', handleMouseUp);
                            }}
                          />
                          <div
                            className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white rounded cursor-nesw-resize drag-handle"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              const startX = e.clientX;
                              const startY = e.clientY;
                              const startWidth = element.width;
                              const startHeight = element.height;
                              const startElementX = element.x;

                              const handleMouseMove = (moveEvent: MouseEvent) => {
                                const deltaX = moveEvent.clientX - startX;
                                const deltaY = moveEvent.clientY - startY;
                                const newWidth = Math.max(20, startWidth - deltaX);
                                const newHeight = Math.max(20, startHeight + deltaY);
                                const newX = startElementX + (startWidth - newWidth);
                                updateElement(element.id, { width: newWidth, height: newHeight, x: newX });
                              };

                              const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                              };

                              document.addEventListener('mousemove', handleMouseMove);
                              document.addEventListener('mouseup', handleMouseUp);
                            }}
                          />
                          <div
                            className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white rounded cursor-nwse-resize drag-handle"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              const startX = e.clientX;
                              const startY = e.clientY;
                              const startWidth = element.width;
                              const startHeight = element.height;

                              const handleMouseMove = (moveEvent: MouseEvent) => {
                                const deltaX = moveEvent.clientX - startX;
                                const deltaY = moveEvent.clientY - startY;
                                const newWidth = Math.max(20, startWidth + deltaX);
                                const newHeight = Math.max(20, startHeight + deltaY);
                                updateElement(element.id, { width: newWidth, height: newHeight });
                              };

                              const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                              };

                              document.addEventListener('mousemove', handleMouseMove);
                              document.addEventListener('mouseup', handleMouseUp);
                            }}
                          />
                          {/* Edge handles */}
                          <div
                            className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 border border-white rounded cursor-ns-resize drag-handle"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              const startY = e.clientY;
                              const startHeight = element.height;
                              const startElementY = element.y;

                              const handleMouseMove = (moveEvent: MouseEvent) => {
                                const deltaY = moveEvent.clientY - startY;
                                const newHeight = Math.max(20, startHeight - deltaY);
                                const newY = startElementY + (startHeight - newHeight);
                                updateElement(element.id, { height: newHeight, y: newY });
                              };

                              const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                              };

                              document.addEventListener('mousemove', handleMouseMove);
                              document.addEventListener('mouseup', handleMouseUp);
                            }}
                          />
                          <div
                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-blue-500 border border-white rounded cursor-ns-resize drag-handle"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              const startY = e.clientY;
                              const startHeight = element.height;

                              const handleMouseMove = (moveEvent: MouseEvent) => {
                                const deltaY = moveEvent.clientY - startY;
                                const newHeight = Math.max(20, startHeight + deltaY);
                                updateElement(element.id, { height: newHeight });
                              };

                              const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                              };

                              document.addEventListener('mousemove', handleMouseMove);
                              document.addEventListener('mouseup', handleMouseUp);
                            }}
                          />
                          <div
                            className="absolute -left-1 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 border border-white rounded cursor-ew-resize drag-handle"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              const startX = e.clientX;
                              const startWidth = element.width;
                              const startElementX = element.x;

                              const handleMouseMove = (moveEvent: MouseEvent) => {
                                const deltaX = moveEvent.clientX - startX;
                                const newWidth = Math.max(20, startWidth - deltaX);
                                const newX = startElementX + (startWidth - newWidth);
                                updateElement(element.id, { width: newWidth, x: newX });
                              };

                              const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                              };

                              document.addEventListener('mousemove', handleMouseMove);
                              document.addEventListener('mouseup', handleMouseUp);
                            }}
                          />
                          <div
                            className="absolute -right-1 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 border border-white rounded cursor-ew-resize drag-handle"
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              const startX = e.clientX;
                              const startWidth = element.width;

                              const handleMouseMove = (moveEvent: MouseEvent) => {
                                const deltaX = moveEvent.clientX - startX;
                                const newWidth = Math.max(20, startWidth + deltaX);
                                updateElement(element.id, { width: newWidth });
                              };

                              const handleMouseUp = () => {
                                document.removeEventListener('mousemove', handleMouseMove);
                                document.removeEventListener('mouseup', handleMouseUp);
                              };

                              document.addEventListener('mousemove', handleMouseMove);
                              document.addEventListener('mouseup', handleMouseUp);
                            }}
                          />
                        </>
                      )}
                      <div className="drag-handle w-full h-full overflow-visible">
                        {element.type === 'text' && (
                          <div
                            className="w-full h-full p-1 min-h-[40px] bg-white rounded"
                            style={{
                              fontSize: `${element.style.fontSize || 16}px`,
                              fontFamily: element.style.fontFamily || 'Arial',
                              color: element.style.color || '#000000',
                              backgroundColor: element.style.backgroundColor || 'transparent',
                              fontWeight: element.style.bold ? 'bold' : 'normal',
                              fontStyle: element.style.italic ? 'italic' : 'normal',
                              textDecoration: element.style.underline ? 'underline' : 'none',
                              textAlign: element.style.align || 'left',
                            }}
                          >
                            <RichTextEditor
                              content={element.htmlContent || element.content || ''}
                              onChange={(html) => {
                                // Extract plain text for backward compatibility
                                const tempDiv = document.createElement('div');
                                tempDiv.innerHTML = html;
                                const plainText = tempDiv.textContent || tempDiv.innerText || '';
                                
                                updateElement(element.id, { 
                                  content: plainText,
                                  htmlContent: html
                                });
                              }}
                              className="h-full w-full"
                            />
                          </div>
                        )}
                        
                        {element.type === 'image' && (
                          <div className="relative w-full h-full group">
                            <img
                              src={element.content}
                              alt="Slide element"
                              className="w-full h-full object-cover"
                            />
                            {selectedElement === element.id && (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleImageEdit(element.id);
                                }}
                              >
                                <ImageIcon className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            )}
                          </div>
                        )}
                        
                        {element.type === 'table' && element.tableData && (
                          <div className="relative w-full h-full group overflow-auto">
                            <table
                              className="w-full border-collapse"
                              style={{
                                borderColor: element.tableData.borderColor || '#d1d5db',
                                borderWidth: `${element.tableData.borderWidth || 1}px`
                              }}
                            >
                              <tbody>
                                {element.tableData.cells.map((row, rowIndex) => (
                                  <tr
                                    key={rowIndex}
                                    className={element.tableData?.headerRow && rowIndex === 0 ? 'bg-gray-100 font-semibold' : ''}
                                  >
                                    {row.map((cell, colIndex) => (
                                      <td
                                        key={`${rowIndex}-${colIndex}`}
                                        className="border p-2"
                                        style={{
                                          borderColor: element.tableData?.borderColor || '#d1d5db',
                                          borderWidth: `${element.tableData?.borderWidth || 1}px`,
                                          padding: `${element.tableData?.cellPadding || 8}px`
                                        }}
                                      >
                                        {cell || ''}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            {selectedElement === element.id && (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingTableId(element.id);
                                }}
                              >
                                <Edit3 className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            )}
                          </div>
                        )}
                        
                        {element.type === 'chart' && element.chartData && (
                          <div className="relative w-full h-full group overflow-auto">
                            <div className="w-full h-full p-4">
                              {element.chartData.title && (
                                <h4 className="text-center font-semibold mb-2">{element.chartData.title}</h4>
                              )}
                              <div className="w-full h-full">
                                {/* Chart will be rendered here - using a placeholder for now */}
                                <div className="w-full h-full flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded">
                                  <div className="text-center text-gray-400">
                                    <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                                    <p>Chart Preview</p>
                                    <p className="text-xs">Click Edit to configure</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            {selectedElement === element.id && (
                              <Button
                                size="sm"
                                variant="secondary"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingChartId(element.id);
                                }}
                              >
                                <Edit3 className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            )}
                          </div>
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
                    </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Image Editor Modal */}
      {editingImageId && currentSlide && (() => {
        const imageElement = currentSlide.elements.find(el => el.id === editingImageId && el.type === 'image');
        if (!imageElement) return null;
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardContent className="p-0">
                <ImageEditor
                  imageUrl={imageElement.content}
                  onSave={handleImageSave}
                  onCancel={() => setEditingImageId(null)}
                  onReplace={handleImageReplace}
                />
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* Table Editor Modal */}
      {editingTableId && currentSlide && (() => {
        const tableElement = currentSlide.elements.find(el => el.id === editingTableId && el.type === 'table');
        if (!tableElement || !tableElement.tableData) return null;
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardContent className="p-0">
                <TableEditor
                  tableData={tableElement.tableData}
                  onSave={handleTableSave}
                  onCancel={() => setEditingTableId(null)}
                />
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* Template Selector Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardContent className="p-0">
              <SlideTemplates
                onSelectTemplate={handleApplyTemplate}
                onClose={() => setShowTemplates(false)}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Chart Editor Modal */}
      {editingChartId && currentSlide && (() => {
        const chartElement = currentSlide.elements.find(el => el.id === editingChartId && el.type === 'chart');
        if (!chartElement || !chartElement.chartData) return null;
        
        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardContent className="p-0">
                <ChartEditor
                  chartData={chartElement.chartData}
                  onSave={handleChartSave}
                  onCancel={() => setEditingChartId(null)}
                />
              </CardContent>
            </Card>
          </div>
        );
      })()}
    </div>
  );
};

export default PowerPointEditor;
