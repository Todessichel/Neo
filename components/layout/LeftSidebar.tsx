import React from 'react';
import { useDocuments } from '../../hooks/useDocuments';
import { useAuth } from '../../hooks/useAuth';
import { useUIState } from '../../hooks/useUIState';
import { useAIAssistant } from '../../hooks/useAIAssistant';
import { DocumentType } from '../../contexts/DocumentContext';

const LeftSidebar: React.FC = () => {
  const { 
    activeDocument, 
    setActiveDocument, 
    projectId, 
    setProjectId,
    projectList,
    inconsistencyCount // Get this from useDocuments instead of useSuggestions
  } = useDocuments();
  
  const { user } = useAuth();
  
  const { 
    setShowLoginModal, 
    setShowIntegrationModal,
    setShowSettingsModal,
    setShowFileManagerModal
  } = useUIState();
  
  const { startAIGuidedStrategy } = useAIAssistant();
  
  // Handle document selection
  const handleDocumentSelect = (docType: DocumentType) => {
    setActiveDocument(docType);
  };
  
  // Document types for navigation
  const documentTypes: DocumentType[] = ['Canvas', 'Strategy', 'Financial Projection', 'OKRs'];
  
  return (
    <div className="w-64 bg-gray-200 p-4 flex flex-col h-screen pt-14"> {/* Added pt-14 for top bar space */}
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
            {/* Use nullish coalescing for safer access */}
            {((inconsistencyCount?.[docType] ?? 0) > 0) ? (
              <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {inconsistencyCount?.[docType] ?? 0}
              </span>
            ) : (
              <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                0
              </span>
            )}
          </div>
        ))}
      </div>
      
      {/* Tools section */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Tools</h3>
        <div className="space-y-2">
          <button 
            className="w-full text-left p-2 bg-blue-100 hover:bg-blue-200 rounded"
            onClick={() => setShowIntegrationModal(true)}
          >
            Import/Export Files
          </button>
          <button 
            className="w-full text-left p-2 bg-blue-100 hover:bg-blue-200 rounded"
            onClick={() => setShowFileManagerModal(true)}
          >
            File Manager
          </button>
          <button 
            className="w-full text-left p-2 bg-blue-100 hover:bg-blue-200 rounded"
            onClick={() => setShowSettingsModal(true)}
          >
            Settings
          </button>
        </div>
      </div>
      
      {/* Create New Document Section */}
      <div className="mt-auto">
        <button 
          className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded"
          onClick={() => startAIGuidedStrategy()}
        >
          Create New Strategy
        </button>
        {!user && (
          <button 
            className="w-full mt-2 bg-gray-300 hover:bg-gray-400 p-2 rounded"
            onClick={() => setShowLoginModal(true)}
          >
            Sign In
          </button>
        )}
      </div>
    </div>
  );
};

export default LeftSidebar;