// hooks/useSuggestions.ts
import { useContext } from 'react';
import { SuggestionsContext, Suggestion } from '../contexts/SuggestionsContext';
import { DocumentType } from '../contexts/DocumentContext';

/**
 * Custom hook for accessing and managing suggestions and inconsistencies
 * @returns Suggestions context state and methods
 */
export const useSuggestions = () => {
  const context = useContext(SuggestionsContext);
  
  if (!context) {
    throw new Error('useSuggestions must be used within a SuggestionsProvider');
  }
  
  // Extract the values from context
  const {
    suggestions,
    implementedSuggestions,
    addSuggestion,
    removeSuggestion,
    markAsImplemented,
    getSuggestionsForDocument,
    clearAllSuggestions
  } = context;
  
  /**
   * Gets suggestions for a specific document type
   * @param docType - Document type to get suggestions for
   * @returns Array of suggestions for the specified document
   */
  const getSuggestionsForDocument = (docType: DocumentType): Suggestion[] => {
    return suggestions.filter(suggestion => suggestion.documentType === docType);
  };
  
  /**
   * Gets inconsistencies for a specific document type
   * This is a placeholder until we update the context to include inconsistencies
   */
  const getInconsistenciesForDocument = (docType: DocumentType): any[] => {
    // Return an empty array for now
    return [];
  };
  
  /**
   * Checks if a suggestion has been implemented
   * @param suggestionId - ID of the suggestion to check
   */
  const isSuggestionImplemented = (suggestionId: string): boolean => {
    return implementedSuggestions.includes(suggestionId);
  };
  
  /**
   * Implement a suggestion (placeholder function)
   */
  const implementSuggestion = async (suggestion: any): Promise<void> => {
    markAsImplemented(suggestion.id);
    // In a real app, this would update the document content
  };
  
  // Generate placeholder inconsistency counts for UI display
  const inconsistencyCount = {
    'Canvas': 0,
    'Strategy': 0,
    'Financial Projection': 0,
    'OKRs': 0
  };
  
  return {
    suggestions,
    implementedSuggestions,
    inconsistencyCount,
    getSuggestionsForDocument,
    getInconsistenciesForDocument,
    isSuggestionImplemented,
    implementSuggestion,
    addSuggestion,
    removeSuggestion,
    markAsImplemented,
    clearAllSuggestions
  };
};

export default useSuggestions;