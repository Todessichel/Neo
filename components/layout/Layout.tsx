// components/layout/EnhancedLayout.tsx
import React, { ReactNode } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useUIState } from '../../hooks/useUIState';
import { useDocuments } from '../../hooks/useDocuments';
import { LoginModal, SettingsModal, FileManagerModal, IntegrationModal } from '../modals';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Enhanced layout component that includes modals and auth-related UI
 */
const EnhancedLayout: React.FC<LayoutProps> = ({ children }) => {
  // Get auth context
  const { 
    user, 
    logout, 
    setShowLoginModal,
    showLoginModal
  } = useAuth();
  
  // Get UI state for modals
  const { 
    showSettingsModal, 
    showFileManagerModal, 
    showIntegrationModal,
    successMessage
  } = useUIState();
  
  // Get document context for project info
  const { 
    projectId, 
    projectList, 
    lastSyncedAt, 
    isSyncing,
    setActiveDocument
  } = useDocuments();
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white p-2 flex justify-between items-center z-10">
        <div className="flex items-center">
          <span className="font-bold text-xl mr-4">NEO</span>
          
          {user ? (
            <>
              <span className="font-medium ml-2">
                {user.email}
              </span>
              {projectId && projectId !== 'default-project' && (
                <span className="ml-2 text-blue-200">
                  | Project: {
                    projectList.find(p => p.id === projectId)?.name ||
                    projectId
                  }
                </span>
              )}
            </>
          ) : (
            <button
              className="text-white hover:bg-blue-700 px-3 py-1 rounded"
              onClick={() => setShowLoginModal(true)}
            >
              Sign In
            </button>
          )}
        </div>
        
        <div className="flex items-center">
          {isSyncing && (
            <div className="mr-4 flex items-center">
              <svg className="animate-spin h-4 w-4 text-white mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-sm">Syncing...</span>
            </div>
          )}
          {lastSyncedAt && !isSyncing && (
            <span className="text-sm mr-4">
              Last synced: {lastSyncedAt.toLocaleTimeString()}
            </span>
          )}
          
          {user && (
            <button 
              className="text-white hover:text-gray-200 text-sm"
              onClick={() => logout()}
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
      
      {/* Left Sidebar */}
      <div className="w-64 bg-gray-200 p-4 flex flex-col h-screen pt-14">
        <h2 className="text-xl font-bold mb-4">Project Files</h2>
        
        {/* Document navigation */}
        <div className="space-y-2">
          {['Canvas', 'Strategy', 'Financial Projection', 'OKRs'].map((docType) => (
            <div 
              key={docType} 
              className={`p-2 rounded cursor-pointer`}
              onClick={() => setActiveDocument(docType as any)}
            >
              <span>{docType}</span>
            </div>
          ))}
        </div>
        
        {/* Import/Export Section */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Tools</h3>
          <div className="space-y-2">
            <button 
              className="w-full text-left p-2 bg-blue-100 hover:bg-blue-200 rounded"
              onClick={() => {
                const uiState = require('../../hooks/useUIState');
                uiState.useUIState().setShowIntegrationModal(true);
              }}
            >
              Import/Export Files
            </button>
            <button 
              className="w-full text-left p-2 bg-blue-100 hover:bg-blue-200 rounded"
              onClick={() => {
                const uiState = require('../../hooks/useUIState');
                uiState.useUIState().setShowFileManagerModal(true);
              }}
            >
              File Manager
            </button>
            <button 
              className="w-full text-left p-2 bg-blue-100 hover:bg-blue-200 rounded"
              onClick={() => {
                const uiState = require('../../hooks/useUIState');
                uiState.useUIState().setShowSettingsModal(true);
              }}
            >
              Settings
            </button>
          </div>
        </div>
        
        {/* Create New Document Section */}
        <div className="mt-auto">
          <button 
            className="w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded"
            onClick={() => {
              const aiAssistant = require('../../hooks/useAIAssistant');
              aiAssistant.useAIAssistant().startAIGuidedStrategy();
            }}
          >
            Create New Strategy
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col pt-12"> {/* Added padding-top to accommodate TopBar */}
        {/* Success Message */}
        {successMessage && (
          <div className="m-4 p-3 bg-green-100 text-green-800 rounded shadow">
            {successMessage}
          </div>
        )}
        
        {children}
      </div>
      
      {/* Modals */}
      {showLoginModal && <LoginModal />}
      {showIntegrationModal && <IntegrationModal />}
      {showSettingsModal && <SettingsModal />}
      {showFileManagerModal && <FileManagerModal />}
    </div>
  );
};

export default EnhancedLayout;