import React, { createContext, useState, useEffect, ReactNode } from 'react';

// Define the types for Claude response
interface ClaudeResponse {
  id: number;
  response: string;
  timestamp?: Date;
}

// Define the context type
interface AIAssistantContextType {
  claudeResponses: ClaudeResponse[];
  setClaudeResponses: React.Dispatch<React.SetStateAction<ClaudeResponse[]>>;
  chatInput: string;
  setChatInput: React.Dispatch<React.SetStateAction<string>>;
  handleSubmit: (e: React.FormEvent) => void;
  sendPromptToClaude: (prompt: string) => Promise<ClaudeResponse>;
  isProcessing: boolean;
  guidedStrategyActive: boolean;
  startAIGuidedStrategy: () => void;
  endAIGuidedStrategy: () => void;
  implementSuggestion: (suggestionId: string, section: string, action: string) => Promise<void>;
}

// Create the context with a default undefined value
export const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined);

// Props for the provider component
interface AIAssistantProviderProps {
  children: ReactNode;
}

export const AIAssistantProvider: React.FC<AIAssistantProviderProps> = ({ children }) => {
  // State for Claude responses
  const [claudeResponses, setClaudeResponses] = useState<ClaudeResponse[]>([
    {
      id: 1,
      response: "I've analyzed your strategy documents. How can I help improve them? I can suggest improvements, check for inconsistencies, or help implement changes.",
      timestamp: new Date()
    }
  ]);
  
  // State for chat input
  const [chatInput, setChatInput] = useState('');
  
  // State for tracking if Claude is processing a request
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State for guided strategy process
  const [guidedStrategyActive, setGuidedStrategyActive] = useState(false);
  const [guidedStrategyStep, setGuidedStrategyStep] = useState(0);
  const [guidedStrategyInputs, setGuidedStrategyInputs] = useState<Record<number, string>>({});
  
  /**
   * Handle chat submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() === '') return;
    
    // If in guided strategy mode, handle differently
    if (guidedStrategyActive) {
      handleGuidedStrategyInput();
    } else {
      // Regular chat handling
      sendPromptToClaude(chatInput)
        .then(response => {
          setClaudeResponses(prev => [...prev, response]);
        })
        .catch(error => {
          console.error('Error sending prompt to Claude:', error);
          // Add an error response
          setClaudeResponses(prev => [
            ...prev, 
            { 
              id: prev.length + 1, 
              response: "I'm sorry, I encountered an error processing your request. Please try again.",
              timestamp: new Date()
            }
          ]);
        });
    }
    
    setChatInput('');
  };
  
  /**
   * Handle input during guided strategy process
   */
  const handleGuidedStrategyInput = () => {
    // Save user input for current step
    const updatedInputs = {
      ...guidedStrategyInputs,
      [guidedStrategyStep]: chatInput
    };
    
    setGuidedStrategyInputs(updatedInputs);
    
    // Determine next step and response based on current step
    let nextStep = guidedStrategyStep + 1;
    let nextResponse = "";
    
    switch(guidedStrategyStep) {
      case 1: // Business Model Fundamentals
        nextResponse = "Great! Now let's talk about your strategic approach. Would you prefer a conservative approach prioritizing stability and consistent profitability, a moderate approach balancing growth with risk management, or an aggressive approach emphasizing faster growth with higher risk?";
        break;
      case 2: // Strategic Direction
        nextResponse = "I'll create a strategy document based on your approach. Now let's define some key objectives and results. What are the 3-5 most important goals you want to achieve in the next year?";
        break;
      case 3: // OKR Development
        nextResponse = "Now let's set some financial goals. What are your targets for revenue, profit margin, and investment capacity? Please provide ranges for optimistic, expected, and pessimistic scenarios.";
        break;
      case 4: // Financial Goals
        // Final step - generate documents
        nextResponse = "Thank you! I'm now generating your complete set of strategy documents based on all your inputs. This includes an Enhanced Strategy Canvas, Strategy Document, OKRs, and Financial Projections - all aligned and coherent with each other.";
        
        // Here you would actually generate the documents based on collected inputs
        setTimeout(() => {
          createStrategyDocuments(updatedInputs);
        }, 2000);
        break;
      default:
        nextResponse = "Let's continue building your strategy. What else would you like to focus on?";
    }
    
    // Update state
    setGuidedStrategyStep(nextStep);
    
    // Add Claude response
    const newResponse = {
      id: claudeResponses.length + 1,
      response: nextResponse,
      timestamp: new Date()
    };
    
    setClaudeResponses(prev => [...prev, newResponse]);
    
    // If we've reached the end, finish the guided strategy process
    if (nextStep > 4) {
      setTimeout(() => {
        setGuidedStrategyActive(false);
        setGuidedStrategyStep(0);
      }, 3000);
    }
  };
  
  /**
   * Send a prompt to Claude and get a response
   */
  const sendPromptToClaude = async (prompt: string): Promise<ClaudeResponse> => {
    setIsProcessing(true);
    
    try {
      // In a real app, this would be an API call to Claude
      // For now, simulate a response after a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate a contextual response based on the prompt
      const response = generateClaudeResponse(prompt);
      
      setIsProcessing(false);
      return {
        id: claudeResponses.length + 1,
        response,
        timestamp: new Date()
      };
    } catch (error) {
      setIsProcessing(false);
      throw error;
    }
  };
  
  /**
   * Generate a response based on the prompt content
   * In a real app, this would be replaced with an actual API call to Claude
   */
  const generateClaudeResponse = (prompt: string): string => {
    const promptLower = prompt.toLowerCase();
    
    if (promptLower.includes('strategy') || promptLower.includes('document')) {
      return "I've analyzed your strategy documents and found some areas for improvement. I recommend ensuring alignment between your strategic objectives and your financial projections, especially regarding the growth assumptions. Would you like me to suggest specific changes?";
    }
    
    if (promptLower.includes('financial') || promptLower.includes('projection') || promptLower.includes('money')) {
      return "Your financial projections appear to be based on achieving 300 subscribers by year-end, but I've noticed the customer acquisition strategy isn't fully defined. Would you like me to help align your marketing strategy with this goal?";
    }
    
    if (promptLower.includes('okr') || promptLower.includes('objective') || promptLower.includes('goal')) {
      return "I notice your OKRs include a 90% customer satisfaction target, but there's no corresponding measurement framework defined. Would you like me to suggest ways to track this and ensure it aligns with your product development priorities?";
    }
    
    if (promptLower.includes('canvas') || promptLower.includes('model')) {
      return "Your business model canvas could be strengthened by more clearly defining your customer acquisition channels. This would help ensure alignment with your financial projections and OKRs.";
    }
    
    if (promptLower.includes('inconsistency') || promptLower.includes('align') || promptLower.includes('coherence')) {
      return "I've found several inconsistencies between your documents. Your strategy emphasizes premium positioning, but your financial projections assume high volume at lower price points. Would you like me to help resolve this misalignment?";
    }
    
    // Default response if no specific topics are detected
    return "I'm analyzing your input. Based on systems thinking principles, I see some potential improvements for your strategy. Would you like me to elaborate on specific adjustments to strengthen alignment between your strategic elements?";
  };
  
  /**
   * Start the guided strategy creation process
   */
  const startAIGuidedStrategy = () => {
    setGuidedStrategyActive(true);
    setGuidedStrategyStep(1);
    setGuidedStrategyInputs({});
    
    // Add initial Claude response
    const welcomeResponse = {
      id: claudeResponses.length + 1,
      response: "I'll help you create a complete strategy. Let's start with the fundamentals of your business model. Could you tell me about your target customer segments, what pain points you're solving, and what unique value you provide?",
      timestamp: new Date()
    };
    
    setClaudeResponses(prev => [...prev, welcomeResponse]);
  };
  
  /**
   * End the guided strategy creation process
   */
  const endAIGuidedStrategy = () => {
    setGuidedStrategyActive(false);
    setGuidedStrategyStep(0);
    setGuidedStrategyInputs({});
  };
  
  /**
   * Create strategy documents from guided inputs
   * This is a placeholder that would be implemented in a real app
   */
  const createStrategyDocuments = (inputs: Record<number, string>) => {
    console.log("Creating strategy documents from inputs:", inputs);
    
    // In a real app, this would actually create documents
    // For now, just log that we would create them
    
    // Add confirmation response
    const completionResponse = {
      id: claudeResponses.length + 1,
      response: "I've created your strategy documents! You can view and edit them using the tabs on the left. I've also identified some potential improvements and inconsistencies that you might want to address to strengthen your strategy.",
      timestamp: new Date()
    };
    
    setClaudeResponses(prev => [...prev, completionResponse]);
  };
  
  /**
   * Implement a suggestion
   */
  const implementSuggestion = async (
    suggestionId: string, 
    section: string, 
    action: string
  ): Promise<void> => {
    setIsProcessing(true);
    
    try {
      // Create standardized prompt for Claude
      const standardizedPrompt = `
INSTRUCTION: Please implement the following change to maintain strategic coherence across documents.

DOCUMENT TO MODIFY: ${section}
ACTION REQUIRED: ${action}
CONTEXT: This change is needed to improve alignment between documents

Please implement this change while maintaining alignment with all other strategic documents.
`;

      // Send prompt to Claude
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Add Claude's response
      const newResponse = {
        id: claudeResponses.length + 1,
        response: `I've implemented the suggested change to ${section}: ${action}. This maintains strategic coherence by ensuring alignment between your documents. The changes have been highlighted in green in the document.`,
        timestamp: new Date()
      };
      
      setClaudeResponses(prev => [...prev, newResponse]);
      
      setIsProcessing(false);
    } catch (error) {
      setIsProcessing(false);
      console.error('Error implementing suggestion:', error);
      throw error;
    }
  };
  
  // Context value
  const value = {
    claudeResponses,
    setClaudeResponses,
    chatInput,
    setChatInput,
    handleSubmit,
    sendPromptToClaude,
    isProcessing,
    guidedStrategyActive,
    startAIGuidedStrategy,
    endAIGuidedStrategy,
    implementSuggestion
  };
  
  return (
    <AIAssistantContext.Provider value={value}>
      {children}
    </AIAssistantContext.Provider>
  );
};