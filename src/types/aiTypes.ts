export interface ClaudeResponse {
  id: number;
  response: string;
  timestamp?: Date;
  context?: string;
  confidence?: number;
  suggestions?: string[];
  implementationStatus?: 'pending' | 'implemented' | 'rejected';
}

export interface AIAnalysis {
  inconsistencies: Array<{
    type: string;
    description: string;
    severity: 'low' | 'medium' | 'high';
    suggestions: string[];
  }>;
  recommendations: string[];
  metrics: {
    alignmentScore?: number;
    completenessScore?: number;
    feasibilityScore?: number;
  };
} 