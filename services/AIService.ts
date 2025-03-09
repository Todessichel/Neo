export interface Suggestion {
  id: string;
  text: string;
  implementationDetails: {
    section: string;
    action: string;
  };
}

export interface Inconsistency {
  id: string;
  text: string;
  severity: 'high' | 'medium' | 'low';
  implementationDetails: {
    section: string;
    action: string;
  };
}

export interface ClaudeResponse {
  id: number;
  response: string;
}

export interface DocumentSynopsis {
  canvas?: any;
  strategy?: any;
  financial?: any;
  okrs?: any;
}

export interface AIServiceInterface {
  analyzeDocument(documentType: string, content: any, otherDocuments: DocumentSynopsis): Promise<{
    suggestions: Suggestion[];
    inconsistencies: Inconsistency[];
  }>;
  getResponse(prompt: string, context?: DocumentSynopsis): Promise<ClaudeResponse>;
  implementSuggestion(suggestion: Suggestion, currentContent: any): Promise<{
    updatedContent: any;
    response: ClaudeResponse;
  }>;
  startGuidedStrategy(): Promise<ClaudeResponse>;
  processGuidedStrategyInput(step: number, input: string): Promise<{
    nextStep: number;
    response: ClaudeResponse;
  }>;
  generateDocumentsFromGuidedStrategy(inputs: Record<number, string>): Promise<{
    documents: DocumentSynopsis;
    response: ClaudeResponse;
  }>;
}

/**
 * Service for handling interactions with Claude AI
 */
export class AIService implements AIServiceInterface {
  private responseCounter: number = 0;
  
  constructor() {
    // Initialize counter from localStorage
    if (typeof window !== 'undefined') {
      const counter = localStorage.getItem('neoResponseCounter');
      if (counter) {
        this.responseCounter = parseInt(counter, 10);
      }
    }
  }
  
  /**
   * Generate a unique ID for a suggestion
   */
  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  
  /**
   * Create a new Claude response
   */
  private createResponse(text: string): ClaudeResponse {
    this.responseCounter++;
    
    // Save counter to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('neoResponseCounter', this.responseCounter.toString());
    }
    
    return {
      id: this.responseCounter,
      response: text
    };
  }
  
  /**
   * Analyze a document for suggestions and inconsistencies
   */
  public async analyzeDocument(
    documentType: string, 
    content: any, 
    otherDocuments: DocumentSynopsis
  ): Promise<{
    suggestions: Suggestion[];
    inconsistencies: Inconsistency[];
  }> {
    // In a real implementation, this would call the Anthropic API
    // For the prototype, we'll simulate suggestions and inconsistencies
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate analysis results
        const suggestions: Suggestion[] = [
          {
            id: this.generateId('suggestion'),
            text: `Enhance the ${documentType} with more specific metrics`,
            implementationDetails: {
              section: documentType,
              action: `Add specific metrics to the ${documentType}`
            }
          },
          {
            id: this.generateId('suggestion'),
            text: `Clarify the target audience in ${documentType}`,
            implementationDetails: {
              section: documentType,
              action: `Add target audience details to ${documentType}`
            }
          }
        ];
        
        // Check for specific inconsistencies between documents
        const inconsistencies: Inconsistency[] = [];
        
        if (documentType === 'Strategy' && otherDocuments.okrs) {
          inconsistencies.push({
            id: this.generateId('inconsistency'),
            text: 'Strategy mentions 90% customer satisfaction target, but no corresponding KR exists in OKRs',
            severity: 'high',
            implementationDetails: {
              section: 'OKRs',
              action: 'Add customer satisfaction KR to align with Strategy'
            }
          });
        }
        
        if (documentType === 'OKRs' && otherDocuments.canvas) {
          inconsistencies.push({
            id: this.generateId('inconsistency'),
            text: 'OKRs target 300 subscribers, but specific acquisition strategies are undefined in Canvas',
            severity: 'medium',
            implementationDetails: {
              section: 'Canvas',
              action: 'Add acquisition strategies to align with OKR targets'
            }
          });
        }
        
        if (documentType === 'Financial Projection') {
          inconsistencies.push({
            id: this.generateId('inconsistency'),
            text: 'Financial projection shows €8,300 MRR but may be unrealistic given the subscription tier distribution',
            severity: 'low',
            implementationDetails: {
              section: 'Financial Projection',
              action: 'Adjust MRR target or subscription distribution'
            }
          });
        }
        
        resolve({ suggestions, inconsistencies });
      }, 1000);
    });
  }
  
  /**
   * Get a response from Claude
   */
  public async getResponse(prompt: string, context?: DocumentSynopsis): Promise<ClaudeResponse> {
    // In a real implementation, this would call the Anthropic API
    // For the prototype, we'll simulate a response
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Generate a contextual response based on the prompt
        let response: string;
        
        if (prompt.toLowerCase().includes('analyze') || prompt.toLowerCase().includes('review')) {
          response = "I've analyzed your documents and found several areas where your strategy could be improved. The financial projections seem optimistic compared to your marketing plan, and there's a disconnect between your OKRs and your strategic priorities. Would you like me to suggest specific improvements?";
        }
        else if (prompt.toLowerCase().includes('improve') || prompt.toLowerCase().includes('suggestion')) {
          response = "Based on systems thinking principles, I recommend strengthening the reinforcing feedback loops between your customer acquisition strategy and revenue goals. Your strategy document mentions targeting enterprise clients, but your financial projections don't account for the longer sales cycles. Would you like me to help align these elements?";
        }
        else if (prompt.toLowerCase().includes('inconsistenc')) {
          response = "I've identified 3 key inconsistencies: 1) Your OKRs target 300 subscribers but your Canvas lacks specific acquisition channels, 2) Your Strategy mentions a 90% customer satisfaction goal but there's no corresponding KR, and 3) Your Financial Projection shows an €8,300 MRR target that may be unrealistic given your tiered pricing strategy.";
        }
        else {
          response = "I'm analyzing your input regarding " + (context ? Object.keys(context).join(', ') : "your strategy") + ". Based on systems thinking principles, I can see potential reinforcing loops between your strategy and financial projections that need attention. Would you like me to elaborate on specific adjustments?";
        }
        
        resolve(this.createResponse(response));
      }, 1000);
    });
  }
  
  /**
   * Implement a suggestion in document content
   */
  public async implementSuggestion(
    suggestion: Suggestion, 
    currentContent: any
  ): Promise<{
    updatedContent: any;
    response: ClaudeResponse;
  }> {
    // In a real implementation, this would use more sophisticated logic
    // For the prototype, we'll simulate content updates
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Create a copy of the current content
        const updatedContent = JSON.parse(JSON.stringify(currentContent));
        
        // Simulate implementing the suggestion based on the action
        const { section, action } = suggestion.implementationDetails;
        
        // In a real implementation, this would be more sophisticated
        // For now, just return the suggestion implementation as a response
        
        const response = this.createResponse(
          `I've implemented the suggested change to ${section}: ${action}. This maintains strategic coherence by ensuring alignment between your documents. The changes have been highlighted in green in the document.`
        );
        
        resolve({ updatedContent, response });
      }, 1500);
    });
  }
  
  /**
   * Start a guided strategy creation process
   */
  public async startGuidedStrategy(): Promise<ClaudeResponse> {
    return this.createResponse(
      "I'll help you create a complete strategy. Let's start with the fundamentals of your business model. Could you tell me about your target customer segments, what pain points you're solving, and what unique value you provide?"
    );
  }
  
  /**
   * Process user input for a guided strategy step
   */
  public async processGuidedStrategyInput(
    step: number, 
    input: string
  ): Promise<{
    nextStep: number;
    response: ClaudeResponse;
  }> {
    // Process the input and determine the next step + response
    let nextStep = step + 1;
    let responseText = "";
    
    switch(step) {
      case 1: // Business Model Fundamentals
        responseText = "Great! Now let's talk about your strategic approach. Would you prefer a conservative approach prioritizing stability and consistent profitability, a moderate approach balancing growth with risk management, or an aggressive approach emphasizing faster growth with higher risk?";
        break;
      case 2: // Strategic Direction
        responseText = "I'll create a strategy document based on your approach. Now let's define some key objectives and results. What are the 3-5 most important goals you want to achieve in the next year?";
        break;
      case 3: // OKR Development
        responseText = "Now let's set some financial goals. What are your targets for revenue, profit margin, and investment capacity? Please provide ranges for optimistic, expected, and pessimistic scenarios.";
        break;
      case 4: // Financial Goals
        responseText = "Thank you! I'm now generating your complete set of strategy documents based on all your inputs. This includes an Enhanced Strategy Canvas, Strategy Document, OKRs, and Financial Projections - all aligned and coherent with each other.";
        break;
      default:
        responseText = "Let's continue developing your strategy. What aspect would you like to focus on next?";
        nextStep = 1; // Reset to beginning if we're out of steps
    }
    
    return {
      nextStep,
      response: this.createResponse(responseText)
    };
  }
  
  /**
   * Generate complete strategy documents from guided inputs
   */
  public async generateDocumentsFromGuidedStrategy(
    inputs: Record<number, string>
  ): Promise<{
    documents: DocumentSynopsis;
    response: ClaudeResponse;
  }> {
    // In a real implementation, this would generate actual document content
    // For the prototype, we'll return simple placeholder content
    
    return new Promise((resolve) => {
      setTimeout(() => {
        // Create basic documents based on inputs
        const documents: DocumentSynopsis = {
          canvas: {
            html: '<h2>Enhanced Strategy Canvas - Generated</h2><p>Based on user inputs...</p>',
            raw: { customerSegments: [], valueProposition: [] }
          },
          strategy: {
            html: '<h2>Strategy Document - Generated</h2><p>Based on user inputs...</p>',
            raw: { vision: '', mission: '', businessGoals: [] }
          },
          okrs: {
            html: '<h2>OKRs - Generated</h2><p>Based on user inputs...</p>',
            raw: { objectives: [] }
          },
          financial: {
            html: '<h2>Financial Projection - Generated</h2><p>Based on user inputs...</p>',
            raw: { revenue: {}, costs: {} }
          }
        };
        
        const response = this.createResponse(
          "I've created your strategy documents! You can view and edit them using the tabs on the left. I've also identified some potential improvements and inconsistencies that you might want to address to strengthen your strategy."
        );
        
        resolve({ documents, response });
      }, 2000);
    });
  }
}

// Create singleton instance
export const aiService = new AIService();