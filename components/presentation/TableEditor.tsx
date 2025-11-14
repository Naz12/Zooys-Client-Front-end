"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Minus, 
  Trash2,
  X
} from 'lucide-react';

export interface TableData {
  rows: number;
  cols: number;
  cells: string[][];
  headerRow?: boolean;
  borderColor?: string;
  borderWidth?: number;
  cellPadding?: number;
}

interface TableEditorProps {
  tableData: TableData;
  onSave: (tableData: TableData) => void;
  onCancel: () => void;
}

const TableEditor: React.FC<TableEditorProps> = ({
  tableData,
  onSave,
  onCancel
}) => {
  const [data, setData] = useState<TableData>(tableData);

  const updateCell = (row: number, col: number, value: string) => {
    const newCells = [...data.cells];
    if (!newCells[row]) newCells[row] = [];
    newCells[row][col] = value;
    setData({ ...data, cells: newCells });
  };

  const addRow = () => {
    const newRow = Array(data.cols).fill('');
    setData({
      ...data,
      rows: data.rows + 1,
      cells: [...data.cells, newRow]
    });
  };

  const removeRow = (rowIndex: number) => {
    if (data.rows <= 1) return;
    const newCells = data.cells.filter((_, idx) => idx !== rowIndex);
    setData({
      ...data,
      rows: data.rows - 1,
      cells: newCells
    });
  };

  const addColumn = () => {
    const newCells = data.cells.map(row => [...row, '']);
    setData({
      ...data,
      cols: data.cols + 1,
      cells: newCells
    });
  };

  const removeColumn = (colIndex: number) => {
    if (data.cols <= 1) return;
    const newCells = data.cells.map(row => row.filter((_, idx) => idx !== colIndex));
    setData({
      ...data,
      cols: data.cols - 1,
      cells: newCells
    });
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Edit Table</h3>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Table Controls */}
      <div className="flex items-center space-x-2">
        <Button
          onClick={addRow}
          variant="outline"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Row
        </Button>
        <Button
          onClick={addColumn}
          variant="outline"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Column
        </Button>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="headerRow"
            checked={data.headerRow}
            onChange={(e) => setData({ ...data, headerRow: e.target.checked })}
            className="rounded"
          />
          <Label htmlFor="headerRow" className="text-sm">Header Row</Label>
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-300 rounded-md overflow-auto max-h-96">
        <table className="w-full border-collapse">
          <tbody>
            {data.cells.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={data.headerRow && rowIndex === 0 ? 'bg-gray-100 font-semibold' : ''}
              >
                {row.map((cell, colIndex) => (
                  <td
                    key={`${rowIndex}-${colIndex}`}
                    className="border border-gray-300 p-2"
                    style={{
                      minWidth: '100px',
                      borderColor: data.borderColor || '#d1d5db',
                      borderWidth: `${data.borderWidth || 1}px`
                    }}
                  >
                    <Input
                      value={cell || ''}
                      onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                      className="border-0 p-1 h-auto min-h-[32px]"
                      placeholder={`Cell ${rowIndex + 1},${colIndex + 1}`}
                    />
                  </td>
                ))}
                <td className="border border-gray-300 p-2 w-12">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRow(rowIndex)}
                    disabled={data.rows <= 1}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </td>
              </tr>
            ))}
            <tr>
              {Array(data.cols).fill(0).map((_, colIndex) => (
                <td key={colIndex} className="border border-gray-300 p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeColumn(colIndex)}
                    disabled={data.cols <= 1}
                  >
                    <Minus className="h-4 w-4 text-red-500" />
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Styling Options */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Label className="text-sm w-24">Border Color:</Label>
          <Input
            type="color"
            value={data.borderColor || '#d1d5db'}
            onChange={(e) => setData({ ...data, borderColor: e.target.value })}
            className="w-20 h-8"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Label className="text-sm w-24">Border Width:</Label>
          <Input
            type="number"
            min="0"
            max="5"
            value={data.borderWidth || 1}
            onChange={(e) => setData({ ...data, borderWidth: Number(e.target.value) })}
            className="w-20"
          />
        </div>
      </div>

      <div className="flex space-x-2">
        <Button onClick={() => onSave(data)} className="flex-1">
          Save Table
        </Button>
        <Button onClick={onCancel} variant="outline" className="flex-1">
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default TableEditor;

