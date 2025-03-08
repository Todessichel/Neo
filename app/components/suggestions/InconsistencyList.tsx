import React from 'react';

interface Inconsistency {
  id: string;
  text: string;
  severity: 'high' | 'medium' | 'low';
  implementationDetails: {
    section: string;
    action: string;
  };
}

interface InconsistencyListProps {
  inconsistencies: Inconsistency[];
  implementedSuggestions: string[];
  onImplement: (inconsistency: Inconsistency) => void;
  emptyMessage?: string;
}

const InconsistencyList: React.FC<InconsistencyListProps> = ({
  inconsistencies,
  implementedSuggestions,
  onImplement,
  emptyMessage = "No inconsistencies detected"
}) => {
  if (!inconsistencies || inconsistencies.length === 0) {
    return (
      <div className="mb-4">
        <h3 className="font-bold mb-2">Inconsistencies</h3>
        <p className="text-gray-500 text-sm italic">{emptyMessage}</p>
      </div>
    );
  }

  // Group inconsistencies by severity
  const highSeverity = inconsistencies.filter(item => item.severity === 'high');
  const mediumSeverity = inconsistencies.filter(item => item.severity === 'medium');
  const lowSeverity = inconsistencies.filter(item => item.severity === 'low');

  const renderInconsistencyItem = (inconsistency: Inconsistency) => (
    <li
      key={inconsistency.id}
      className={`mb-2 ${
        implementedSuggestions.includes(inconsistency.id)
          ? 'text-gray-400 line-through'
          : 'cursor-pointer hover:text-blue-600 hover:bg-blue-50 p-1 rounded'
      }`}
      onClick={() => !implementedSuggestions.includes(inconsistency.id) && onImplement(inconsistency)}
    >
      <div className="flex items-start">
        <div className="mr-2 mt-1 flex-shrink-0">
          {inconsistency.severity === 'high' && (
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
          )}
          {inconsistency.severity === 'medium' && (
            <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block"></span>
          )}
          {inconsistency.severity === 'low' && (
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
          )}
        </div>
        <div>
          {inconsistency.text}
          {implementedSuggestions.includes(inconsistency.id) && (
            <span className="ml-2 text-green-600 text-xs">✓ Resolved</span>
          )}
        </div>
      </div>
    </li>
  );

  return (
    <div className="mb-4">
      <h3 className="font-bold mb-2">Inconsistencies</h3>
      
      {highSeverity.length > 0 && (
        <div className="mb-2">
          <h4 className="text-sm font-semibold text-red-600 mb-1">Critical</h4>
          <ul className="list-none pl-2">
            {highSeverity.map(renderInconsistencyItem)}
          </ul>
        </div>
      )}
      
      {mediumSeverity.length > 0 && (
        <div className="mb-2">
          <h4 className="text-sm font-semibold text-yellow-600 mb-1">Important</h4>
          <ul className="list-none pl-2">
            {mediumSeverity.map(renderInconsistencyItem)}
          </ul>
        </div>
      )}
      
      {lowSeverity.length > 0 && (
        <div className="mb-2">
          <h4 className="text-sm font-semibold text-blue-600 mb-1">Minor</h4>
          <ul className="list-none pl-2">
            {lowSeverity.map(renderInconsistencyItem)}
          </ul>
        </div>
      )}
    </div>
  );
};

export default InconsistencyList;