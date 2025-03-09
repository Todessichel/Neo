import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useDocuments } from '../../hooks/useDocuments';
import { useUIState } from '../../hooks/useUIState';

/**
 * Top navigation bar showing auth status and project info
 */
const TopBar: React.FC = () => {
  // Get auth context to check if user is logged in
  const { user, logout } = useAuth();
  
  // Get document context for project info
  const { projectId, projectList, lastSyncedAt, isSyncing } = useDocuments();
  
  // Get UI state for showing modals
  const { setShowLoginModal } = useUIState();
  
  // If no user, don't show the top bar
  if (!user) {
    return null;
  }
  
  // Get the current project name
  const currentProject = projectId !== 'default-project' ? 
    projectList.find(p => p.id === projectId)?.name || projectId : 
    'No Project Selected';
  
  return (
    <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white p-2 flex justify-between items-center z-10">
      <div className="flex items-center">
        <span className="font-medium ml-2">
          {user.email} | Project: {currentProject}
        </span>
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
        <button 
          className="text-white hover:text-gray-200 text-sm"
          onClick={() => logout()}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default TopBar;