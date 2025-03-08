// useGuidedStrategy.ts
import { useState } from 'react';
import { DocumentContent } from './useDocuments';

interface GuidedStrategyState {
  active: boolean;
  step: number;
  inputs: Record<number, string>;
}

export interface GuidedStrategyHook {
  guidedStrategyState: GuidedStrategyState;
  startAIGuidedStrategy: () => void;
  processStrategyInput: (input: string) => void;
  cancelGuidedStrategy: () => void;
}

export const useGuidedStrategy = (
  setDocumentContent: (updater: (prev: DocumentContent) => DocumentContent) => void,
  setHasDocuments: (has: boolean) => void,
  setInconsistencyCount: (updater: (prev: Record<string, number>) => Record<string, number>) => void,
  addClaudeResponse: (response: string) => void
): GuidedStrategyHook => {
  const [guidedStrategyState, setGuidedStrategyState] = useState<GuidedStrategyState>({
    active: false,
    step: 0,
    inputs: {}
  });
  
  // Function to start the guided strategy process
  const startAIGuidedStrategy = () => {
    if (typeof window === 'undefined') return;
    
    // Initialize the process
    setGuidedStrategyState({
      active: true,
      step: 1,
      inputs: {}
    });
    
    // Add initial Claude response
    const welcomeResponse = "I'll help you create a complete strategy. Let's start with the fundamentals of your business model. Could you tell me about your target customer segments, what pain points you're solving, and what unique value you provide?";
    
    addClaudeResponse(welcomeResponse);
  };
  
  // Function to cancel the guided strategy process
  const cancelGuidedStrategy = () => {
    setGuidedStrategyState({
      active: false,
      step: 0,
      inputs: {}
    });
    
    addClaudeResponse("I've cancelled the guided strategy process. If you'd like to start again later, just let me know.");
  };
  
  // Function to process user input for each step of the guided strategy
  const processStrategyInput = (input: string) => {
    if (!guidedStrategyState.active || typeof window === 'undefined') return;
    
    // Save user input for current step
    const updatedInputs = {
      ...guidedStrategyState.inputs,
      [guidedStrategyState.step]: input
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
        
        // Here you would actually generate the documents based on collected inputs
        setTimeout(() => {
          createStrategyDocuments(updatedInputs);
        }, 2000);
        break;
    }
    
    // Update state
    setGuidedStrategyState({
      active: nextStep <= 4, // Only active for steps 1-4
      step: nextStep,
      inputs: updatedInputs
    });
    
    // Add Claude response for the next step
    addClaudeResponse(nextResponse);
  };
  
  // Function to create strategy documents from guided inputs
  const createStrategyDocuments = (inputs: Record<number, string>) => {
    if (typeof window === 'undefined') return;
    
    // Process inputs and create documents
    console.log("Creating strategy documents from inputs:", inputs);
    
    // Sample Strategy Document
    const strategyContent = (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Strategy Document - Generated</h2>
        <h3 className="text-lg font-semibold mb-2">Vision</h3>
        <p className="mb-4">Custom vision based on user inputs...</p>
        
        <h3 className="text-lg font-semibold mb-2">Mission</h3>
        <p className="mb-4">Custom mission based on user inputs...</p>
        
        <h3 className="text-lg font-semibold mb-2">Business Goals</h3>
        <ul className="list-disc pl-5 mb-4">
          <li>Goal 1 based on user inputs</li>
          <li>Goal 2 based on user inputs</li>
          <li>Goal 3 based on user inputs</li>
        </ul>
      </div>
    );
    
    // Sample OKR Content
    const okrContent = (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">OKRs - Generated</h2>
        
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Objective 1: Generated from user input</h3>
          <p className="italic mb-2">Rationale: Based on strategic direction from step 2.</p>
          <ul className="list-disc pl-5">
            <li>KR1: Specific metric based on user input</li>
            <li>KR2: Specific metric based on user input</li>
            <li>KR3: Specific metric based on user input</li>
          </ul>
        </div>
        
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Objective 2: Generated from user input</h3>
          <p className="italic mb-2">Rationale: Based on financial goals from step 4.</p>
          <ul className="list-disc pl-5">
            <li>KR1: Specific metric based on user input</li>
            <li>KR2: Specific metric based on user input</li>
            <li>KR3: Specific metric based on user input</li>
          </ul>
        </div>
      </div>
    );
    
    // Sample Canvas Content
    const canvasContent = (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Enhanced Strategy Canvas - Generated</h2>
        <h3 className="text-lg font-semibold mb-2">Business Model (Value Creation & Economic Viability)</h3>
        <div className="mb-4">
          <h4 className="font-medium">Customer Segments</h4>
          <ul className="list-disc pl-5">
            <li>Segment 1 based on user input from step 1</li>
            <li>Segment 2 based on user input from step 1</li>
          </ul>
        </div>
        <div className="mb-4">
          <h4 className="font-medium">Value Proposition</h4>
          <ul className="list-disc pl-5">
            <li>Value proposition based on user input from step 1</li>
            <li>Additional value proposition based on analysis</li>
          </ul>
        </div>
        <div className="mb-4">
          <h4 className="font-medium">Revenue Model</h4>
          <ul className="list-disc pl-5">
            <li>Revenue stream based on user input from step 4</li>
            <li>Additional revenue opportunities identified</li>
          </ul>
        </div>
      </div>
    );
    
    // Sample Financial Projection
    const financialContent = (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Financial Projection - Generated</h2>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Revenue Forecasts</h3>
          <p>Based on financial goals from step 4 inputs</p>
          <table className="min-w-full border mt-2">
            <thead>
              <tr>
                <th className="border p-2">Scenario</th>
                <th className="border p-2">Year 1</th>
                <th className="border p-2">Year 2</th>
                <th className="border p-2">Year 3</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">Optimistic</td>
                <td className="border p-2">€XXX,XXX</td>
                <td className="border p-2">€XXX,XXX</td>
                <td className="border p-2">€XXX,XXX</td>
              </tr>
              <tr>
                <td className="border p-2">Expected</td>
                <td className="border p-2">€XXX,XXX</td>
                <td className="border p-2">€XXX,XXX</td>
                <td className="border p-2">€XXX,XXX</td>
              </tr>
              <tr>
                <td className="border p-2">Conservative</td>
                <td className="border p-2">€XXX,XXX</td>
                <td className="border p-2">€XXX,XXX</td>
                <td className="border p-2">€XXX,XXX</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Cost Structure</h3>
          <p>Derived from business model in step 1</p>
        </div>
      </div>
    );
    
    // Update document content
    setDocumentContent({
      'Strategy': strategyContent,
      'OKRs': okrContent,
      'Canvas': canvasContent,
      'Financial Projection': financialContent
    });
    
    // Set hasDocuments to true
    setHasDocuments(true);
    
    // Add confirmation response
    addClaudeResponse("I've created your strategy documents! You can view and edit them using the tabs on the left. I've also identified some potential improvements and inconsistencies that you might want to address to strengthen your strategy.");
    
    // Add some sample inconsistencies
    setInconsistencyCount({
      'Canvas': 1,
      'Strategy': 1,
      'Financial Projection': 1,
      'OKRs': 2
    });
  };
  
  return {
    guidedStrategyState,
    startAIGuidedStrategy,
    processStrategyInput,
    cancelGuidedStrategy
  };
};