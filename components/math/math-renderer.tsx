"use client";

import React, { useEffect, useRef, useState } from "react";

interface MathRendererProps {
  latex: string;
  className?: string;
  onElementClick?: (elementId: string, element: any) => void;
  editableElements?: EditableElement[];
}

interface EditableElement {
  id: string;
  type: 'number' | 'variable' | 'exponent' | 'function' | 'operator';
  value: string;
  latex: string;
  position?: { x: number; y: number; width: number; height: number };
  editable: boolean;
}

export default function MathRenderer({ 
  latex, 
  className = "", 
  onElementClick,
  editableElements = []
}: MathRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendered, setIsRendered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || !latex.trim()) return;

    const renderMath = async () => {
      try {
        setError(null);
        
        // Clear previous content
        if (containerRef.current) {
          containerRef.current.innerHTML = '';
        }

        // Simple LaTeX to HTML conversion for common symbols
        const convertedLatex = convertLatexToHtml(latex);
        
        if (containerRef.current) {
          containerRef.current.innerHTML = convertedLatex;
          
          // Add click handlers to editable elements
          editableElements.forEach(element => {
            const elementEl = containerRef.current?.querySelector(`[data-element-id="${element.id}"]`);
            if (elementEl) {
              elementEl.addEventListener('click', (e) => {
                e.stopPropagation();
                onElementClick?.(element.id, element);
              });
            }
          });
        }
        
        setIsRendered(true);
      } catch (err) {
        console.error('Math rendering error:', err);
        setError('Failed to render math expression');
        setIsRendered(false);
      }
    };

    renderMath();
  }, [latex, editableElements, onElementClick]);

  const convertLatexToHtml = (latex: string): string => {
    let html = latex;
    
    // Convert common LaTeX symbols to HTML entities and styled elements
    // Order matters - more specific patterns first
    const conversions = [
      // Complex patterns first
      { latex: /\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, html: '<span class="math-nth-root"><sup>$1</sup>√<span class="math-radicand">$2</span></span>' },
      { latex: /\\sqrt\{([^}]+)\}/g, html: '<span class="math-sqrt">√<span class="math-radicand">$1</span></span>' },
      { latex: /\\frac\{([^}]+)\}\{([^}]+)\}/g, html: '<span class="math-fraction"><span class="math-numerator">$1</span><span class="math-denominator">$2</span></span>' },
      
      // Functions
      { latex: /\\arcsin/g, html: '<span class="math-function">arcsin</span>' },
      { latex: /\\arccos/g, html: '<span class="math-function">arccos</span>' },
      { latex: /\\arctan/g, html: '<span class="math-function">arctan</span>' },
      { latex: /\\sin/g, html: '<span class="math-function">sin</span>' },
      { latex: /\\cos/g, html: '<span class="math-function">cos</span>' },
      { latex: /\\tan/g, html: '<span class="math-function">tan</span>' },
      { latex: /\\cot/g, html: '<span class="math-function">cot</span>' },
      { latex: /\\sec/g, html: '<span class="math-function">sec</span>' },
      { latex: /\\csc/g, html: '<span class="math-function">csc</span>' },
      { latex: /\\log/g, html: '<span class="math-function">log</span>' },
      { latex: /\\ln/g, html: '<span class="math-function">ln</span>' },
      { latex: /\\exp/g, html: '<span class="math-function">exp</span>' },
      
      // Powers and subscripts
      { latex: /\^(\d+)/g, html: '<sup class="math-superscript">$1</sup>' },
      { latex: /\^([a-zA-Z])/g, html: '<sup class="math-superscript">$1</sup>' },
      { latex: /_(\d+)/g, html: '<sub class="math-subscript">$1</sub>' },
      { latex: /_([a-zA-Z])/g, html: '<sub class="math-subscript">$1</sub>' },
      
      // Basic symbols
      { latex: /\\pi/g, html: '<span class="math-symbol">π</span>' },
      { latex: /\\infty/g, html: '<span class="math-symbol">∞</span>' },
      { latex: /\\pm/g, html: '<span class="math-symbol">±</span>' },
      { latex: /\\mp/g, html: '<span class="math-symbol">∓</span>' },
      { latex: /\\cdot/g, html: '<span class="math-symbol">·</span>' },
      { latex: /\\times/g, html: '<span class="math-symbol">×</span>' },
      { latex: /\\div/g, html: '<span class="math-symbol">÷</span>' },
      
      // Integrals and sums
      { latex: /\\int/g, html: '<span class="math-symbol">∫</span>' },
      { latex: /\\sum/g, html: '<span class="math-symbol">∑</span>' },
      { latex: /\\prod/g, html: '<span class="math-symbol">∏</span>' },
      { latex: /\\partial/g, html: '<span class="math-symbol">∂</span>' },
      { latex: /\\nabla/g, html: '<span class="math-symbol">∇</span>' },
      { latex: /\\Delta/g, html: '<span class="math-symbol">∆</span>' },
      
      // Greek letters
      { latex: /\\alpha/g, html: '<span class="math-symbol">α</span>' },
      { latex: /\\beta/g, html: '<span class="math-symbol">β</span>' },
      { latex: /\\gamma/g, html: '<span class="math-symbol">γ</span>' },
      { latex: /\\delta/g, html: '<span class="math-symbol">δ</span>' },
      { latex: /\\epsilon/g, html: '<span class="math-symbol">ε</span>' },
      { latex: /\\theta/g, html: '<span class="math-symbol">θ</span>' },
      { latex: /\\lambda/g, html: '<span class="math-symbol">λ</span>' },
      { latex: /\\mu/g, html: '<span class="math-symbol">μ</span>' },
      { latex: /\\sigma/g, html: '<span class="math-symbol">σ</span>' },
      { latex: /\\phi/g, html: '<span class="math-symbol">φ</span>' },
      { latex: /\\omega/g, html: '<span class="math-symbol">ω</span>' },
      
      // Relations
      { latex: /\\leq/g, html: '<span class="math-symbol">≤</span>' },
      { latex: /\\geq/g, html: '<span class="math-symbol">≥</span>' },
      { latex: /\\neq/g, html: '<span class="math-symbol">≠</span>' },
      { latex: /\\approx/g, html: '<span class="math-symbol">≈</span>' },
      { latex: /\\equiv/g, html: '<span class="math-symbol">≡</span>' },
      
      // Set theory
      { latex: /\\in/g, html: '<span class="math-symbol">∈</span>' },
      { latex: /\\notin/g, html: '<span class="math-symbol">∉</span>' },
      { latex: /\\cup/g, html: '<span class="math-symbol">∪</span>' },
      { latex: /\\cap/g, html: '<span class="math-symbol">∩</span>' },
      { latex: /\\subset/g, html: '<span class="math-symbol">⊂</span>' },
      { latex: /\\supset/g, html: '<span class="math-symbol">⊃</span>' },
      { latex: /\\emptyset/g, html: '<span class="math-symbol">∅</span>' },
      
      // Brackets
      { latex: /\\left\(/g, html: '<span class="math-bracket">(</span>' },
      { latex: /\\right\)/g, html: '<span class="math-bracket">)</span>' },
      { latex: /\\left\[/g, html: '<span class="math-bracket">[</span>' },
      { latex: /\\right\]/g, html: '<span class="math-bracket">]</span>' },
      { latex: /\\left\{/g, html: '<span class="math-bracket">{</span>' },
      { latex: /\\right\}/g, html: '<span class="math-bracket">}</span>' },
    ];

    // Apply conversions
    conversions.forEach(conversion => {
      html = html.replace(conversion.latex, conversion.html);
    });

    // Add data attributes for editable elements
    editableElements.forEach(element => {
      const regex = new RegExp(`\\b${element.value}\\b`, 'g');
      html = html.replace(regex, `<span class="math-editable" data-element-id="${element.id}">${element.value}</span>`);
    });

    return html;
  };

  if (error) {
    return (
      <div className={`text-red-500 text-sm ${className}`}>
        Error: {error}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`math-renderer ${className}`}
      style={{
        fontFamily: 'Times New Roman, serif',
        fontSize: '1.2em',
        lineHeight: '1.4',
        color: 'inherit'
      }}
    />
  );
}

// Add CSS styles for math rendering
const mathStyles = `
  .math-renderer {
    font-family: 'Times New Roman', serif;
    font-size: 1.2em;
    line-height: 1.4;
  }
  
  .math-symbol {
    font-style: normal;
    font-weight: normal;
    font-size: 1.1em;
  }
  
  .math-function {
    font-style: normal;
    font-weight: normal;
    font-family: 'Times New Roman', serif;
    font-size: 1em;
  }
  
  .math-superscript {
    font-size: 0.7em;
    vertical-align: super;
    line-height: 0;
    position: relative;
    top: -0.3em;
  }
  
  .math-subscript {
    font-size: 0.7em;
    vertical-align: sub;
    line-height: 0;
    position: relative;
    bottom: -0.3em;
  }
  
  .math-sqrt {
    position: relative;
    display: inline-block;
    margin-left: 0.3em;
  }
  
  .math-sqrt::before {
    content: '√';
    position: absolute;
    left: -0.4em;
    top: 0;
    font-size: 1.2em;
    font-weight: bold;
  }
  
  .math-radicand {
    border-top: 1px solid currentColor;
    padding-left: 0.2em;
    margin-left: 0.1em;
    display: inline-block;
  }
  
  .math-nth-root {
    position: relative;
    display: inline-block;
    margin-left: 0.3em;
  }
  
  .math-nth-root sup {
    position: absolute;
    left: -0.6em;
    top: -0.2em;
    font-size: 0.6em;
  }
  
  .math-nth-root::after {
    content: '√';
    position: absolute;
    left: -0.4em;
    top: 0;
    font-size: 1.2em;
    font-weight: bold;
  }
  
  .math-fraction {
    display: inline-block;
    vertical-align: middle;
    text-align: center;
    margin: 0 0.2em;
  }
  
  .math-numerator {
    display: block;
    border-bottom: 1px solid currentColor;
    padding-bottom: 1px;
    margin-bottom: 1px;
  }
  
  .math-denominator {
    display: block;
    padding-top: 1px;
  }
  
  .math-editable {
    background-color: rgba(59, 130, 246, 0.1);
    border-radius: 2px;
    padding: 1px 2px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .math-editable:hover {
    background-color: rgba(59, 130, 246, 0.2);
  }
  
  .math-editable.selected {
    background-color: rgba(59, 130, 246, 0.3);
  }
  
  .math-bracket {
    font-weight: bold;
    font-size: 1.1em;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = mathStyles;
  document.head.appendChild(styleSheet);
}
