import React, { createContext, useContext, useState } from 'react';
import { aiService, ClaudeResponse, Suggestion, Inconsistency } from '../services/AIService';
import { useDocuments } from './DocumentContext';

interface AIAssistantContextType {
  chatInput: string;
  setChatInput: (input: string) => void;
  claudeResponses: ClaudeResponse[];
  successMessage: string | null;
  setSuccessMessage: (message: string | null) => void;
  claudePrompt: string | null;
  promptStage: 'idle' | 'pending' | 'completed';
  implementedSuggestions: string[];
  handleSubmit: (e: React.FormEvent) => void;
  implementSuggestion: (suggestion: Suggestion | Inconsistency) => void;
  startAIGuidedStrategy: () => void;
  guidedStrategyState: {
    active: boolean;
    step: number;
    inputs: Record<number, string>;
  };
  improvementSuggestions: Record<string, Suggestion[]>;
  inconsistencies: Record<string, Inconsistency[]>;
}

const AIAssistantContext = createContext<AIAssistantContextType>({
  chatInput: '',
  setChatInput: () => {},
  claudeResponses: [],
  successMessage: null,
  setSuccessMessage: () => {},
  claudePrompt: null,
  promptStage: 'idle',
  implementedSuggestions: [],
  handleSubmit: () => {},
  implementSuggestion: () => {},
  startAIGuidedStrategy: () => {},
  guidedStrategyState: {
    active: false,
    step: 0,
    inputs: {}
  },
  improvementSuggestions: {},
  inconsistencies: {}
});

export const AIAssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Chat state
  const [chatInput, setChatInput] = useState<string>('');
  const [claudeResponses, setClaudeResponses] = useState<ClaudeResponse[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [claudePrompt, setClaudePrompt] = useState<string | null>(null);
  const [promptStage, setPromptStage] = useState<'idle' | 'pending' | 'completed'>('idle');
  const [implementedSuggestions, setImplementedSuggestions] = useState<string[]>([]);
  
  // Guided strategy state
  const [guidedStrategyState, setGuidedStrategyState] = useState({
    active: false,
    step: 0,
    inputs: {} as Record<number, string>
  });
  
  // Document context for access to document state
  const { 
    activeDocument, 
    documentContent, 
    setDocumentContent,
    setInconsistencyCount,
    saveDocumentChanges,
    recordImplementedSuggestion
  } = useDocuments();
  
  // Mock data for suggestions and inconsistencies
  // In a real implementation, these would come from API calls
  const [improvementSuggestions, setImprovementSuggestions] = useState<Record<string, Suggestion[]>>({
    Strategy: [
      {
        id: 'strategy-1',
        text: 'Add specific customer acquisition channels in your strategy document',
        implementationDetails: {
          section: 'Strategy',
          action: 'Add a "Key Strategic Priorities" section with customer acquisition channels'
        }
      },
      {
        id: 'strategy-2',
        text: 'Include a clear competitive analysis to strengthen positioning',
        implementationDetails: {
          section: 'Strategy',
          action: 'Add competitive analysis section'
        }
      }
    ],
    OKRs: [
      {
        id: 'okr-1',
        text: 'Add customer satisfaction KR to match 90% target in Strategy Document',
        implementationDetails: {
          section: 'OKRs',
          action: 'Add customer satisfaction KR'
        }
      },
      {
        id: 'okr-2',
        text: 'Add product development milestones to better track execution',
        implementationDetails: {
          section: 'OKRs',
          action: 'Add product development OKR'
        }
      }
    ],
    'Financial Projection': [
      {
        id: 'finance-1',
        text: 'Include sensitivity analysis for different churn scenarios',
        implementationDetails: {
          section: 'Financial Projection',
          action: 'Add sensitivity analysis section'
        }
      },
      {
        id: 'finance-2',
        text: 'Revise MRR target to €7,000 for a more conservative approach',
        implementationDetails: {
          section: 'Financial Projection',
          action: 'Adjust MRR target'
        }
      }
    ],
    Canvas: [
      {
        id: 'canvas-1',
        text: 'Define specific acquisition strategies for 300 subscribers',
        implementationDetails: {
          section: 'Canvas',
          action: 'Add acquisition strategies to Canvas'
        }
      },
      {
        id: 'canvas-2',
        text: 'Add risk management section to address potential system traps',
        implementationDetails: {
          section: 'Canvas',
          action: 'Add risk management section'
        }
      }
    ]
  });
  
  const [inconsistencies, setInconsistencies] = useState<Record<string, Inconsistency[]>>({
    Strategy: [
      {
        id: 'inconsistency-strategy-1',
        text: 'Strategy mentions 90% customer satisfaction target, but no corresponding KR exists in OKRs',
        severity: 'high',
        implementationDetails: {
          section: 'OKRs',
          action: 'Add customer satisfaction KR to align with Strategy'
        }
      }
    ],
    OKRs: [
      {
        id: 'inconsistency-okr-1',
        text: 'OKRs target 300 subscribers, but specific acquisition strategies are undefined in Canvas',
        severity: 'medium',
        implementationDetails: {
          section: 'Canvas',
          action: 'Add acquisition strategies to align with OKR targets'
        }
      }
    ],
    'Financial Projection': [
      {
        id: 'inconsistency-finance-1',
        text: 'Financial projection shows €8,300 MRR but may be unrealistic given the subscription tier distribution',
        severity: 'low',
        implementationDetails: {
          section: 'Financial Projection',
          action: 'Adjust MRR target or subscription distribution'
        }
      }
    ],
    Canvas: [
      {
        id: 'inconsistency-canvas-1',
        text: 'Canvas lacks channel strategy but OKRs assume specific acquisition metrics',
        severity: 'medium',
        implementationDetails: {
          section: 'Canvas',
          action: 'Add channels section to Canvas'
        }
      }
    ]
  });

  // Initialize Claude responses on first mount
  React.useEffect(() => {
    if (claudeResponses.length === 0) {
      setClaudeResponses([{
        id: 1,
        response: "I've analyzed your strategy document and financial projections. There are several areas where the OKRs could be better aligned with your financial goals. Would you like me to suggest specific improvements?"
      }]);
    }
  }, []);

  // Handle chat form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() === '') return;
    
    // Store the current input
    const currentInput = chatInput;
    // Clear input field immediately for better UX
    setChatInput('');
    
    // If guided strategy is active, process the input for the current step
    if (guidedStrategyState.active) {
      // Save user input for current step
      const updatedInputs = {
        ...guidedStrategyState.inputs,
        [guidedStrategyState.step]: currentInput
      };
      
      try {
        // Process the input with the AI service
        const { nextStep, response } = await aiService.processGuidedStrategyInput(
          guidedStrategyState.step,
          currentInput
        );
        
        // Add Claude response
        setClaudeResponses(prev => [...prev, response]);
        
        // If we've completed the final step, generate the documents
        if (guidedStrategyState.step === 4) {
          setTimeout(async () => {
            try {
              const { documents, response } = await aiService.generateDocumentsFromGuidedStrategy(updatedInputs);
              
              // Update document content with generated content
              // This would be more sophisticated in a real implementation
              setDocumentContent({
                'Canvas': <div className="p-4" dangerouslySetInnerHTML={{ __html: documents.canvas?.html }} />,
                'Strategy': <div className="p-4" dangerouslySetInnerHTML={{ __html: documents.strategy?.html }} />,
                'Financial Projection': <div className="p-4" dangerouslySetInnerHTML={{ __html: documents.financial?.html }} />,
                'OKRs': <div className="p-4" dangerouslySetInnerHTML={{ __html: documents.okrs?.html }} />
              });
              
              // Add the completion response
              setClaudeResponses(prev => [...prev, response]);
              
              // Update inconsistency counts to show some sample issues
              setInconsistencyCount({
                'Canvas': 1,
                'Strategy': 1,
                'Financial Projection': 1,
                'OKRs': 2
              });
              
              // Set guided strategy to inactive
              setGuidedStrategyState({
                active: false,
                step: 0,
                inputs: updatedInputs
              });
            } catch (error) {
              console.error('Error generating documents:', error);
            }
          }, 2000);
        }
        
        // Update guided strategy state
        setGuidedStrategyState({
          active: nextStep <= 4, // Only active for steps 1-4
          step: nextStep,
          inputs: updatedInputs
        });
      } catch (error) {
        console.error('Error processing guided strategy input:', error);
      }
    } else {
      // Regular chat handling for non-guided interactions
      try {
        // Get a response from the AI service
        const response = await aiService.getResponse(currentInput);
        
        // Add Claude response
        setClaudeResponses(prev => [...prev, response]);
      } catch (error) {
        console.error('Error getting AI response:', error);
      }
    }
  };

  // Start the guided strategy process
  const startAIGuidedStrategy = async () => {
    try {
      // Get initial response from the AI service
      const response = await aiService.startGuidedStrategy();
      
      // Add Claude response
      setClaudeResponses(prev => [...prev, response]);
      
      // Set guided strategy to active
      setGuidedStrategyState({
        active: true,
        step: 1,
        inputs: {}
      });
    } catch (error) {
      console.error('Error starting guided strategy:', error);
    }
  };

  // Implement a suggestion
  const implementSuggestion = async (suggestion: Suggestion | Inconsistency) => {
    const { section, action } = suggestion.implementationDetails;
    
    // Create standardized prompt for Claude
    const standardizedPrompt = `
INSTRUCTION: Please implement the following change to maintain strategic coherence across documents.

DOCUMENT TO MODIFY: ${section}
ACTION REQUIRED: ${action}
CONTEXT: This change is needed to ${suggestion.text.toLowerCase()}

Please implement this change while maintaining alignment with all other strategic documents.
`;

    // Set the Claude prompt
    setClaudePrompt(standardizedPrompt);
    setPromptStage('pending');
    
    try {
      // In a real implementation, this would use the AI service to generate the update
      // For simplicity in this prototype, we'll simulate the update with a timeout
      setTimeout(async () => {
        // Simulate update based on the suggestion
        updateDocumentBasedOnSuggestion(suggestion);
        
        // Add Claude's response
        const newResponse = {
          id: claudeResponses.length + 1,
          response: `I've implemented the suggested change to ${section}: ${action}. This maintains strategic coherence by ensuring alignment between your documents. The changes have been highlighted in green in the document.`
        };
        
        setClaudeResponses(prev => [...prev, newResponse]);
        
        // Add to implemented suggestions
        setImplementedSuggestions(prev => [...prev, suggestion.id]);
        
        // Show success message
        setSuccessMessage(`Successfully implemented: ${suggestion.text}`);
        setTimeout(() => setSuccessMessage(null), 3000);
        
        // Reset prompt stage
        setPromptStage('completed');
        setTimeout(() => setPromptStage('idle'), 2000);
      }, 1500);
    } catch (error) {
      console.error('Error implementing suggestion:', error);
      setPromptStage('idle');
    }
  };
  
  // This function simulates updating a document based on a suggestion
  // In a real implementation, this would use more sophisticated logic
  const updateDocumentBasedOnSuggestion = (suggestion: Suggestion | Inconsistency) => {
    const { section, action } = suggestion.implementationDetails;
    
    // Example implementation for a specific suggestion
    if (section === 'Strategy' && action === 'Add a "Key Strategic Priorities" section with customer acquisition channels') {
      const htmlContent = `
        <h2 class="text-xl font-bold mb-4">Strategy Document - NEO</h2>
        <h3 class="text-lg font-semibold mb-2">Vision</h3>
        <p class="mb-4">To become the standard integrated platform that continuously aligns a company's strategic plan, financial projections, and operational metrics—guiding both startups and their investors towards sustainable, data-driven success.</p>
        
        <h3 class="text-lg font-semibold mb-2">Mission</h3>
        <p class="mb-4">NEO empowers startups and VCs to jointly create, track, and adapt cohesive strategies in real time. By merging systems thinking, strategy formulation, and financial modeling, we ensure every business decision is dynamic, evidence-based, and future-resilient.</p>
        
        <h3 class="text-lg font-semibold mb-2">Business Goals</h3>
        <ul class="list-disc pl-5 mb-4">
          <li>Profit Every Year: Reach operational profitability within 2 years</li>
          <li>Continuous growth in profit margins and net profit</li>
          <li>Demonstrate 50% reduction in planning cycle times for users</li>
          <li>Attain customer satisfaction rating over 90% within 18 months</li>
        </ul>
        
        <h3 class="text-lg font-semibold mb-2">Key Strategic Priorities</h3>
        <div class="pl-5 mb-4">
          <h4 class="font-medium">Customer Acquisition Channels</h4>
          <ul class="list-disc pl-5">
            <li>Targeted LinkedIn Ads for startup founders / scale‐up CEOs</li>
            <li>Bi‐weekly NEO Live Demo Webinars</li>
            <li>Partnerships with 2-3 startup accelerators or VC networks</li>
            <li>Direct founder-led outreach to potential Enterprise clients</li>
            <li>Thought leadership content on strategy + systems thinking</li>
          </ul>
        </div>
      `;
      
      const rawContent = {
        vision: "To become the standard integrated platform that continuously aligns a company's strategic plan, financial projections, and operational metrics—guiding both startups and their investors towards sustainable, data-driven success.",
        mission: "NEO empowers startups and VCs to jointly create, track, and adapt cohesive strategies in real time. By merging systems thinking, strategy formulation, and financial modeling, we ensure every business decision is dynamic, evidence-based, and future-resilient.",
        businessGoals: [
          "Profit Every Year: Reach operational profitability within 2 years",
          "Continuous growth in profit margins and net profit",
          "Demonstrate 50% reduction in planning cycle times for users",
          "Attain customer satisfaction rating over 90% within 18 months"
        ],
        strategicPriorities: {
          customerAcquisition: [
            "Targeted LinkedIn Ads for startup founders / scale‐up CEOs",
            "Bi‐weekly NEO Live Demo Webinars",
            "Partnerships with 2-3 startup accelerators or VC networks",
            "Direct founder-led outreach to potential Enterprise clients",
            "Thought leadership content on strategy + systems thinking"
          ]
        }
      };
      
      // Update document content in UI
      setDocumentContent(prev => ({
        ...prev,
        Strategy: (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Strategy Document - NEO</h2>
            <h3 className="text-lg font-semibold mb-2">Vision</h3>
            <p className="mb-4">To become the standard integrated platform that continuously aligns a company's strategic plan, financial projections, and operational metrics—guiding both startups and their investors towards sustainable, data-driven success.</p>
            
            <h3 className="text-lg font-semibold mb-2">Mission</h3>
            <p className="mb-4">NEO empowers startups and VCs to jointly create, track, and adapt cohesive strategies in real time. By merging systems thinking, strategy formulation, and financial modeling, we ensure every business decision is dynamic, evidence-based, and future-resilient.</p>
            
            <h3 className="text-lg font-semibold mb-2">Business Goals</h3>
            <ul className="list-disc pl-5 mb-4">
              <li>Profit Every Year: Reach operational profitability within 2 years</li>
              <li>Continuous growth in profit margins and net profit</li>
              <li>Demonstrate 50% reduction in planning cycle times for users</li>
              <li>Attain customer satisfaction rating over 90% within 18 months</li>
            </ul>
            
            <h3 className="text-lg font-semibold mb-2 bg-green-100 p-2">Key Strategic Priorities</h3>
            <div className="pl-5 mb-4 bg-green-50 p-2">
              <h4 className="font-medium">Customer Acquisition Channels</h4>
              <ul className="list-disc pl-5">
                <li>Targeted LinkedIn Ads for startup founders / scale‐up CEOs</li>
                <li>Bi‐weekly NEO Live Demo Webinars</li>
                <li>Partnerships with 2-3 startup accelerators or VC networks</li>
                <li>Direct founder-led outreach to potential Enterprise clients</li>
                <li>Thought leadership content on strategy + systems thinking</li>
              </ul>
            </div>
          </div>
        )
      }));
      
      // Save to database
      saveDocumentChanges('Strategy', htmlContent, rawContent);
      recordImplementedSuggestion(suggestion.id, 'Strategy');
      
      // Update inconsistency count
      setInconsistencyCount(prev => ({
        ...prev,
        'Strategy': 0
      }));
    }
    
    // Other implementations for different suggestions would go here
  };

  return (
    <AIAssistantContext.Provider
      value={{
        chatInput,
        setChatInput,
        claudeResponses,
        successMessage,
        setSuccessMessage,
        claudePrompt,
        promptStage,
        implementedSuggestions,
        handleSubmit,
        implementSuggestion,
        startAIGuidedStrategy,
        guidedStrategyState,
        improvementSuggestions,
        inconsistencies
      }}
    >
      {children}
    </AIAssistantContext.Provider>
  );
};

export const useAIAssistant = () => useContext(AIAssistantContext);