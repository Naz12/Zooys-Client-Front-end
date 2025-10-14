"use client";

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { 
  PresentationOutline, 
  PresentationTemplate
} from './presentation-api-client';

// Workflow State Types
export interface WorkflowState {
  currentStep: number;
  isGenerating: boolean;
  error: string | null;
  
  // Step 1: Input & Configuration
  inputData: {
    inputType: 'text' | 'file' | 'url' | 'youtube';
    topic: string;
    language: string;
    tone: string;
    length: string;
    model: string;
    file: File | null;
    url: string;
    youtubeUrl: string;
  };
  
  // Step 2: Outline
  outline: PresentationOutline | null;
  aiResultId: number | null;
  
  // Step 3: Template
  selectedTemplate: string | null;
  templateData: Record<string, PresentationTemplate> | null;
  
  // Step 4: Generation
  generationStatus: 'idle' | 'generating' | 'completed' | 'error';
  downloadUrl: string | null;
  powerpointFile: string | null;
  fileSize: number | null;
  slideCount: number | null;
}

// Action Types
export type WorkflowAction =
  | { type: 'SET_STEP'; payload: number }
  | { type: 'SET_GENERATING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_INPUT_DATA'; payload: Partial<WorkflowState['inputData']> }
  | { type: 'SET_OUTLINE'; payload: { outline: PresentationOutline; aiResultId: number } }
  | { type: 'UPDATE_OUTLINE'; payload: PresentationOutline }
  | { type: 'SET_TEMPLATE_DATA'; payload: Record<string, PresentationTemplate> }
  | { type: 'SELECT_TEMPLATE'; payload: string }
  | { type: 'SET_GENERATION_STATUS'; payload: WorkflowState['generationStatus'] }
  | { type: 'SET_DOWNLOAD_DATA'; payload: { downloadUrl: string; powerpointFile: string; fileSize: number; slideCount: number } }
  | { type: 'RESET_WORKFLOW' }
  | { type: 'RESET_TO_STEP'; payload: number };

// Initial State
const initialState: WorkflowState = {
  currentStep: 1,
  isGenerating: false,
  error: null,
  
  inputData: {
    inputType: 'text',
    topic: '',
    language: 'English',
    tone: 'Professional',
    length: 'Medium',
    model: 'gpt-3.5-turbo',
    file: null,
    url: '',
    youtubeUrl: '',
  },
  
  outline: null,
  aiResultId: null,
  
  selectedTemplate: null,
  templateData: null,
  
  generationStatus: 'idle',
  downloadUrl: null,
  powerpointFile: null,
  fileSize: null,
  slideCount: null,
};

// Reducer
function workflowReducer(state: WorkflowState, action: WorkflowAction): WorkflowState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload, error: null };
    
    case 'SET_GENERATING':
      return { ...state, isGenerating: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isGenerating: false };
    
    case 'SET_INPUT_DATA':
      return { 
        ...state, 
        inputData: { ...state.inputData, ...action.payload },
        error: null 
      };
    
    case 'SET_OUTLINE':
      return { 
        ...state, 
        outline: action.payload.outline,
        aiResultId: action.payload.aiResultId,
        currentStep: 2,
        isGenerating: false,
        error: null
      };
    
    case 'UPDATE_OUTLINE':
      return { 
        ...state, 
        outline: action.payload,
        error: null 
      };
    
    case 'SET_TEMPLATE_DATA':
      return { 
        ...state, 
        templateData: action.payload,
        error: null 
      };
    
    case 'SELECT_TEMPLATE':
      return { 
        ...state, 
        selectedTemplate: action.payload,
        currentStep: 4,
        error: null 
      };
    
    case 'SET_GENERATION_STATUS':
      return { 
        ...state, 
        generationStatus: action.payload,
        isGenerating: action.payload === 'generating',
        error: action.payload === 'error' ? 'Generation failed' : null
      };
    
    case 'SET_DOWNLOAD_DATA':
      console.log('SET_DOWNLOAD_DATA action received with payload:', action.payload);
      const newState = { 
        ...state, 
        downloadUrl: action.payload.downloadUrl,
        powerpointFile: action.payload.powerpointFile,
        fileSize: action.payload.fileSize,
        slideCount: action.payload.slideCount,
        generationStatus: 'completed',
        isGenerating: false,
        error: null
      };
      console.log('New state after SET_DOWNLOAD_DATA:', newState);
      return newState;
    
    case 'RESET_WORKFLOW':
      return initialState;
    
    case 'RESET_TO_STEP':
      return {
        ...state,
        currentStep: action.payload,
        error: null,
        isGenerating: false,
        // Reset subsequent steps
        ...(action.payload < 2 && { outline: null, aiResultId: null }),
        ...(action.payload < 3 && { selectedTemplate: null, templateData: null }),
        ...(action.payload < 4 && { 
          generationStatus: 'idle', 
          downloadUrl: null, 
          powerpointFile: null,
          fileSize: null,
          slideCount: null
        }),
      };
    
    default:
      return state;
  }
}

// Context
interface WorkflowContextType {
  state: WorkflowState;
  dispatch: React.Dispatch<WorkflowAction>;
  
  // Helper functions
  canProceedToStep: (step: number) => boolean;
  getStepStatus: (step: number) => 'completed' | 'current' | 'pending' | 'disabled';
  resetWorkflow: () => void;
  resetToStep: (step: number) => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

// Provider Component
interface WorkflowProviderProps {
  children: ReactNode;
}

export function WorkflowProvider({ children }: WorkflowProviderProps) {
  const [state, dispatch] = useReducer(workflowReducer, initialState);

  // Helper functions
  const canProceedToStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return true; // Always can start
      case 2:
        return state.outline !== null && state.aiResultId !== null;
      case 3:
        return state.outline !== null && state.aiResultId !== null;
      case 4:
        return state.selectedTemplate !== null;
      default:
        return false;
    }
  };

  const getStepStatus = (step: number): 'completed' | 'current' | 'pending' | 'disabled' => {
    if (step < state.currentStep) {
      return 'completed';
    } else if (step === state.currentStep) {
      return 'current';
    } else if (canProceedToStep(step)) {
      return 'pending';
    } else {
      return 'disabled';
    }
  };

  const resetWorkflow = () => {
    dispatch({ type: 'RESET_WORKFLOW' });
  };

  const resetToStep = (step: number) => {
    dispatch({ type: 'RESET_TO_STEP', payload: step });
  };

  const contextValue: WorkflowContextType = {
    state,
    dispatch,
    canProceedToStep,
    getStepStatus,
    resetWorkflow,
    resetToStep,
  };

  return (
    <WorkflowContext.Provider value={contextValue}>
      {children}
    </WorkflowContext.Provider>
  );
}

// Hook to use the workflow context
export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
}

// Export types for use in components
export type { WorkflowState, WorkflowAction };
