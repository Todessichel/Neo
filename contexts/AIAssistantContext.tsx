import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useDocuments } from '../hooks/useDocuments';

// Define the types for Claude response
interface ClaudeResponse {
  id: number;
  response: string;
  timestamp?: Date;
}

// Define the guided strategy state
interface GuidedStrategyState {
  active: boolean;
  step: number;
  inputs: Record<number, string>;
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
  guidedStrategyState: GuidedStrategyState;
  setGuidedStrategyState: React.Dispatch<React.SetStateAction<GuidedStrategyState>>;
  startAIGuidedStrategy: () => void;
  endAIGuidedStrategy: () => void;
  implementSuggestion: (suggestion: any) => Promise<void>;
  recordImplementedSuggestion: (suggestionId: string, documentType: string) => Promise<void>;
  createStrategyDocuments: (inputs: Record<number, string>) => void;
}

// Create the context with a default undefined value
export const AIAssistantContext = createContext<AIAssistantContextType | undefined>(undefined);

// Props for the provider component
interface AIAssistantProviderProps {
  children: ReactNode;
}

export const AIAssistantProvider: React.FC<AIAssistantProviderProps> = ({ children }) => {
  // Get auth context
  const auth = useAuth();
  
  // Get documents
  const documents = useDocuments();
  
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
  const [guidedStrategyState, setGuidedStrategyState] = useState<GuidedStrategyState>({
    active: false,
    step: 0,
    inputs: {}
  });

  // State for implemented suggestions
  const [implementedSuggestions, setImplementedSuggestions] = useState<string[]>([]);
  
  // Effect hook to check for empty documents and show guided strategy option
  useEffect(() => {
    const hasDocuments = documents?.hasDocuments;
    
    if (typeof window !== 'undefined' && hasDocuments === false && !guidedStrategyActive && claudeResponses.length <= 1) {
      // Only show this once when the app first loads with no documents
      const initialResponse = {
        id: claudeResponses.length + 1,
        response: "I notice you don't have any strategy documents yet. Would you like me to guide you through creating a complete strategy? I can help you develop a business model, strategic direction, OKRs, and financial projections."
      };
      
      setClaudeResponses([...claudeResponses, initialResponse]);
    }
  }, [documents?.hasDocuments, guidedStrategyActive, claudeResponses]);
  
  /**
   * Handle chat submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() === '') return;
    
    // Add user's message to the chat log
    const userMessage = {
      id: claudeResponses.length + 1,
      response: chatInput,
      timestamp: new Date()
    };
    
    setClaudeResponses(prev => [...prev, userMessage]);
    
    // If in guided strategy mode, handle differently
    if (guidedStrategyState.active) {
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
      ...guidedStrategyState.inputs,
      [guidedStrategyState.step]: chatInput
    };
    
    // Determine next step and response based on current step
    let nextStep = guidedStrategyState.step + 1;
    let nextResponse = "";
    
    switch(guidedStrategyState.step) {
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
        
        // Generate documents after delay
        setTimeout(() => {
          createStrategyDocuments(updatedInputs);
        }, 2000);
        break;
      default:
        nextResponse = "Let's continue building your strategy. What else would you like to focus on?";
    }
    
    // Update state
    setGuidedStrategyState({
      active: nextStep <= 4, // Only active for steps 1-4
      step: nextStep,
      inputs: updatedInputs
    });
    
    setGuidedStrategyActive(nextStep <= 4);
    
    // Add Claude response
    const newResponse = {
      id: claudeResponses.length + 2, // +2 because we added user message
      response: nextResponse,
      timestamp: new Date()
    };
    
    setClaudeResponses(prev => [...prev, newResponse]);
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
    setGuidedStrategyState({
      active: true,
      step: 1,
      inputs: {}
    });
    
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
    setGuidedStrategyState({
      active: false,
      step: 0,
      inputs: {}
    });
  };
  
  /**
   * Create strategy documents from guided inputs
   * This is a placeholder that would be implemented in a real app
   */
  const createStrategyDocuments = (inputs: Record<number, string>) => {
    console.log("Creating strategy documents from inputs:", inputs);
    
    // In a real app, this would actually create documents
    // For now, just generate simple documents
    
    // Process inputs and create documents
    console.log("Creating strategy documents from inputs:", inputs);
    
    // Sample Strategy Document Content
    const strategyContent = {
      html: `
        <div class="p-4">
          <h2 class="text-xl font-bold mb-4">Strategy Document - Generated</h2>
          <h3 class="text-lg font-semibold mb-2">Vision</h3>
          <p class="mb-4">Custom vision based on user inputs...</p>
          
          <h3 class="text-lg font-semibold mb-2">Mission</h3>
          <p class="mb-4">Custom mission based on user inputs...</p>
          
          <h3 class="text-lg font-semibold mb-2">Business Goals</h3>
          <ul class="list-disc pl-5 mb-4">
            <li>Goal 1 based on user inputs</li>
            <li>Goal 2 based on user inputs</li>
            <li>Goal 3 based on user inputs</li>
          </ul>
        </div>
      `,
      raw: {
        vision: "Custom vision based on user inputs...",
        mission: "Custom mission based on user inputs...",
        businessGoals: [
          "Goal 1 based on user inputs",
          "Goal 2 based on user inputs",
          "Goal 3 based on user inputs"
        ]
      }
    };
    
    // Sample OKR Content
    const okrContent = {
      html: `
        <div class="p-4">
          <h2 class="text-xl font-bold mb-4">OKRs - Generated</h2>
          
          <div class="mb-4">
            <h3 class="text-lg font-semibold mb-2">Objective 1: Generated from user input</h3>
            <p class="italic mb-2">Rationale: Based on strategic direction from step 2.</p>
            <ul class="list-disc pl-5">
              <li>KR1: Specific metric based on user input</li>
              <li>KR2: Specific metric based on user input</li>
              <li>KR3: Specific metric based on user input</li>
            </ul>
          </div>
          
          <div class="mb-4">
            <h3 class="text-lg font-semibold mb-2">Objective 2: Generated from user input</h3>
            <p class="italic mb-2">Rationale: Based on financial goals from step 4.</p>
            <ul class="list-disc pl-5">
              <li>KR1: Specific metric based on user input</li>
              <li>KR2: Specific metric based on user input</li>
              <li>KR3: Specific metric based on user input</li>
            </ul>
          </div>
        </div>
      `,
      raw: {
        objectives: [
          {
            title: "Generated from user input",
            rationale: "Based on strategic direction from step 2.",
            keyResults: [
              "Specific metric based on user input",
              "Specific metric based on user input",
              "Specific metric based on user input"
            ]
          },
          {
            title: "Generated from user input",
            rationale: "Based on financial goals from step 4.",
            keyResults: [
              "Specific metric based on user input",
              "Specific metric based on user input",
              "Specific metric based on user input"
            ]
          }
        ]
      }
    };
    
    // Sample Canvas Content
    const canvasContent = {
      html: `
        <div class="p-4">
          <h2 class="text-xl font-bold mb-4">Enhanced Strategy Canvas - Generated</h2>
          <h3 class="text-lg font-semibold mb-2">Business Model (Value Creation & Economic Viability)</h3>
          <div class="mb-4">
            <h4 class="font-medium">Customer Segments</h4>
            <ul class="list-disc pl-5">
              <li>Segment 1 based on user input from step 1</li>
              <li>Segment 2 based on user input from step 1</li>
            </ul>
          </div>
          <div class="mb-4">
            <h4 class="font-medium">Value Proposition</h4>
            <ul class="list-disc pl-5">
              <li>Value proposition based on user input from step 1</li>
              <li>Additional value proposition based on analysis</li>
            </ul>
          </div>
          <div class="mb-4">
            <h4 class="font-medium">Revenue Model</h4>
            <ul class="list-disc pl-5">
              <li>Revenue stream based on user input from step 4</li>
              <li>Additional revenue opportunities identified</li>
            </ul>
          </div>
        </div>
      `,
      raw: {
        businessModel: {
          customerSegments: [
            "Segment 1 based on user input from step 1",
            "Segment 2 based on user input from step 1"
          ],
          valueProposition: [
            "Value proposition based on user input from step 1",
            "Additional value proposition based on analysis"
          ],
          revenueModel: [
            "Revenue stream based on user input from step 4",
            "Additional revenue opportunities identified"
          ]
        }
      }
    };
    
    // Sample Financial Projection
    const financialContent = {
      html: `
        <div class="p-4">
          <h2 class="text-xl font-bold mb-4">Financial Projection - Generated</h2>
          <div class="mb-4">
            <h3 class="text-lg font-semibold mb-2">Revenue Forecasts</h3>
            <p>Based on financial goals from step 4 inputs</p>
            <table class="min-w-full border mt-2">
              <thead>
                <tr>
                  <th class="border p-2">Scenario</th>
                  <th class="border p-2">Year 1</th>
                  <th class="border p-2">Year 2</th>
                  <th class="border p-2">Year 3</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td class="border p-2">Optimistic</td>
                  <td class="border p-2">€XXX,XXX</td>
                  <td class="border p-2">€XXX,XXX</td>
                  <td class="border p-2">€XXX,XXX</td>
                </tr>
                <tr>
                  <td class="border p-2">Expected</td>
                  <td class="border p-2">€XXX,XXX</td>
                  <td class="border p-2">€XXX,XXX</td>
                  <td class="border p-2">€XXX,XXX</td>
                </tr>
                <tr>
                  <td class="border p-2">Conservative</td>
                  <td class="border p-2">€XXX,XXX</td>
                  <td class="border p-2">€XXX,XXX</td>
                  <td class="border p-2">€XXX,XXX</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="mb-4">
            <h3 class="text-lg font-semibold mb-2">Cost Structure</h3>
            <p>Derived from business model in step 1</p>
          </div>
        </div>
      `,
      raw: {
        revenue: {
          scenarios: {
            optimistic: { year1: 0, year2: 0, year3: 0 },
            expected: { year1: 0, year2: 0, year3: 0 },
            conservative: { year1: 0, year2: 0, year3: 0 }
          }
        },
        costs: {
          structure: "Derived from business model in step 1"
        }
      }
    };
    
    // Try to update documents through context
    try {
      if (documents?.updateDocument) {
        documents.updateDocument('Strategy', strategyContent);
        documents.updateDocument('OKRs', okrContent);
        documents.updateDocument('Canvas', canvasContent);
        documents.updateDocument('Financial Projection', financialContent);
      }
    } catch (error) {
      console.error("Error updating documents:", error);
    }
    
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
    suggestion: {
      id: string, 
      text: string, 
      implementationDetails: {
        section: string, 
        action: string
      }
    }
  ): Promise<void> => {
    setIsProcessing(true);
    
    try {
      const { section, action } = suggestion.implementationDetails;
      
      // Create standardized prompt for Claude
      const standardizedPrompt = `
INSTRUCTION: Please implement the following change to maintain strategic coherence across documents.

DOCUMENT TO MODIFY: ${section}
ACTION REQUIRED: ${action}
CONTEXT: This change is needed to ${suggestion.text.toLowerCase()}

Please implement this change while maintaining alignment with all other strategic documents.
`;

      // Send prompt to Claude (simulated)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Record the suggestion as implemented
      setImplementedSuggestions(prev => [...prev, suggestion.id]);
      
      // Add Claude's response
      const newResponse = {
        id: claudeResponses.length + 1,
        response: `I've implemented the suggested change to ${section}: ${action}. This maintains strategic coherence by ensuring alignment between your documents. The changes have been highlighted in green in the document.`,
        timestamp: new Date()
      };
      
      setClaudeResponses(prev => [...prev, newResponse]);
      
      // Also record in database if user is logged in
      await recordImplementedSuggestion(suggestion.id, section);
      
      setIsProcessing(false);
    } catch (error) {
      setIsProcessing(false);
      console.error('Error implementing suggestion:', error);
      throw error;
    }
  };
  
  /**
   * Record an implemented suggestion in the database
   */
  const recordImplementedSuggestion = async (suggestionId: string, documentType: string): Promise<void> => {
    if (!auth?.user || !auth?.db) return;
    
    try {
      // Map UI document names to DB document types
      const docTypeMap: {[key: string]: string} = {
        'Canvas': 'canvas',
        'Strategy': 'strategy',
        'Financial Projection': 'financial',
        'OKRs': 'okrs'
      };
      
      const dbType = docTypeMap[documentType];
      if (!dbType) return;
      
      // Get projectId (this would come from your documents context in real app)
      const projectId = documents?.projectId || 'default-project';
      if (projectId === 'default-project') return;
      
      await auth.db.recordImplementedSuggestion(projectId, dbType, suggestionId);
    } catch (error) {
      console.error("Error recording implemented suggestion:", error);
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
    guidedStrategyState,
    setGuidedStrategyState,
    startAIGuidedStrategy,
    endAIGuidedStrategy,
    implementSuggestion,
    recordImplementedSuggestion,
    createStrategyDocuments
  };
  
  return (
    <AIAssistantContext.Provider value={value}>
      {children}
    </AIAssistantContext.Provider>
  );
};

// Custom hook for using the AI Assistant context
export const useAIAssistant = () => {
  const context = React.useContext(AIAssistantContext);
  if (context === undefined) {
    throw new Error('useAIAssistant must be used within an AIAssistantProvider');
  }
  return context;
};