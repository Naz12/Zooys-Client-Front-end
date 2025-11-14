import { EditorSlide, EditorElement } from '@/components/presentation/PowerPointEditor';

export interface SlideTemplate {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  elements: EditorElement[];
}

export const SLIDE_TEMPLATES: Record<string, SlideTemplate> = {
  title: {
    id: 'title',
    name: 'Title Slide',
    description: 'A simple title slide with centered title and subtitle',
    elements: [
      {
        id: 'title-element',
        type: 'text',
        x: 50,
        y: 200,
        width: 600,
        height: 100,
        content: 'Presentation Title',
        style: {
          fontSize: 48,
          fontFamily: 'Arial',
          color: '#000000',
          bold: true,
          align: 'center'
        }
      },
      {
        id: 'subtitle-element',
        type: 'text',
        x: 50,
        y: 350,
        width: 600,
        height: 50,
        content: 'Subtitle or Author Name',
        style: {
          fontSize: 24,
          fontFamily: 'Arial',
          color: '#666666',
          align: 'center'
        }
      }
    ]
  },
  content: {
    id: 'content',
    name: 'Content Slide',
    description: 'Title with bullet points',
    elements: [
      {
        id: 'title-element',
        type: 'text',
        x: 50,
        y: 50,
        width: 600,
        height: 80,
        content: 'Slide Title',
        style: {
          fontSize: 36,
          fontFamily: 'Arial',
          color: '#000000',
          bold: true,
          align: 'left'
        }
      },
      {
        id: 'content-element',
        type: 'text',
        x: 50,
        y: 150,
        width: 600,
        height: 400,
        content: '<ul><li>First bullet point</li><li>Second bullet point</li><li>Third bullet point</li></ul>',
        htmlContent: '<ul><li>First bullet point</li><li>Second bullet point</li><li>Third bullet point</li></ul>',
        style: {
          fontSize: 18,
          fontFamily: 'Arial',
          color: '#333333',
          align: 'left'
        }
      }
    ]
  },
  twoColumn: {
    id: 'twoColumn',
    name: 'Two Column',
    description: 'Title with two columns of content',
    elements: [
      {
        id: 'title-element',
        type: 'text',
        x: 50,
        y: 50,
        width: 600,
        height: 80,
        content: 'Slide Title',
        style: {
          fontSize: 36,
          fontFamily: 'Arial',
          color: '#000000',
          bold: true,
          align: 'left'
        }
      },
      {
        id: 'left-column',
        type: 'text',
        x: 50,
        y: 150,
        width: 280,
        height: 400,
        content: 'Left column content',
        style: {
          fontSize: 16,
          fontFamily: 'Arial',
          color: '#333333',
          align: 'left'
        }
      },
      {
        id: 'right-column',
        type: 'text',
        x: 370,
        y: 150,
        width: 280,
        height: 400,
        content: 'Right column content',
        style: {
          fontSize: 16,
          fontFamily: 'Arial',
          color: '#333333',
          align: 'left'
        }
      }
    ]
  },
  imageWithCaption: {
    id: 'imageWithCaption',
    name: 'Image with Caption',
    description: 'Large image with caption below',
    elements: [
      {
        id: 'title-element',
        type: 'text',
        x: 50,
        y: 50,
        width: 600,
        height: 80,
        content: 'Slide Title',
        style: {
          fontSize: 36,
          fontFamily: 'Arial',
          color: '#000000',
          bold: true,
          align: 'left'
        }
      },
      {
        id: 'image-placeholder',
        type: 'image',
        x: 150,
        y: 150,
        width: 400,
        height: 300,
        content: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI2U1ZTdlYiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBQbGFjZWhvbGRlcjwvdGV4dD48L3N2Zz4=',
        style: {}
      },
      {
        id: 'caption-element',
        type: 'text',
        x: 150,
        y: 470,
        width: 400,
        height: 50,
        content: 'Image caption text',
        style: {
          fontSize: 14,
          fontFamily: 'Arial',
          color: '#666666',
          align: 'center',
          italic: true
        }
      }
    ]
  },
  blank: {
    id: 'blank',
    name: 'Blank Slide',
    description: 'Empty slide to start from scratch',
    elements: []
  }
};

export const getTemplate = (templateId: string): SlideTemplate | null => {
  return SLIDE_TEMPLATES[templateId] || null;
};

export const getAllTemplates = (): SlideTemplate[] => {
  return Object.values(SLIDE_TEMPLATES);
};

