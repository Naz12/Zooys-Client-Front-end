"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { SLIDE_TEMPLATES, SlideTemplate } from '@/lib/presentation-templates';
import { FileText, Layout, Columns, Image as ImageIcon, Square } from 'lucide-react';

interface SlideTemplatesProps {
  onSelectTemplate: (template: SlideTemplate) => void;
  onClose: () => void;
}

const SlideTemplates: React.FC<SlideTemplatesProps> = ({
  onSelectTemplate,
  onClose
}) => {
  const getTemplateIcon = (templateId: string) => {
    switch (templateId) {
      case 'title':
        return <FileText className="h-8 w-8" />;
      case 'content':
        return <Layout className="h-8 w-8" />;
      case 'twoColumn':
        return <Columns className="h-8 w-8" />;
      case 'imageWithCaption':
        return <ImageIcon className="h-8 w-8" />;
      default:
        return <Square className="h-8 w-8" />;
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Choose a Template</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          ×
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {Object.values(SLIDE_TEMPLATES).map((template) => (
          <Card
            key={template.id}
            className="cursor-pointer hover:border-blue-500 transition-colors"
            onClick={() => {
              onSelectTemplate(template);
              onClose();
            }}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-2">
                <div className="text-gray-400">
                  {getTemplateIcon(template.id)}
                </div>
                <div>
                  <h4 className="font-medium">{template.name}</h4>
                  <p className="text-xs text-gray-500">{template.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SlideTemplates;

