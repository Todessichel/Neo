// useAIAssistant.ts
import { useState, useEffect } from 'react';
import { DocumentContent } from './useDocuments';

interface ClaudeResponse {
  id: number;
  response: string;
}

export interface SuggestionType {
  id: string;
  text: string;
  implementationDetails: {
    section: string;
    action: string;
  };
}

export interface AIAssistantState {
  chatInput: string;
  claudeResponses: ClaudeResponse[];
  claudePrompt: string | null;
  promptStage: 'idle' | 'pending' | 'completed';
  implementedSuggestions: string[];
  improvementSuggestions: Record<string, SuggestionType[]>;
  inconsistencies: Record<string, SuggestionType[]>;
}

export interface AIAssistantActions {
  setChatInput: (input: string) => void;
  handleSubmit: (e: React.FormEvent) => void;
  implementSuggestion: (suggestion: SuggestionType) => void;
  addClaudeResponse: (response: string) => void;
}

export const useAIAssistant = (
  activeDocument: string,
  documentContent: DocumentContent,
  setDocumentContent: (updater: (prev: DocumentContent) => DocumentContent) => void,
  setInconsistencyCount: (updater: (prev: Record<string, number>) => Record<string, number>) => void,
  saveDocumentChanges: (documentType: string, htmlContent: string, rawContent: any) => Promise<void>,
  recordImplementedSuggestion: (suggestionId: string, documentType: string) => Promise<void>,
  user: any,
  setSuccessMessage: (message: string | null) => void,
  hasDocuments: boolean
): [AIAssistantState, AIAssistantActions] => {
  const [chatInput, setChatInput] = useState<string>('');
  const [claudeResponses, setClaudeResponses] = useState<ClaudeResponse[]>([]);
  const [claudePrompt, setClaudePrompt] = useState<string | null>(null);
  const [promptStage, setPromptStage] = useState<'idle' | 'pending' | 'completed'>('idle');
  const [implementedSuggestions, setImplementedSuggestions] = useState<string[]>([]);
  
  // Initialize with default welcome message
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    setClaudeResponses([{
      id: 1,
      response: "I've analyzed your strategy document and financial projections. There are several areas where the OKRs could be better aligned with your financial goals. Would you like me to suggest specific improvements?"
    }]);
  }, []);
  
  // Check for empty documents and show guided strategy option
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (!hasDocuments && claudeResponses.length <= 1) {
      // Only show this once when the app first loads with no documents
      const initialResponse = {
        id: claudeResponses.length + 1,
        response: "I notice you don't have any strategy documents yet. Would you like me to guide you through creating a complete strategy? I can help you develop a business model, strategic direction, OKRs, and financial projections."
      };
      
      setClaudeResponses([...claudeResponses, initialResponse]);
    }
  }, [hasDocuments, claudeResponses]);
  
  // Content for improvement suggestions based on active document
  const improvementSuggestions: Record<string, SuggestionType[]> = {
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
  };
  
  // Inconsistencies based on active document
  const inconsistencies: Record<string, SuggestionType[]> = {
    Strategy: [
      {
        id: 'inconsistency-strategy-1',
        text: 'Strategy mentions 90% customer satisfaction target, but no corresponding KR exists in OKRs',
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
        implementationDetails: {
          section: 'Canvas',
          action: 'Add channels section to Canvas'
        }
      }
    ]
  };
  
  // Add a new Claude response
  const addClaudeResponse = (response: string) => {
    const newResponse = {
      id: claudeResponses.length + 1,
      response
    };
    
    setClaudeResponses(prev => [...prev, newResponse]);
  };
  
  // Handle chat submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() === '' || typeof window === 'undefined') return;
    
    // Regular chat handling
    const newResponse = {
      id: claudeResponses.length + 1,
      response: `I'm analyzing your input regarding ${activeDocument.toLowerCase()}. Based on systems thinking principles, I can see potential reinforcing loops between your strategy and financial projections that need attention. Would you like me to elaborate on specific adjustments?`
    };
    
    setClaudeResponses([...claudeResponses, newResponse]);
    setChatInput('');
  };
  
  // Function to implement suggested changes
  const implementSuggestion = (suggestion: SuggestionType) => {
    if (typeof window === 'undefined') return;
    
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
    
    // Simulate sending to Claude and receiving response
    setTimeout(() => {
      // Update document content based on the suggestion
      setDocumentContent(prevContent => {
        const updatedContent = { ...prevContent };
        
        if (section === 'Strategy' && action === 'Add a "Key Strategic Priorities" section with customer acquisition channels') {
          updatedContent.Strategy = (
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
          );
          
          // Update inconsistency count
          setInconsistencyCount(prevCount => ({
            ...prevCount,
            'Strategy': 0
          }));
          
          // Save changes to database if logged in
          if (user) {
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
            
            saveDocumentChanges('Strategy', htmlContent, rawContent);
            recordImplementedSuggestion(suggestion.id, 'Strategy');
          }
        }
        else if (section === 'OKRs' && action === 'Add customer satisfaction KR') {
          updatedContent.OKRs = (
            <div className="p-4">
              <h2 className="text-xl font-bold mb-4">OKRs - NEO</h2>
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Objective 1: Achieve €100K in Total First-Year Revenue</h3>
                <p className="italic mb-2">Rationale: Secure short-term financial viability, build investor confidence, and lay the foundation for scaling.</p>
                <ul className="list-disc pl-5">
                  <li>KR1: Generate a minimum of €8,300 in Monthly Recurring Revenue (MRR) by Month 12.</li>
                  <li>KR2: Close at least 8 high-ticket pilot engagements or consulting deals (≥ €5,000 each) within Year 1.</li>
                  <li>KR3: Convert at least 40% of new signups to Pro (€99/mo) or Enterprise (€299/mo) tiers on an annual plan.</li>
                </ul>
              </div>
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Objective 2: Grow Subscription Base & Reduce Churn</h3>
                <p className="italic mb-2">Rationale: Establish strong, recurring subscription income and foster stable user retention, particularly for high-value tiers.</p>
                <ul className="list-disc pl-5">
                  <li>KR1: Reach 300 total paying subscribers by end of Year 1 (across all tiers).</li>
                  <li>KR2: Maintain a monthly churn rate below 5% after the first 3 months of launch.</li>
                  <li>KR3: Attain ≥ 40% of subscribers on Pro or Enterprise plans within 6 months.</li>
                </ul>
              </div>
              
              <div className="mb-4 bg-green-50 p-2">
                <h3 className="text-lg font-semibold mb-2 bg-green-100 p-1">Objective 3: Deliver Exceptional Customer Satisfaction</h3>
                <p className="italic mb-2">Rationale: Ensure high retention and word-of-mouth growth through superior user experience.</p>
                <ul className="list-disc pl-5">
                  <li className="bg-green-100">KR1: Achieve Customer Satisfaction Score ≥ 90% by Month 12 (aligned with Strategy Document)</li>
                  <li className="bg-green-100">KR2: Attain a Net Promoter Score (NPS) ≥ 50 by Year 1</li>
                  <li className="bg-green-100">KR3: Log at least 10 verified ROI case studies from Pro/Enterprise clients</li>
                </ul>
              </div>
            </div>
          );
          
          // Update inconsistency count
          setInconsistencyCount(prevCount => ({
            ...prevCount,
            'OKRs': prevCount['OKRs'] - 1
          }));
          
          // Save changes to database if logged in
          if (user) {
            const htmlContent = `
              <h2 class="text-xl font-bold mb-4">OKRs - NEO</h2>
              
              <div class="mb-4">
                <h3 class="text-lg font-semibold mb-2">Objective 1: Achieve €100K in Total First-Year Revenue</h3>
                <p class="italic mb-2">Rationale: Secure short-term financial viability, build investor confidence, and lay the foundation for scaling.</p>
                <ul class="list-disc pl-5">
                  <li>KR1: Generate a minimum of €8,300 in Monthly Recurring Revenue (MRR) by Month 12.</li>
                  <li>KR2: Close at least 8 high-ticket pilot engagements or consulting deals (≥ €5,000 each) within Year 1.</li>
                  <li>KR3: Convert at least 40% of new signups to Pro (€99/mo) or Enterprise (€299/mo) tiers on an annual plan.</li>
                </ul>
              </div>
              
              <div class="mb-4">
                <h3 class="text-lg font-semibold mb-2">Objective 2: Grow Subscription Base & Reduce Churn</h3>
                <p class="italic mb-2">Rationale: Establish strong, recurring subscription income and foster stable user retention, particularly for high-value tiers.</p>
                <ul class="list-disc pl-5">
                  <li>KR1: Reach 300 total paying subscribers by end of Year 1 (across all tiers).</li>
                  <li>KR2: Maintain a monthly churn rate below 5% after the first 3 months of launch.</li>
                  <li>KR3: Attain ≥ 40% of subscribers on Pro or Enterprise plans within 6 months.</li>
                </ul>
              </div>
              
              <div class="mb-4">
                <h3 class="text-lg font-semibold mb-2">Objective 3: Deliver Exceptional Customer Satisfaction</h3>
                <p class="italic mb-2">Rationale: Ensure high retention and word-of-mouth growth through superior user experience.</p>
                <ul class="list-disc pl-5">
                  <li>KR1: Achieve Customer Satisfaction Score ≥ 90% by Month 12 (aligned with Strategy Document)</li>
                  <li>KR2: Attain a Net Promoter Score (NPS) ≥ 50 by Year 1</li>
                  <li>KR3: Log at least 10 verified ROI case studies from Pro/Enterprise clients</li>
                </ul>
              </div>
            `;
            
            const rawContent = {
              objectives: [
                {
                  title: "Achieve €100K in Total First-Year Revenue",
                  rationale: "Secure short-term financial viability, build investor confidence, and lay the foundation for scaling.",
                  keyResults: [
                    "Generate a minimum of €8,300 in Monthly Recurring Revenue (MRR) by Month 12.",
                    "Close at least 8 high-ticket pilot engagements or consulting deals (≥ €5,000 each) within Year 1.",
                    "Convert at least 40% of new signups to Pro (€99/mo) or Enterprise (€299/mo) tiers on an annual plan."
                  ]
                },
                {
                  title: "Grow Subscription Base & Reduce Churn",
                  rationale: "Establish strong, recurring subscription income and foster stable user retention, particularly for high-value tiers.",
                  keyResults: [
                    "Reach 300 total paying subscribers by end of Year 1 (across all tiers).",
                    "Maintain a monthly churn rate below 5% after the first 3 months of launch.",
                    "Attain ≥ 40% of subscribers on Pro or Enterprise plans within 6 months."
                  ]
                },
                {
                  title: "Deliver Exceptional Customer Satisfaction",
                  rationale: "Ensure high retention and word-of-mouth growth through superior user experience.",
                  keyResults: [
                    "Achieve Customer Satisfaction Score ≥ 90% by Month 12 (aligned with Strategy Document)",
                    "Attain a Net Promoter Score (NPS) ≥ 50 by Year 1",
                    "Log at least 10 verified ROI case studies from Pro/Enterprise clients"
                  ]
                }
              ]
            };
            
            saveDocumentChanges('OKRs', htmlContent, rawContent);
            recordImplementedSuggestion(suggestion.id, 'OKRs');
          }
        }
        else if (section === 'Financial Projection' && action === 'Add sensitivity analysis section') {
          updatedContent['Financial Projection'] = (
            <div className="p-4">
              <h2 className="text-xl font-bold mb-4">Financial Projection - NEO</h2>
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Revenue Streams</h3>
                <table className="min-w-full border">
                  <thead>
                    <tr>
                      <th className="border p-2">Subscription Tier</th>
                      <th className="border p-2">Price</th>
                      <th className="border p-2">Year 1 Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2">Basic</td>
                      <td className="border p-2">€49/mo</td>
                      <td className="border p-2">180 subscribers</td>
                    </tr>
                    <tr>
                      <td className="border p-2">Pro</td>
                      <td className="border p-2">€99/mo</td>
                      <td className="border p-2">90 subscribers</td>
                    </tr>
                    <tr>
                      <td className="border p-2">Enterprise</td>
                      <td className="border p-2">€299/mo</td>
                      <td className="border p-2">30 subscribers</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Pilot Engagements</h3>
                <p>8-10 pilot deals at €5-10k each = €60-80k additional revenue</p>
              </div>
              
              <div className="mb-4 bg-green-50 p-2">
                <h3 className="text-lg font-semibold mb-2 bg-green-100 p-1">Sensitivity Analysis</h3>
                <p className="mb-2">Impact of different churn rates on Year 1 MRR:</p>
                <table className="min-w-full border">
                  <thead>
                    <tr>
                      <th className="border p-2">Scenario</th>
                      <th className="border p-2">Monthly Churn</th>
                      <th className="border p-2">Year-End MRR</th>
                      <th className="border p-2">% of Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2">Best Case</td>
                      <td className="border p-2">2%</td>
                      <td className="border p-2">€9,100</td>
                      <td className="border p-2">110%</td>
                    </tr>
                    <tr>
                      <td className="border p-2">Expected</td>
                      <td className="border p-2">4%</td>
                      <td className="border p-2">€8,300</td>
                      <td className="border p-2">100%</td>
                    </tr>
                    <tr>
                      <td className="border p-2">Worst Case</td>
                      <td className="border p-2">7%</td>
                      <td className="border p-2">€6,900</td>
                      <td className="border p-2">83%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
          
          // Save changes to database if logged in
          if (user) {
            const htmlContent = `
              <h2 class="text-xl font-bold mb-4">Financial Projection - NEO</h2>
              <div class="mb-4">
                <h3 class="text-lg font-semibold mb-2">Revenue Streams</h3>
                <table class="min-w-full border">
                  <thead>
                    <tr>
                      <th class="border p-2">Subscription Tier</th>
                      <th class="border p-2">Price</th>
                      <th class="border p-2">Year 1 Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="border p-2">Basic</td>
                      <td class="border p-2">€49/mo</td>
                      <td class="border p-2">180 subscribers</td>
                    </tr>
                    <tr>
                      <td class="border p-2">Pro</td>
                      <td class="border p-2">€99/mo</td>
                      <td class="border p-2">90 subscribers</td>
                    </tr>
                    <tr>
                      <td class="border p-2">Enterprise</td>
                      <td class="border p-2">€299/mo</td>
                      <td class="border p-2">30 subscribers</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="mb-4">
                <h3 class="text-lg font-semibold mb-2">Pilot Engagements</h3>
                <p>8-10 pilot deals at €5-10k each = €60-80k additional revenue</p>
              </div>
              
              <div class="mb-4">
                <h3 class="text-lg font-semibold mb-2">Sensitivity Analysis</h3>
                <p class="mb-2">Impact of different churn rates on Year 1 MRR:</p>
                <table class="min-w-full border">
                  <thead>
                    <tr>
                      <th class="border p-2">Scenario</th>
                      <th class="border p-2">Monthly Churn</th>
                      <th class="border p-2">Year-End MRR</th>
                      <th class="border p-2">% of Target</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="border p-2">Best Case</td>
                      <td class="border p-2">2%</td>
                      <td class="border p-2">€9,100</td>
                      <td class="border p-2">110%</td>
                    </tr>
                    <tr>
                      <td class="border p-2">Expected</td>
                      <td class="border p-2">4%</td>
                      <td class="border p-2">€8,300</td>
                      <td class="border p-2">100%</td>
                    </tr>
                    <tr>
                      <td class="border p-2">Worst Case</td>
                      <td class="border p-2">7%</td>
                      <td class="border p-2">€6,900</td>
                      <td class="border p-2">83%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            `;
            
            const rawContent = {
              revenue: {
                subscriptions: [
                  { tier: "Basic", price: 49, target: 180 },
                  { tier: "Pro", price: 99, target: 90 },
                  { tier: "Enterprise", price: 299, target: 30 }
                ],
                pilots: {
                  count: "8-10",
                  price: "€5-10k",
                  total: "€60-80k"
                }
              },
              sensitivityAnalysis: {
                churnScenarios: [
                  { scenario: "Best Case", churn: 0.02, mmr: 9100, percentOfTarget: 1.1 },
                  { scenario: "Expected", churn: 0.04, mmr: 8300, percentOfTarget: 1.0 },
                  { scenario: "Worst Case", churn: 0.07, mmr: 6900, percentOfTarget: 0.83 }
                ]
              }
            };
            
            saveDocumentChanges('Financial Projection', htmlContent, rawContent);
            recordImplementedSuggestion(suggestion.id, 'Financial Projection');
          }
        }
        
        return updatedContent;
      });
      
      // Add Claude's response
      const newResponse = {
        id: claudeResponses.length + 1,
        response: `I've implemented the suggested change to ${section}: ${action}. This maintains strategic coherence by ensuring alignment between your documents. The changes have been highlighted in green in the document.`
      };
      
      setClaudeResponses([...claudeResponses, newResponse]);
      
      // Add to implemented suggestions
      setImplementedSuggestions(prev => [...prev, suggestion.id]);
      
      // Show success message
      setSuccessMessage(`Successfully implemented: ${suggestion.text}`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Reset prompt stage
      setPromptStage('completed');
      setTimeout(() => setPromptStage('idle'), 2000);
    }, 1500);
  };
  
  return [
    {
      chatInput,
      claudeResponses,
      claudePrompt,
      promptStage,
      implementedSuggestions,
      improvementSuggestions,
      inconsistencies
    },
    {
      setChatInput,
      handleSubmit,
      implementSuggestion,
      addClaudeResponse
    }
  ];
};