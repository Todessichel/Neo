'use client'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define types for suggestions
export type Suggestion = {
  id: string;
  text: string;
  documentType: string;
  implementationDetails: {
    section: string;
    action: string;
  };
};

// Define the context interface
interface SuggestionsContextInterface {
  suggestions: Suggestion[];
  implementedSuggestions: string[];
  addSuggestion: (suggestion: Suggestion) => void;
  removeSuggestion: (id: string) => void;
  markAsImplemented: (id: string) => void;
  getSuggestionsForDocument: (documentType: string) => Suggestion[];
  clearAllSuggestions: () => void;
}

// Create the context with a default value
export const SuggestionsContext = createContext<SuggestionsContextInterface>({
  suggestions: [],
  implementedSuggestions: [],
  addSuggestion: () => {},
  removeSuggestion: () => {},
  markAsImplemented: () => {},
  getSuggestionsForDocument: () => [],
  clearAllSuggestions: () => {},
});

// Create the provider component
export const SuggestionsProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [implementedSuggestions, setImplementedSuggestions] = useState<string[]>([]);

  // Load saved suggestions from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedSuggestions = localStorage.getItem('neoSuggestions');
        const savedImplemented = localStorage.getItem('neoImplementedSuggestions');
        
        if (savedSuggestions) {
          setSuggestions(JSON.parse(savedSuggestions));
        }
        
        if (savedImplemented) {
          setImplementedSuggestions(JSON.parse(savedImplemented));
        }
      } catch (error) {
        console.error('Error loading suggestions from localStorage:', error);
      }
    }
  }, []);

  // Save suggestions to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('neoSuggestions', JSON.stringify(suggestions));
        localStorage.setItem('neoImplementedSuggestions', JSON.stringify(implementedSuggestions));
      } catch (error) {
        console.error('Error saving suggestions to localStorage:', error);
      }
    }
  }, [suggestions, implementedSuggestions]);

  // Add a new suggestion
  const addSuggestion = (suggestion: Suggestion) => {
    setSuggestions(prev => {
      // Check if suggestion with same ID already exists
      const exists = prev.some(s => s.id === suggestion.id);
      if (exists) return prev;
      return [...prev, suggestion];
    });
  };

  // Remove a suggestion
  const removeSuggestion = (id: string) => {
    setSuggestions(prev => prev.filter(suggestion => suggestion.id !== id));
  };

  // Mark a suggestion as implemented
  const markAsImplemented = (id: string) => {
    if (!implementedSuggestions.includes(id)) {
      setImplementedSuggestions(prev => [...prev, id]);
    }
  };

  // Get suggestions for a specific document type
  const getSuggestionsForDocument = (documentType: string): Suggestion[] => {
    return suggestions.filter(suggestion => suggestion.documentType === documentType);
  };

  // Clear all suggestions
  const clearAllSuggestions = () => {
    setSuggestions([]);
    setImplementedSuggestions([]);
  };

  // Create the context value object
  const contextValue: SuggestionsContextInterface = {
    suggestions,
    implementedSuggestions,
    addSuggestion,
    removeSuggestion,
    markAsImplemented,
    getSuggestionsForDocument,
    clearAllSuggestions
  };

  return (
    <SuggestionsContext.Provider value={contextValue}>
      {children}
    </SuggestionsContext.Provider>
  );
};

/*Custom hook for using the suggestions context
export const useSuggestionsOriginal = () => {
  const context = useContext(SuggestionsContext);
  
  if (context === undefined) {
    throw new Error('useSuggestions must be used within a SuggestionsProvider');
  }
  
  return context;
};*/

//export const SuggestionsContext;