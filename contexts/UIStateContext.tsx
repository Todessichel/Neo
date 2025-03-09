import React, { createContext, useState, ReactNode } from 'react';

// Type for guided strategy state
interface GuidedStrategyState {
  active: boolean;
  step: number;
  inputs: Record<number, string>;
}

// Define the context type
interface UIStateContextType {
  showLoginModal: boolean;
  setShowLoginModal: React.Dispatch<React.SetStateAction<boolean>>;
  showIntegrationModal: boolean;
  setShowIntegrationModal: React.Dispatch<React.SetStateAction<boolean>>;
  showSettingsModal: boolean;
  setShowSettingsModal: React.Dispatch<React.SetStateAction<boolean>>;
  showFileManagerModal: boolean;
  setShowFileManagerModal: React.Dispatch<React.SetStateAction<boolean>>;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  successMessage: string | null;
  setSuccessMessage: React.Dispatch<React.SetStateAction<string | null>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  claudePrompt: string | null;
  setClaudePrompt: React.Dispatch<React.SetStateAction<string | null>>;
  promptStage: 'idle' | 'pending' | 'completed';
  setPromptStage: React.Dispatch<React.SetStateAction<'idle' | 'pending' | 'completed'>>;
  guidedStrategyState: GuidedStrategyState;
  setGuidedStrategyState: React.Dispatch<React.SetStateAction<GuidedStrategyState>>;
}

// Create the context
export const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

// Props for the provider component
interface UIStateProviderProps {
  children: ReactNode;
}

export const UIStateProvider: React.FC<UIStateProviderProps> = ({ children }) => {
  // State for modals
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFileManagerModal, setShowFileManagerModal] = useState(false);
  
  // State for active tab in integration modal
  const [activeTab, setActiveTab] = useState('import');
  
  // State for success message
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // State for loading indicator
  const [isLoading, setIsLoading] = useState(false);
  
  // State for Claude prompt
  const [claudePrompt, setClaudePrompt] = useState<string | null>(null);
  
  // State for prompt stage
  const [promptStage, setPromptStage] = useState<'idle' | 'pending' | 'completed'>('idle');
  
  // State for guided strategy
  const [guidedStrategyState, setGuidedStrategyState] = useState<GuidedStrategyState>({
    active: false,
    step: 0,
    inputs: {}
  });
  
  // Context value
  const value = {
    showLoginModal,
    setShowLoginModal,
    showIntegrationModal,
    setShowIntegrationModal,
    showSettingsModal,
    setShowSettingsModal,
    showFileManagerModal,
    setShowFileManagerModal,
    activeTab,
    setActiveTab,
    successMessage,
    setSuccessMessage,
    isLoading,
    setIsLoading,
    claudePrompt,
    setClaudePrompt,
    promptStage,
    setPromptStage,
    guidedStrategyState,
    setGuidedStrategyState
  };
  
  return (
    <UIStateContext.Provider value={value}>
      {children}
    </UIStateContext.Provider>
  );
};