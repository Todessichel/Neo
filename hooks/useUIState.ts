import { useContext } from 'react';
import { UIStateContext } from '../contexts/UIStateContext';

/**
 * Custom hook for managing UI state
 * @returns UI state context and methods
 */
export const useUIState = () => {
  const context = useContext(UIStateContext);
  
  if (!context) {
    throw new Error('useUIState must be used within a UIStateProvider');
  }
  
  const {
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
  } = context;
  
  /**
   * Shows a success message for a specified duration
   * @param message - Message to display
   * @param duration - Duration in milliseconds to show the message (default: 3000ms)
   */
  const showSuccessMessage = (message: string, duration: number = 3000) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), duration);
  };
  
  /**
   * Shows an error message for a specified duration
   * @param message - Error message to display
   * @param duration - Duration in milliseconds to show the message (default: 5000ms)
   */
  const showErrorMessage = (message: string, duration: number = 5000) => {
    // In a real app, you might want to differentiate between success and error messages
    // For now, we're using the same field but could style them differently
    setSuccessMessage(`Error: ${message}`);
    setTimeout(() => setSuccessMessage(null), duration);
  };
  
  /**
   * Starts the guided strategy creation process
   */
  const startGuidedStrategy = () => {
    setGuidedStrategyState({
      active: true,
      step: 1,
      inputs: {}
    });
  };
  
  /**
   * Cancels the guided strategy creation process
   */
  const cancelGuidedStrategy = () => {
    setGuidedStrategyState({
      active: false,
      step: 0,
      inputs: {}
    });
  };
  
  return {
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
    showSuccessMessage,
    showErrorMessage,
    isLoading,
    setIsLoading,
    claudePrompt,
    setClaudePrompt,
    promptStage,
    setPromptStage,
    guidedStrategyState,
    setGuidedStrategyState,
    startGuidedStrategy,
    cancelGuidedStrategy
  };
};

export default useUIState;