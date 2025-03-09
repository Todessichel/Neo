import { useContext } from 'react';
import { AIAssistantContext } from '../contexts/AIAssistantContext';

/**
 * Custom hook for accessing and using AI Assistant functionality
 * @returns AI Assistant context state and functions
 */
export const useAIAssistant = () => {
  const context = useContext(AIAssistantContext);
  
  if (!context) {
    throw new Error('useAIAssistant must be used within an AIAssistantProvider');
  }
  
  return context;
};

export default useAIAssistant;