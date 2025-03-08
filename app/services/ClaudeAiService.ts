// Claude API Service
interface ClaudeMessage {
    role: 'user' | 'assistant';
    content: string;
  }
  
  interface ClaudeCompletionRequest {
    model: string;
    messages: ClaudeMessage[];
    max_tokens?: number;
    temperature?: number;
    system?: string;
  }
  
  interface ClaudeCompletionResponse {
    id: string;
    type: string;
    role: string;
    content: {
      type: string;
      text: string;
    }[];
    model: string;
    stop_reason: string;
    stop_sequence: string | null;
    usage: {
      input_tokens: number;
      output_tokens: number;
    };
  }
  
  export class ClaudeApiService {
    private apiKey: string;
    private apiUrl: string = 'https://api.anthropic.com/v1/messages';
    private defaultModel: string = 'claude-3-opus-20240229';
    private systemPrompt: string = `
      You are an AI-powered expert in Strategy (Richard Rumelt, Roger Martin), 
      Systems Theory (Donella H Meadows) and a financial advisor with many years 
      of experience in successfully helping startups with their financial projections 
      and strategic decisions. Your purpose is to help users create a cohesive set of 
      structured strategic documents and ensure these documents are always in sync.
      
      When analyzing documents, check for:
      1. Inconsistencies between strategic goals, OKRs, and financial projections
      2. Unrealistic expectations in targets or timelines
      3. Strategic incoherence or misalignment
      4. Potential improvements based on systems thinking principles
      5. Execution strategies and potential system traps
      
      Your responses should be insightful, focused on strategic alignment, and include 
      specific, actionable recommendations.
    `;
  
    constructor(apiKey: string) {
      this.apiKey = apiKey;
    }
  
    async getCompletion(
      prompt: string, 
      conversationHistory: ClaudeMessage[] = [],
      options: {
        model?: string,
        maxTokens?: number,
        temperature?: number
      } = {}
    ): Promise<string> {
      try {
        // Prepare conversation history with the new prompt
        const messages: ClaudeMessage[] = [
          ...conversationHistory,
          { role: 'user', content: prompt }
        ];
  
        // Prepare the request payload
        const request: ClaudeCompletionRequest = {
          model: options.model || this.defaultModel,
          messages: messages,
          max_tokens: options.maxTokens || 4000,
          temperature: options.temperature || 0.7,
          system: this.systemPrompt
        };
  
        // Make the API request
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify(request)
        });
  
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Claude API error (${response.status}): ${errorText}`);
        }
  
        const data: ClaudeCompletionResponse = await response.json();
        
        // Extract the text content from the response
        const textContent = data.content
          .filter(item => item.type === 'text')
          .map(item => item.text)
          .join('');
  
        return textContent;
      } catch (error) {
        console.error('Error calling Claude API:', error);
        throw error;
      }
    }
  
    // Method to specifically analyze strategy documents for inconsistencies
    async analyzeStrategyDocuments(
      strategyContent: string,
      okrContent: string,
      financialContent: string,
      canvasContent: string
    ): Promise<string> {
      const prompt = `
        Please analyze these strategy documents for inconsistencies, improvement opportunities, 
        and potential system traps:
  
        ## STRATEGY DOCUMENT
        ${strategyContent}
  
        ## OKRs
        ${okrContent}
  
        ## FINANCIAL PROJECTION
        ${financialContent}
  
        ## STRATEGY CANVAS
        ${canvasContent}
  
        Identify:
        1. Any inconsistencies between the documents
        2. Unrealistic expectations or targets
        3. Strategic incoherence or misalignment
        4. Potential improvements based on systems thinking
        5. Potential system traps (drift to low performance, success to the successful, etc.)
        
        Provide specific, actionable recommendations to improve strategic coherence.
      `;
  
      return this.getCompletion(prompt, [], { temperature: 0.3 });
    }
  
    // Method to generate suggestions for implementing changes
    async generateImplementationSuggestion(
      documentType: string,
      suggestionText: string,
      actionRequired: string
    ): Promise<string> {
      const prompt = `
        INSTRUCTION: Please implement the following change to maintain strategic coherence across documents.
  
        DOCUMENT TO MODIFY: ${documentType}
        ACTION REQUIRED: ${actionRequired}
        CONTEXT: This change is needed to ${suggestionText.toLowerCase()}
  
        Please provide detailed implementation guidance that maintains alignment with all other strategic documents.
        Include specific content changes that should be made.
      `;
  
      return this.getCompletion(prompt, [], { temperature: 0.2 });
    }
  }