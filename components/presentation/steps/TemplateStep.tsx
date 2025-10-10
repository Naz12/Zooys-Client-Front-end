"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Palette, 
  Search, 
  Eye, 
  CheckCircle,
  Sparkles,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import { useWorkflow } from '@/lib/presentation-workflow-context';
import { presentationApi } from '@/lib/presentation-api-client';
import { useNotifications } from '@/lib/notifications';

const templateCategories = [
  { value: 'all', label: 'All Templates' },
  { value: 'business', label: 'Business' },
  { value: 'creative', label: 'Creative' },
  { value: 'modern', label: 'Modern' },
  { value: 'minimalist', label: 'Minimalist' },
  { value: 'academic', label: 'Academic' },
];

const fontStyles = [
  { value: 'modern', label: 'Modern', description: 'Clean, contemporary fonts' },
  { value: 'classic', label: 'Classic', description: 'Traditional, professional fonts' },
  { value: 'minimalist', label: 'Minimalist', description: 'Simple, focused typography' },
  { value: 'creative', label: 'Creative', description: 'Bold, expressive fonts' },
];

const colorSchemes = [
  { value: 'blue', label: 'Blue', color: 'bg-blue-500' },
  { value: 'green', label: 'Green', color: 'bg-green-500' },
  { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
  { value: 'red', label: 'Red', color: 'bg-red-500' },
  { value: 'orange', label: 'Orange', color: 'bg-orange-500' },
  { value: 'gray', label: 'Gray', color: 'bg-gray-500' },
];

export function TemplateStep() {
  const { state, dispatch } = useWorkflow();
  const { showSuccess, showError } = useNotifications();
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedFontStyle, setSelectedFontStyle] = useState('modern');
  const [selectedColorScheme, setSelectedColorScheme] = useState('blue');
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await presentationApi.getTemplates();
      if (response.success) {
        dispatch({
          type: 'SET_TEMPLATE_DATA',
          payload: response.data.templates
        });
      } else {
        throw new Error('Failed to load templates');
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load templates';
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    dispatch({
      type: 'SELECT_TEMPLATE',
      payload: templateId
    });
    showSuccess('Template selected successfully!');
  };

  const filteredTemplates = () => {
    if (!state.templateData) return [];

    let templates = Object.entries(state.templateData);

    // Filter by category
    if (selectedCategory !== 'all') {
      templates = templates.filter(([, template]) => 
        template.category === selectedCategory
      );
    }

    // Filter by search term
    if (searchTerm) {
      templates = templates.filter(([, template]) =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return templates;
  };

  const getTemplatePreview = (templateId: string) => {
    // Mock preview data - in real implementation, this would come from the API
    const previews: Record<string, string> = {
      corporate_blue: 'Professional blue theme with clean layouts',
      modern_white: 'Minimalist white theme with modern typography',
      creative_colorful: 'Vibrant colors with dynamic layouts',
      minimalist_gray: 'Simple gray theme with focused content',
      academic_formal: 'Formal dark theme for educational content',
    };
    return previews[templateId] || 'Template preview not available';
  };

  const getTemplateColor = (colorScheme: string) => {
    const colorMap: Record<string, string> = {
      blue: 'bg-blue-500',
      white: 'bg-white border-2 border-gray-300',
      colorful: 'bg-gradient-to-r from-purple-500 to-pink-500',
      gray: 'bg-gray-500',
      dark: 'bg-gray-800',
    };
    return colorMap[colorScheme] || 'bg-gray-500';
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto mb-4" />
        <p className="text-muted-foreground">Loading templates...</p>
      </div>
    );
  }

  if (!state.templateData) {
    return (
      <div className="text-center py-8">
        <Palette className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <p className="text-muted-foreground">No templates available. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Template Filters */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="search">Search Templates</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                placeholder="Search by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="md:w-48">
            <Label htmlFor="category">Category</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {templateCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Customization Options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Customization Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Font Style</Label>
              <Select value={selectedFontStyle} onValueChange={setSelectedFontStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fontStyles.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      <div>
                        <div className="font-medium">{style.label}</div>
                        <div className="text-xs text-muted-foreground">{style.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Color Scheme</Label>
              <div className="flex gap-2">
                {colorSchemes.map((scheme) => (
                  <button
                    key={scheme.value}
                    onClick={() => setSelectedColorScheme(scheme.value)}
                    className={`w-8 h-8 rounded-full ${scheme.color} border-2 ${
                      selectedColorScheme === scheme.value
                        ? 'border-gray-900 dark:border-white'
                        : 'border-transparent'
                    } hover:scale-110 transition-transform`}
                    title={scheme.label}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Gallery */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">
            Available Templates ({filteredTemplates().length})
          </Label>
          {state.selectedTemplate && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3" />
              Template Selected
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates().map(([templateId, template]) => (
            <Card
              key={templateId}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                state.selectedTemplate === templateId
                  ? 'ring-2 ring-purple-500 bg-purple-50 dark:bg-purple-950'
                  : 'hover:shadow-md'
              }`}
              onClick={() => handleTemplateSelect(templateId)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{template.name}</CardTitle>
                  {state.selectedTemplate === templateId && (
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                  )}
                </div>
                <Badge variant="outline" className="w-fit text-xs">
                  {template.category}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Template Preview */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    Preview
                  </div>
                  <div className="relative">
                    <div className="aspect-video rounded-lg border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className={`h-full ${getTemplateColor(template.color_scheme)} flex items-center justify-center`}>
                        <div className="text-center p-4">
                          <div className="text-2xl font-bold mb-2">Sample Title</div>
                          <div className="text-sm opacity-75">Sample content preview</div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                </div>

                {/* Template Description */}
                <p className="text-sm text-muted-foreground">
                  {template.description}
                </p>

                {/* Color Scheme Indicator */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Color:</span>
                  <div className="flex gap-1">
                    <div className={`w-4 h-4 rounded-full ${getTemplateColor(template.color_scheme)}`}></div>
                    <span className="text-xs capitalize">{template.color_scheme}</span>
                  </div>
                </div>

                {/* Select Button */}
                <Button
                  variant={state.selectedTemplate === templateId ? "default" : "outline"}
                  size="sm"
                  className="w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTemplateSelect(templateId);
                  }}
                >
                  {state.selectedTemplate === templateId ? 'Selected' : 'Select Template'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTemplates().length === 0 && (
          <div className="text-center py-8">
            <Palette className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-muted-foreground">No templates found matching your criteria.</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="mt-4"
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Template Preview</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewTemplate(null)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-muted-foreground">{getTemplatePreview(previewTemplate)}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <Monitor className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-muted-foreground">Desktop View</p>
                  </div>
                  <div className="text-center">
                    <Tablet className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-muted-foreground">Tablet View</p>
                  </div>
                  <div className="text-center">
                    <Smartphone className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-muted-foreground">Mobile View</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Selected Template Summary */}
      {state.selectedTemplate && state.templateData && (
        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-medium text-green-900 dark:text-green-100">
                  Template Selected: {state.templateData[state.selectedTemplate]?.name}
                </h4>
                <p className="text-sm text-green-800 dark:text-green-200">
                  {state.templateData[state.selectedTemplate]?.description}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
