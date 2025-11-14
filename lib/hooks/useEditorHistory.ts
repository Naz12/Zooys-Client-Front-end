import { useState, useCallback, useRef } from 'react';
import { EditorSlide } from '@/lib/presentation-editor-types';

interface HistoryState {
  slides: EditorSlide[];
  currentSlideIndex: number;
  selectedElement: string | null;
  presentationTitle: string;
}

const MAX_HISTORY_SIZE = 50;

export const useEditorHistory = (initialState: HistoryState) => {
  const [history, setHistory] = useState<HistoryState[]>([initialState]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const isUndoingRef = useRef(false);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const saveState = useCallback((state: HistoryState) => {
    if (isUndoingRef.current) {
      isUndoingRef.current = false;
      return;
    }

    setHistory(prevHistory => {
      // Remove any history after current index (when new action after undo)
      const newHistory = prevHistory.slice(0, historyIndex + 1);
      
      // Add new state
      newHistory.push(state);
      
      // Limit history size
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift();
        return newHistory;
      }
      
      return newHistory;
    });
    
    setHistoryIndex(prev => {
      const newIndex = prev + 1;
      return newIndex >= MAX_HISTORY_SIZE ? MAX_HISTORY_SIZE - 1 : newIndex;
    });
  }, [historyIndex]);

  const undo = useCallback((): HistoryState | null => {
    if (!canUndo) return null;
    
    isUndoingRef.current = true;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    return history[newIndex];
  }, [canUndo, historyIndex, history]);

  const redo = useCallback((): HistoryState | null => {
    if (!canRedo) return null;
    
    isUndoingRef.current = true;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    return history[newIndex];
  }, [canRedo, historyIndex, history]);

  const clearHistory = useCallback(() => {
    setHistory([initialState]);
    setHistoryIndex(0);
  }, [initialState]);

  return {
    saveState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory
  };
};

