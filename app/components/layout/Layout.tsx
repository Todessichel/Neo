// Layout.tsx
import React from 'react';
import TopBar from './TopBar';
import LeftSidebar from './LeftSidebar'; 
import RightSidebar from './RightSidebar';
import DocumentViewer from '../documents/DocumentViewer';
import ChatInterface from '../chat/ChatInterface';

const Layout: React.FC = () => {
  // Access shared state from contexts or hooks
  const { 
    user, projectId, projectList, lastSyncedAt, logoutUser, setProjectId 
  } = useAuth();
  
  const {
    activeDocument, setActiveDocument, inconsistencyCount
  } = useDocuments();
  
  const {
    showIntegrationModal, setShowIntegrationModal,
    showLoginModal, setShowLoginModal
  } = useUIState();
  
  const {
    implementedSuggestions, successMessage, implementSuggestion
  } = useSuggestions();
  
  // Mock data (would come from context in real implementation)
  const improvementSuggestions = {};
  const inconsistencies = {};

  return (
    <div className="flex h-screen bg-gray-100">
      <TopBar
        user={user}
        projectId={projectId}
        projectList={projectList}
        lastSyncedAt={lastSyncedAt}
        logoutUser={logoutUser}
      />
      
      <LeftSidebar 
        activeDocument={activeDocument}
        setActiveDocument={setActiveDocument}
        inconsistencyCount={inconsistencyCount}
        setShowIntegrationModal={setShowIntegrationModal}
        setShowLoginModal={setShowLoginModal}
        user={user}
        projectList={projectList}
        projectId={projectId}
        setProjectId={setProjectId}
      />
      
      <div className="flex-1 flex flex-col">
        <DocumentViewer />
        <ChatInterface />
      </div>
      
      <RightSidebar 
        activeDocument={activeDocument}
        implementedSuggestions={implementedSuggestions}
        successMessage={successMessage}
        implementSuggestion={implementSuggestion}
        improvementSuggestions={improvementSuggestions}
        inconsistencies={inconsistencies}
      />
      
      {/* Modals would be rendered here */}
    </div>
  );
};

export default Layout;