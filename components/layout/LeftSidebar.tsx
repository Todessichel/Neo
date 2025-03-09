import React from 'react';
import { useDocuments } from '../../hooks/useDocuments';
import { useAuth } from '../../hooks/useAuth';
import { useUIState } from '../../hooks/useUIState';
import { useSuggestions } from '../../hooks/useSuggestions';
import { DocumentType } from '../../contexts/DocumentContext';

const LeftSidebar: React.FC = () => {
  const { 
    activeDocument, 
    setActiveDocument, 
    projectId, 
    setProjectId,
    projectList
  } = useDocuments();
  
  const { user } = useAuth();
  
  const { 
    setShowLoginModal, 
    setShowIntegrationModal,
    setShowSettingsModal,
    setShowFileManagerModal
  } = useUIState();
  
  // Add a default value and type check
  const { inconsistencyCount = {} } = useSuggestions();
  
  // Handle document selection
  const handleDocumentSelect = (docType: DocumentType) => {
    setActiveDocument(docType);
  };
  
  // Document types for navigation
  const documentTypes: DocumentType[] = ['Canvas', 'Strategy', 'Financial Projection', 'OKRs'];
  
  return (
    <div className="w-64 bg-gray-200 p-4 flex flex-col h-screen">
      <h2 className="text-xl font-bold mb-4">Project Files</h2>
      
      {/* Document navigation */}
      <div className="space-y-2">
        {documentTypes.map((docType) => (
          <div 
            key={docType} 
            className={`p-2 rounded cursor-pointer flex justify-between items-center ${
              activeDocument === docType 
                ? 'bg-blue-100 font-semibold' 
                : 'bg-gray-300 hover:bg-gray-400'
            }`}
            onClick={() => handleDocumentSelect(docType)}
          >
            <span>{docType}</span>
            {/* Add type assertion and fallback */}
            {(inconsistencyCount[docType] || 0) > 0 ? (
              <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {inconsistencyCount[docType] || 0}
              </span>
            ) : (
              <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                0
              </span>
            )}
          </div>
        ))}
      </div>
      
      {/* Rest of the component remains the same */}
    </div>
  );
};

export default LeftSidebar;