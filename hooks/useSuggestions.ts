import { useContext } from 'react';
import { SuggestionsContext } from '../contexts/SuggestionsContext';
import { Suggestion } from '../types';
import { Inconsistency } from '../types';
import { DocumentType } from '../types';

/**
 * Custom hook for accessing and managing suggestions and inconsistencies
 * @returns Suggestions context state and methods
 */
export const useSuggestions = () => {
  const context = useContext(SuggestionsContext);
  
  if (!context) {
    throw new Error('useSuggestions must be used within a SuggestionsProvider');
  }
  
  const {
    improvementSuggestions = {},
    inconsistencies = {},
    implementedSuggestions = [],
    inconsistencyCount = {},
    implementSuggestion,
    recordImplementedSuggestion,
    analyzeSuggestions,
    analyzeInconsistencies,
    resetImplementedSuggestions,
    generateSuggestion
  } = context;
  
  /**
   * Gets improvement suggestions for a specific document type
   * @param docType - Document type to get suggestions for
   * @returns Array of suggestions for the specified document
   */
  const getSuggestionsForDocument = (docType: DocumentType): Suggestion[] => {
    // Ensure we always return an array, even if the document type doesn't exist
    return Array.isArray(improvementSuggestions[docType]) 
      ? improvementSuggestions[docType] 
      : [];
  };
  
  /**
   * Gets inconsistencies for a specific document type
   * @param docType - Document type to get inconsistencies for
   * @returns Array of inconsistencies for the specified document
   */
  const getInconsistenciesForDocument = (docType: DocumentType): Inconsistency[] => {
    // Ensure we always return an array, even if the document type doesn't exist
    return Array.isArray(inconsistencies[docType]) 
      ? inconsistencies[docType] 
      : [];
  };
  
  /**
   * Checks if a suggestion has been implemented
   * @param suggestionId - ID of the suggestion to check
   * @returns True if suggestion has been implemented, false otherwise
   */
  const isSuggestionImplemented = (suggestionId: string): boolean => {
    // Ensure implementedSuggestions is an array before checking
    return Array.isArray(implementedSuggestions) 
      ? implementedSuggestions.includes(suggestionId) 
      : false;
  };
  
  /**
   * Gets the total count of all inconsistencies across documents
   * @returns Total count of inconsistencies
   */
  const getTotalInconsistencyCount = (): number => {
    // Ensure inconsistencyCount is an object before reducing
    return Object.values(inconsistencyCount || {})
      .reduce((acc, count) => acc + (Number(count) || 0), 0);
  };
  
  return {
    improvementSuggestions,
    inconsistencies,
    implementedSuggestions,
    inconsistencyCount,
    getSuggestionsForDocument,
    getInconsistenciesForDocument,
    isSuggestionImplemented,
    getTotalInconsistencyCount,
    implementSuggestion,
    recordImplementedSuggestion,
    analyzeSuggestions,
    analyzeInconsistencies,
    resetImplementedSuggestions,
    generateSuggestion
  };
};

export default useSuggestions;