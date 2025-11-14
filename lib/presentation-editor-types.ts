export interface EditorElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'table' | 'chart';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string; // Plain text content (for backward compatibility)
  htmlContent?: string; // Rich text HTML content
  tableData?: {
    rows: number;
    cols: number;
    cells: string[][];
    headerRow?: boolean;
    borderColor?: string;
    borderWidth?: number;
    cellPadding?: number;
  };
  chartData?: {
    type: 'bar' | 'line' | 'pie' | 'area';
    data: Array<Record<string, any>>;
    dataKey: string;
    nameKey: string;
    colors?: string[];
    title?: string;
  };
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

export interface EditorSlide {
  id: string;
  title: string;
  content: string;
  slide_type: string;
  order: number;
  elements: EditorElement[];
}

