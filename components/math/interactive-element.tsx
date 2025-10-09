"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Check } from "lucide-react";

interface InteractiveElementProps {
  element: EditableElement;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: (elementId: string) => void;
  onEdit: (elementId: string, newValue: string) => void;
  onCancel: () => void;
  onConfirm: (elementId: string, newValue: string) => void;
  position: { x: number; y: number; width: number; height: number };
}

interface EditableElement {
  id: string;
  type: 'number' | 'variable' | 'exponent' | 'function' | 'operator';
  value: string;
  latex: string;
  editable: boolean;
}

export default function InteractiveElement({
  element,
  isSelected,
  isEditing,
  onSelect,
  onEdit,
  onCancel,
  onConfirm,
  position
}: InteractiveElementProps) {
  const [editValue, setEditValue] = useState(element.value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!isEditing) {
      onSelect(element.id);
    }
  };

  const handleDoubleClick = () => {
    if (element.editable) {
      onEdit(element.id, element.value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onConfirm(element.id, editValue);
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value);
  };

  const handleConfirm = () => {
    onConfirm(element.id, editValue);
  };

  const handleCancel = () => {
    setEditValue(element.value);
    onCancel();
  };

  if (isEditing) {
    return (
      <div
        className="fixed z-50 bg-white dark:bg-gray-800 border border-blue-500 rounded shadow-lg p-2"
        style={{
          left: position.x,
          top: position.y - 40,
          minWidth: Math.max(position.width, 100)
        }}
      >
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={editValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            className="text-sm"
            placeholder={`Enter ${element.type}`}
          />
          <Button
            size="sm"
            onClick={handleConfirm}
            className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700"
          >
            <Check size={12} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            className="h-8 w-8 p-0"
          >
            <X size={12} />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <span
      className={`math-editable-element inline-block cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'bg-blue-500 text-white' 
          : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800'
      }`}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      style={{
        padding: '1px 4px',
        borderRadius: '3px',
        fontSize: 'inherit',
        fontFamily: 'inherit'
      }}
      title={`Click to select, double-click to edit ${element.type}`}
    >
      {element.value}
    </span>
  );
}

// CSS styles for interactive elements
const interactiveStyles = `
  .math-editable-element {
    transition: all 0.2s ease;
    user-select: none;
  }
  
  .math-editable-element:hover {
    transform: scale(1.05);
  }
  
  .math-editable-element.selected {
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = interactiveStyles;
  document.head.appendChild(styleSheet);
}
