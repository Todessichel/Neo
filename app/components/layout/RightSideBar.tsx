import React from 'react';

interface Suggestion {
  id: string;
  text: string;
  implementationDetails: {
    section: string;
    action: string;
  };
}

interface RightSidebarProps {
  activeDocument: string;
  implementedSuggestions: string[];
  successMessage: string | null;
  implementSuggestion: (suggestion: Suggestion) => void;
  improvementSuggestions: Record<string, Suggestion[]>;
  inconsistencies: Record<string, Suggestion[]>;
}

const RightSidebar: React.FC<RightSidebarProps> = ({
  activeDocument,
  implementedSuggestions,
  successMessage,
  implementSuggestion,
  improvementSuggestions,
  inconsistencies
}) => {
  return (
    <div className="w-64 bg-gray-200 p-4 flex flex-col">
      <div className="flex-1 bg-white p-3 rounded mb-4 overflow-auto">
        {successMessage && (
          <div className="mb-3 p-2 bg-green-100 text-green-800 rounded">
            ✓ {successMessage}
          </div>
        )}
        
        <h3 className="font-bold mb-2">Improvement Suggestions</h3>
        <ul className="list-disc pl-5">
          {improvementSuggestions[activeDocument]?.map(suggestion => (
            <li 
              key={suggestion.id} 
              className={`mb-2 ${
                implementedSuggestions.includes(suggestion.id) 
                  ? 'text-gray-400 line-through' 
                  : 'cursor-pointer hover:text-blue-600 hover:bg-blue-50 p-1 rounded'
              }`}
              onClick={() => !implementedSuggestions.includes(suggestion.id) && implementSuggestion(suggestion)}
            >
              {suggestion.text}
            </li>
          ))}
        </ul>

        <h3 className="font-bold mt-4 mb-2">Inconsistencies</h3>
        <ul className="list-disc pl-5">
          {inconsistencies[activeDocument]?.map(inconsistency => (
            <li 
              key={inconsistency.id} 
              className={`mb-2 ${
                implementedSuggestions.includes(inconsistency.id) 
                  ? 'text-gray-400 line-through' 
                  : 'cursor-pointer hover:text-blue-600 hover:bg-blue-50 p-1 rounded'
              }`}
              onClick={() => !implementedSuggestions.includes(inconsistency.id) && implementSuggestion(inconsistency)}
            >
              {inconsistency.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default RightSidebar;