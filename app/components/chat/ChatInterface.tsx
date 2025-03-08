import React, { useState, useRef, useEffect } from 'react';
import ClaudeResponse from './ClaudeResponse';

interface ChatInterfaceProps {
  claudeResponses: Array<{ id: number; response: string }>;
  chatInput: string;
  setChatInput: (input: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  guidedStrategyState?: {
    active: boolean;
    step: number;
    inputs: Record<number, string>;
  };
  startAIGuidedStrategy?: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  claudeResponses,
  chatInput,
  setChatInput,
  handleSubmit,
  guidedStrategyState,
  startAIGuidedStrategy
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [claudeResponses]);

  // Get suggested responses based on the current state
  const getSuggestedResponses = () => {
    // If no guided strategy or it's not active
    if (!guidedStrategyState || !guidedStrategyState.active) {
      // Default suggestions for a new chat
      if (claudeResponses.length <= 1) {
        return [
          {
            text: 'Help me create a strategy',
            action: startAIGuidedStrategy,
          },
          {
            text: 'Analyze my documents for inconsistencies',
            action: () => setChatInput('Please analyze my documents for any inconsistencies or issues.'),
          },
          {
            text: 'Suggest improvements to my strategy',
            action: () => setChatInput('How can I improve my current strategy?'),
          }
        ];
      }
      
      // Contextual suggestions based on latest Claude response
      const latestResponse = claudeResponses[claudeResponses.length - 1]?.response.toLowerCase() || '';
      
      if (latestResponse.includes('guide') && latestResponse.includes('strategy')) {
        return [
          {
            text: 'Yes, please help me create a strategy',
            action: startAIGuidedStrategy,
          },
          {
            text: 'I prefer to upload my own documents',
            action: () => setChatInput('I would rather import my existing strategy documents.'),
          }
        ];
      }
      
      if (latestResponse.includes('inconsistenc') || latestResponse.includes('suggest')) {
        return [
          {
            text: 'Apply all suggested changes',
            action: () => setChatInput('Please apply all the suggested changes to my documents.'),
          },
          {
            text: 'Explain the benefits of these changes',
            action: () => setChatInput('Can you explain why these changes are important?'),
          }
        ];
      }
    }
    
    // Suggestions for guided strategy steps
    if (guidedStrategyState?.active) {
      switch (guidedStrategyState.step) {
        case 1: // Business Model Fundamentals
          return [
            {
              text: 'Our target customers are early-stage startups',
              action: () => setChatInput('Our target customers are early-stage startups looking for integrated strategy and financial planning tools. We solve their pain point of having disconnected documents and tools.'),
            },
            {
              text: 'We focus on SMEs/Mittelstand businesses',
              action: () => setChatInput('We focus on small and medium-sized businesses, particularly those that need help with digital transformation. Our unique value is making strategy accessible and actionable.'),
            }
          ];
        case 2: // Strategic Direction
          return [
            {
              text: 'We prefer a moderate approach',
              action: () => setChatInput('We prefer a moderate approach, balancing growth ambitions with sustainable operations and risk management.'),
            },
            {
              text: 'We want a conservative approach',
              action: () => setChatInput('We prefer a conservative approach that prioritizes stability, resilience, and consistent profitability over rapid growth.'),
            }
          ];
        case 3: // OKR Development
          return [
            {
              text: 'Our main goals include reaching profitability',
              action: () => setChatInput('Our main goals for the next year are reaching €100K in revenue, growing to 300 subscribers, achieving 90% customer satisfaction, and establishing 2-3 key partnerships.'),
            }
          ];
        case 4: // Financial Goals
          return [
            {
              text: 'Our financial targets are...',
              action: () => setChatInput('Our optimistic target is €450K revenue with 45% margin, expected is €400K with 40% margin, and pessimistic is €350K with 35% margin. We can invest up to €100K initially.'),
            }
          ];
        default:
          return [];
      }
    }
    
    return [];
  };

  const suggestedResponses = getSuggestedResponses();

  return (
    <div className="p-4 pt-0">
      {/* Claude AI Response Box */}
      <div className="mx-4 mb-4 p-4 bg-purple-50 border border-purple-200 rounded shadow overflow-y-auto max-h-56">
        <div className="space-y-4">
          {claudeResponses.map((response, index) => (
            <div key={response.id} className={index < claudeResponses.length - 1 ? 'mb-4 pb-4 border-b border-purple-100' : ''}>
              <ClaudeResponse 
                response={response} 
                isLatest={index === claudeResponses.length - 1} 
              />
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Suggested Responses */}
      {suggestedResponses.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3 mx-4">
          {suggestedResponses.map((suggestion, index) => (
            <button
              key={index}
              className="bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-sm"
              onClick={() => suggestion.action && suggestion.action()}
            >
              {suggestion.text}
            </button>
          ))}
        </div>
      )}
      
      {/* Chat Interface */}
      <form onSubmit={handleSubmit} className="flex mx-4">
        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder={
            guidedStrategyState?.active 
              ? `Enter your response for Step ${guidedStrategyState.step}...` 
              : "Ask Claude about your strategy..."
          }
          className="flex-1 p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button 
          type="submit" 
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r transition-colors"
        >
          Send
        </button>
      </form>
      
      {/* Guided Strategy Indicator */}
      {guidedStrategyState?.active && (
        <div className="mt-3 mx-4 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
          <p className="text-blue-800">
            <span className="font-medium">AI-Guided Strategy:</span> Step {guidedStrategyState.step} of 4 - 
            {guidedStrategyState.step === 1 && " Business Model Fundamentals"}
            {guidedStrategyState.step === 2 && " Strategic Direction"}
            {guidedStrategyState.step === 3 && " OKR Development"}
            {guidedStrategyState.step === 4 && " Financial Goals"}
          </p>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;