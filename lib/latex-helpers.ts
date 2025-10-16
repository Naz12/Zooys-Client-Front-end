/**
 * LaTeX Helper Utilities for Math Input
 * Provides validation, completion, and formatting functions for LaTeX expressions
 */

export interface LatexValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CursorPosition {
  newText: string;
  newCursorPos: number;
}

/**
 * Validate LaTeX input and return errors/warnings
 */
export function validateLatex(input: string): LatexValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for unmatched brackets
  const bracketPairs = [
    { open: '(', close: ')' },
    { open: '{', close: '}' },
    { open: '[', close: ']' }
  ];
  
  for (const pair of bracketPairs) {
    const openCount = (input.match(new RegExp('\\' + pair.open, 'g')) || []).length;
    const closeCount = (input.match(new RegExp('\\' + pair.close, 'g')) || []).length;
    
    if (openCount !== closeCount) {
      if (openCount > closeCount) {
        errors.push(`Missing ${openCount - closeCount} closing ${pair.close} bracket(s)`);
      } else {
        errors.push(`Extra ${closeCount - openCount} closing ${pair.close} bracket(s)`);
      }
    }
  }
  
  // Check for common LaTeX syntax errors
  const commonErrors = [
    { pattern: /\\[a-zA-Z]+\s*$/, message: "Incomplete LaTeX command at end of input" },
    { pattern: /\\[a-zA-Z]+\{[^}]*$/, message: "Unclosed LaTeX command brace" },
    { pattern: /\\[a-zA-Z]+\([^)]*$/, message: "Unclosed LaTeX command parenthesis" },
    { pattern: /\\[a-zA-Z]+\[[^\]]*$/, message: "Unclosed LaTeX command bracket" }
  ];
  
  for (const error of commonErrors) {
    if (error.pattern.test(input)) {
      errors.push(error.message);
    }
  }
  
  // Check for warnings
  if (input.includes('\\frac') && !input.includes('\\frac{}{}')) {
    warnings.push("Consider using \\frac{numerator}{denominator} format");
  }
  
  if (input.includes('^') && !input.match(/\^{[^}]+}/)) {
    warnings.push("Consider using ^{} for superscripts");
  }
  
  if (input.includes('_') && !input.match(/_{[^}]+}/)) {
    warnings.push("Consider using _{} for subscripts");
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Insert LaTeX at cursor position with smart positioning
 */
export function insertLatexAtCursor(text: string, latex: string, cursorPos: number): CursorPosition {
  const beforeCursor = text.substring(0, cursorPos);
  const afterCursor = text.substring(cursorPos);
  
  let newText = beforeCursor + latex + afterCursor;
  let newCursorPos = cursorPos + latex.length;
  
  // Smart cursor positioning for common LaTeX commands
  const smartPositioning = {
    '\\log(': { pos: cursorPos + 5, text: beforeCursor + '\\log()' + afterCursor },
    '\\ln(': { pos: cursorPos + 4, text: beforeCursor + '\\ln()' + afterCursor },
    '\\sin(': { pos: cursorPos + 5, text: beforeCursor + '\\sin()' + afterCursor },
    '\\cos(': { pos: cursorPos + 5, text: beforeCursor + '\\cos()' + afterCursor },
    '\\tan(': { pos: cursorPos + 5, text: beforeCursor + '\\tan()' + afterCursor },
    '\\sqrt{': { pos: cursorPos + 6, text: beforeCursor + '\\sqrt{}' + afterCursor },
    '\\frac{}{}': { pos: cursorPos + 6, text: beforeCursor + '\\frac{}{}' + afterCursor },
    '\\int': { pos: cursorPos + 4, text: beforeCursor + '\\int' + afterCursor },
    '\\sum': { pos: cursorPos + 4, text: beforeCursor + '\\sum' + afterCursor },
    '\\lim': { pos: cursorPos + 4, text: beforeCursor + '\\lim' + afterCursor }
  };
  
  if (smartPositioning[latex as keyof typeof smartPositioning]) {
    const positioning = smartPositioning[latex as keyof typeof smartPositioning];
    newText = positioning.text;
    newCursorPos = positioning.pos;
  }
  
  return { newText, newCursorPos };
}

/**
 * Get LaTeX completions for a given prefix
 */
export function getLatexCompletions(prefix: string): string[] {
  const completions: Record<string, string[]> = {
    '\\l': ['\\log(', '\\ln(', '\\lim(', '\\left(', '\\leq', '\\lambda'],
    '\\s': ['\\sin(', '\\sqrt{', '\\sum', '\\subset', '\\sigma'],
    '\\c': ['\\cos(', '\\cot(', '\\csc(', '\\cup', '\\cap', '\\cdot'],
    '\\t': ['\\tan(', '\\times', '\\theta', '\\tau'],
    '\\sq': ['\\sqrt{'],
    '\\f': ['\\frac{}{}', '\\forall', '\\frac'],
    '\\i': ['\\int', '\\infty', '\\in', '\\inf'],
    '\\su': ['\\sum', '\\subset', '\\supset', '\\sup'],
    '\\li': ['\\lim', '\\lim_{}', '\\lim_{x \\to }'],
    '\\e': ['\\exp(', '\\exists', '\\epsilon', '\\eta'],
    '\\a': ['\\alpha', '\\arcsin(', '\\arccos(', '\\arctan(', '\\abs{'],
    '\\n': ['\\norm{', '\\neq', '\\nu'],
    '\\g': ['\\gamma', '\\geq', '\\gcd'],
    '\\th': ['\\theta', '\\therefore'],
    '\\b': ['\\beta', '\\binom{}{}'],
    '\\d': ['\\delta', '\\div', '\\Delta'],
    '\\p': ['\\pi', '\\pm', '\\prod', '\\partial'],
    '\\o': ['\\omega', '\\Omega', '\\oplus', '\\otimes']
  };
  
  return completions[prefix] || [];
}

/**
 * Format LaTeX command for display
 */
export function formatLatexCommand(command: string): string {
  // Remove backslashes and format for display
  return command.replace(/\\/g, '').replace(/\{/g, '').replace(/\}/g, '');
}

/**
 * Extract all LaTeX expressions from text
 */
export function extractLatexExpressions(text: string): string[] {
  const latexRegex = /\\[a-zA-Z]+(?:\{[^}]*\}|\([^)]*\)|\[[^\]]*\]|[^a-zA-Z\s])?/g;
  const expressions: string[] = [];
  let match;
  
  while ((match = latexRegex.exec(text)) !== null) {
    expressions.push(match[0]);
  }
  
  return [...new Set(expressions)]; // Remove duplicates
}

/**
 * Check if text contains LaTeX expressions
 */
export function containsLatex(text: string): boolean {
  const latexPatterns = [
    /\\[a-zA-Z]+\{/,  // \command{
    /\\[a-zA-Z]+\(/,  // \command(
    /\\[a-zA-Z]+\[/,  // \command[
    /\^[a-zA-Z0-9]/,  // ^superscript
    /_[a-zA-Z0-9]/,   // _subscript
    /\\[a-zA-Z]+/,    // \command
    /\\[^a-zA-Z]/     // \symbol
  ];
  
  return latexPatterns.some(pattern => pattern.test(text));
}

/**
 * Get tab completion for LaTeX prefix
 */
export function getTabCompletion(prefix: string): string | null {
  const completions: Record<string, string> = {
    '\\l': '\\log(',
    '\\ln': '\\ln(',
    '\\s': '\\sin(',
    '\\c': '\\cos(',
    '\\t': '\\tan(',
    '\\sq': '\\sqrt{',
    '\\f': '\\frac{}{}',
    '\\i': '\\int',
    '\\su': '\\sum',
    '\\li': '\\lim',
    '\\e': '\\exp(',
    '\\a': '\\alpha',
    '\\n': '\\norm{',
    '\\g': '\\gamma',
    '\\th': '\\theta',
    '\\b': '\\beta',
    '\\d': '\\delta',
    '\\p': '\\pi',
    '\\o': '\\omega'
  };
  
  return completions[prefix] || null;
}

/**
 * Auto-close brackets with smart positioning
 */
export function autoCloseBrackets(text: string, cursorPos: number): CursorPosition {
  const charBefore = text[cursorPos - 1];
  const charAfter = text[cursorPos];
  
  const bracketPairs: Record<string, string> = {
    '(': ')',
    '{': '}',
    '[': ']'
  };
  
  if (charBefore in bracketPairs && charAfter !== bracketPairs[charBefore]) {
    const closingBracket = bracketPairs[charBefore];
    const newText = text.substring(0, cursorPos) + closingBracket + text.substring(cursorPos);
    return { newText, newCursorPos: cursorPos };
  }
  
  return { newText: text, newCursorPos: cursorPos };
}

/**
 * Smart backspace for auto-closed brackets
 */
export function smartBackspace(text: string, cursorPos: number): CursorPosition | null {
  const charBefore = text[cursorPos - 1];
  const charAfter = text[cursorPos];
  
  const bracketPairs: Record<string, string> = {
    '(': ')',
    '{': '}',
    '[': ']'
  };
  
  // If deleting an opening bracket and there's a matching closing bracket right after
  if (charBefore in bracketPairs && charAfter === bracketPairs[charBefore]) {
    const newText = text.substring(0, cursorPos - 1) + text.substring(cursorPos + 1);
    return { newText, newCursorPos: cursorPos - 1 };
  }
  
  return null; // No smart backspace needed
}


