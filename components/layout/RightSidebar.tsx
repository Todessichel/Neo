import React from 'react';
import { useSuggestions } from '../../hooks/useSuggestions';
import { useDocuments } from '../../hooks/useDocuments';
import { useUIState } from '../../hooks/useUIState';

/**
 * Right sidebar component showing suggestions and inconsistencies
 */
const RightSidebar: React.FC = () => {
  // Get document context for active document
  const { activeDocument } = useDocuments();
  
  // Get suggestions context
  const { 
    getSuggestionsForDocument, 
    getInconsistenciesForDocument, 
    isSuggestionImplemented,
    implementSuggestion
  } = useSuggestions();
  
  // Get UI state context
  const { successMessage } = useUIState();
  
  // Get suggestions for the active document
  const suggestions = getSuggestionsForDocument(activeDocument);
  
  // Get inconsistencies for the active document
  const inconsistencies = getInconsistenciesForDocument(activeDocument);
  
  return (
    <div className="w-64 bg-gray-200 p-4 flex flex-col h-screen">
      <div className="flex-1 bg-white p-3 rounded mb-4 overflow-auto">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-3 p-2 bg-green-100 text-green-800 rounded">
            ✓ {successMessage}
          </div>
        )}
        
        {/* Improvement Suggestions */}
        <h3 className="font-bold mb-2">Improvement Suggestions</h3>
        {suggestions.length > 0 ? (
          <ul className="list-disc pl-5">
            {suggestions.map(suggestion => (
              <li 
                key={suggestion.id} 
                className={`mb-2 ${
                  isSuggestionImplemented(suggestion.id) 
                    ? 'text-gray-400 line-through' 
                    : 'cursor-pointer hover:text-blue-600 hover:bg-blue-50 p-1 rounded'
                }`}
                onClick={() => !isSuggestionImplemented(suggestion.id) && implementSuggestion(suggestion)}
              >
                {suggestion.text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No suggestions available for this document.</p>
        )}

        {/* Inconsistencies */}
        <h3 className="font-bold mt-4 mb-2">Inconsistencies</h3>
        {inconsistencies.length > 0 ? (
          <ul className="list-disc pl-5">
            {inconsistencies.map(inconsistency => (
              <li 
                key={inconsistency.id} 
                className={`mb-2 ${
                  isSuggestionImplemented(inconsistency.id) 
                    ? 'text-gray-400 line-through' 
                    : 'cursor-pointer hover:text-blue-600 hover:bg-blue-50 p-1 rounded'
                }`}
                onClick={() => !isSuggestionImplemented(inconsistency.id) && implementSuggestion(inconsistency)}
              >
                {inconsistency.text}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No inconsistencies found in this document.</p>
        )}
        
        {/* If no suggestions or inconsistencies */}
        {suggestions.length === 0 && inconsistencies.length === 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded">
            <p className="text-sm text-blue-700">
              This document looks good! No suggestions or inconsistencies found.
            </p>
          </div>
        )}
      </div>
      
      {/* Help section */}
      <div className="bg-white p-3 rounded">
        <h3 className="font-bold mb-2">Need Help?</h3>
        <p className="text-sm">
          Click on a suggestion or inconsistency to implement changes automatically.
          These changes will maintain strategic coherence across all your documents.
        </p>
      </div>
    </div>
  );
};

export default RightSidebar;