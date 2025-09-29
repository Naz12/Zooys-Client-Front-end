"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

// Define the tab values that match the dashboard tabs
export type TabValue = 
  | "summary" 
  | "youtube" 
  | "chat" 
  | "presentation" 
  | "pdf" 
  | "writer" 
  | "math" 
  | "flashcards" 
  | "diagram";

// Define the context type
interface TabContextType {
  activeTab: TabValue;
  setActiveTab: (tab: TabValue) => void;
}

// Create the context
const TabContext = createContext<TabContextType | undefined>(undefined);

// Provider component
interface TabProviderProps {
  children: React.ReactNode;
}

export function TabProvider({ children }: TabProviderProps) {
  const [activeTab, setActiveTab] = useState<TabValue>("summary");

  // Optional: Persist tab state to localStorage
  useEffect(() => {
    const savedTab = localStorage.getItem('activeTab') as TabValue;
    if (savedTab && isValidTab(savedTab)) {
      setActiveTab(savedTab);
    }
  }, []);

  // Save to localStorage when tab changes
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  // Validate tab value
  const isValidTab = (tab: string): tab is TabValue => {
    const validTabs: TabValue[] = [
      "summary", "youtube", "chat", "presentation", 
      "pdf", "writer", "math", "flashcards", "diagram"
    ];
    return validTabs.includes(tab as TabValue);
  };

  // Safe setter that validates the tab
  const handleSetActiveTab = (tab: TabValue) => {
    if (isValidTab(tab)) {
      setActiveTab(tab);
    } else {
      console.warn(`Invalid tab value: ${tab}. Defaulting to summary.`);
      setActiveTab("summary");
    }
  };

  const value: TabContextType = {
    activeTab,
    setActiveTab: handleSetActiveTab,
  };

  return (
    <TabContext.Provider value={value}>
      {children}
    </TabContext.Provider>
  );
}

// Custom hook to use the tab context
export function useTabState() {
  const context = useContext(TabContext);
  
  if (context === undefined) {
    throw new Error('useTabState must be used within a TabProvider');
  }
  
  return context;
}
