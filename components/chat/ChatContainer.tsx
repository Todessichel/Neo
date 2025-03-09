import React, { useState } from 'react';
import ChatInterface from './ChatInterface';

const ChatContainer: React.FC = () => {
  // Initial response to start the conversation
  const [claudeResponses, setClaudeResponses] = useState([
    { 
      id: 1, 
      response: "I'm ready to help you create a comprehensive strategy. How would you like to begin?" 
    }
  ]);

  // Chat input state
  const [chatInput, setChatInput] = useState('');

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent empty submissions
    if (!chatInput.trim()) return;

    // Add user's message to responses
    const userResponse = {
      id: claudeResponses.length + 1,
      response: chatInput
    };

    // Add user's message
    const updatedResponses = [...claudeResponses, userResponse];

    // Simulate Claude's response (you'll replace this with actual AI logic later)
    const claudeResponse = {
      id: updatedResponses.length + 1,
      response: `I'm processing your input: "${chatInput}". Would you like me to help you develop a strategy?`
    };

    // Update responses and clear input
    setClaudeResponses([...updatedResponses, claudeResponse]);
    setChatInput('');
  };

  // Optional: Guided strategy start function
  const startAIGuidedStrategy = () => {
    const guidedStrategyStartResponse = {
      id: claudeResponses.length + 1,
      response: "Let's start creating your strategy step by step. I'll guide you through a comprehensive process."
    };

    setClaudeResponses([...claudeResponses, guidedStrategyStartResponse]);
  };

  return (
    <ChatInterface 
      claudeResponses={claudeResponses}
      chatInput={chatInput}
      setChatInput={setChatInput}
      handleSubmit={handleSubmit}
      startAIGuidedStrategy={startAIGuidedStrategy}
      guidedStrategyState={{
        active: false,
        step: 0,
        inputs: {}
      }}
    />
  );
};

export default ChatContainer;