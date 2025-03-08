import React from 'react';

interface Suggestion {
  id: string;
  text: string;
  implementationDetails: {
    section: string;
    action: string;
  };
}

interface SuggestionListProps {
  title: string;
  suggestions: Suggestion[];
  implementedSuggestions: string[];
  onImplement: (suggestion: Suggestion) => void;
  emptyMessage?: string;
}

const SuggestionList: React.FC<SuggestionListProps> = ({
  title,
  suggestions,
  implementedSuggestions,
  onImplement,
  emptyMessage = "No suggestions available"
}) => {
  if (!suggestions || suggestions.length === 0) {
    return (
      <div className="mb-4">
        <h3 className="font-bold mb-2">{title}</h3>
        <p className="text-gray-500 text-sm italic">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <h3 className="font-bold mb-2">{title}</h3>
      <ul className="list-disc pl-5">
        {suggestions.map(suggestion => (
          <li
            key={suggestion.id}
            className={`mb-2 ${
              implementedSuggestions.includes(suggestion.id)
                ? 'text-gray-400 line-through'
                : 'cursor-pointer hover:text-blue-600 hover:bg-blue-50 p-1 rounded'
            }`}
            onClick={() => !implementedSuggestions.includes(suggestion.id) && onImplement(suggestion)}
          >
            {suggestion.text}
            {implementedSuggestions.includes(suggestion.id) && (
              <span className="ml-2 text-green-600 text-xs">✓ Implemented</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SuggestionList;