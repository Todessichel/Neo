import React, { ReactNode } from 'react';
import TopBar from './TopBar';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import { useAuth } from '../../hooks/useAuth';
import { useUIState } from '../../hooks/useUIState';
import LoginModal from '../modals/LoginModal';
import IntegrationModal from '../modals/IntegrationModal';
import SettingsModal from '../modals/SettingsModal';
import FileManagerModal from '../modals/FileManagerModal';

interface LayoutProps {
  children: ReactNode;
}

/**
 * Main layout component that arranges the UI structure
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  // Get UI state for modals
  const { 
    showLoginModal, 
    showIntegrationModal,
    showSettingsModal,
    showFileManagerModal 
  } = useUIState();
  
  // Get auth context to check if user is logged in
  const { user } = useAuth();
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Top Bar */}
      <TopBar />
      
      {/* Left Sidebar */}
      <LeftSidebar />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col pt-12"> {/* Added padding-top to accommodate TopBar */}
        {children}
      </div>
      
      {/* Right Sidebar */}
      <RightSidebar />
      
      {/* Modals */}
      {showLoginModal && <LoginModal />}
      {showIntegrationModal && <IntegrationModal />}
      {showSettingsModal && <SettingsModal />}
      {showFileManagerModal && <FileManagerModal />}
    </div>
  );
};

export default Layout;