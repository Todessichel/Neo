// components/chat/ConnectedChatInterface.tsx
import React from 'react';
import ChatInterface from './ChatInterface';
import { useAIAssistant } from '../../hooks/useAIAssistant';
import { useUIState } from '../../hooks/useUIState';

/**
 * A wrapper component that connects ChatInterface to the AI Assistant Context
 * This solves the issue of passing the right props to ChatInterface
 */
const ConnectedChatInterface: React.FC = () => {
  // Get AI Assistant state and methods
  const {
    claudeResponses,
    chatInput,
    setChatInput,
    handleSubmit,
    isProcessing,
    guidedStrategyActive,
    startAIGuidedStrategy,
  } = useAIAssistant();
  
  // Get UI state for guided strategy
  const { guidedStrategyState } = useUIState();
  
  return (
    <ChatInterface 
      claudeResponses={claudeResponses || []}
      chatInput={chatInput}
      setChatInput={setChatInput}
      handleSubmit={handleSubmit}
      guidedStrategyState={guidedStrategyState || {
        active: guidedStrategyActive,
        step: 0,
        inputs: {}
      }}
      startAIGuidedStrategy={startAIGuidedStrategy}
    />
  );
};

export default ConnectedChatInterface;