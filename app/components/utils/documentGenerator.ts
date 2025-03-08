/**
 * Types for document generation
 Purpose: Generates document content based on user inputs
Features:

Processes raw text inputs into structured data
Creates coherent set of strategy documents
Ensures alignment between generated documents
Produces both HTML display content and raw JSON data
Adapts content based on strategic approach and financial goals
 */
export interface GeneratedDocument {
    html: string;
    raw: any;
  }
  
  export interface DocumentSynopsis {
    canvas?: GeneratedDocument;
    strategy?: GeneratedDocument;
    financial?: GeneratedDocument;
    okrs?: GeneratedDocument;
  }
  
  export interface StrategyInputs {
    businessModel?: {
      customerSegments?: string[];
      valueProposition?: string[];
      revenueModel?: string[];
      costStructure?: string[];
    };
    strategicApproach?: 'conservative' | 'moderate' | 'aggressive';
    objectives?: string[];
    financialGoals?: {
      revenue?: { optimistic?: number; expected?: number; pessimistic?: number };
      profitMargin?: { optimistic?: number; expected?: number; pessimistic?: number };
      investmentCapacity?: number;
    };
  }
  
  /**
   * Utility for generating document content based on user inputs
   */
  export class DocumentGenerator {
    /**
     * Generate a complete set of strategy documents from guided strategy inputs
     * @param inputs Raw inputs from guided strategy process
     * @returns Complete set of documents
     */
    public static generateDocumentsFromInputs(inputs: Record<number, string>): DocumentSynopsis {
      // Process raw inputs into structured data
      const structuredInputs = this.processRawInputs(inputs);
      
      return {
        canvas: this.generateCanvas(structuredInputs),
        strategy: this.generateStrategy(structuredInputs),
        okrs: this.generateOKRs(structuredInputs),
        financial: this.generateFinancial(structuredInputs)
      };
    }
    
    /**
     * Process raw string inputs into structured data
     */
    private static processRawInputs(inputs: Record<number, string>): StrategyInputs {
      const result: StrategyInputs = {};
      
      // Process Step 1: Business Model
      if (inputs[1]) {
        const businessModelInput = inputs[1];
        
        // Extract customer segments
        const customerSegmentsMatch = businessModelInput.match(/(?:customers|segments|target).*?:?\s*(.*?)(?:\n|$)/i);
        
        // Extract value proposition
        const valuePropositionMatch = businessModelInput.match(/(?:value|proposition|solve).*?:?\s*(.*?)(?:\n|$)/i);
        
        result.businessModel = {
          customerSegments: customerSegmentsMatch 
            ? customerSegmentsMatch[1].split(/,|;/).map(s => s.trim()) 
            : ['Early-stage startups', 'SMEs'],
          valueProposition: valuePropositionMatch
            ? valuePropositionMatch[1].split(/,|;/).map(s => s.trim())
            : ['Integrated strategy platform', 'Time-saving automation']
        };
      }
      
      // Process Step 2: Strategic Approach
      if (inputs[2]) {
        const approachInput = inputs[2].toLowerCase();
        
        if (approachInput.includes('conservative')) {
          result.strategicApproach = 'conservative';
        } else if (approachInput.includes('aggressive')) {
          result.strategicApproach = 'aggressive';
        } else {
          result.strategicApproach = 'moderate';
        }
      }
      
      // Process Step 3: Objectives
      if (inputs[3]) {
        result.objectives = inputs[3]
          .split(/\n|\./)
          .filter(line => line.trim().length > 0)
          .map(line => line.trim());
      }
      
      // Process Step 4: Financial Goals
      if (inputs[4]) {
        const revenueMatch = inputs[4].match(/(?:revenue|sales).*?(?:€|\$)?(\d+)k?/i);
        const marginMatch = inputs[4].match(/(?:margin|profit).*?(\d+)%/i);
        const investmentMatch = inputs[4].match(/(?:invest|capital|fund).*?(?:€|\$)?(\d+)k?/i);
        
        result.financialGoals = {
          revenue: {
            expected: revenueMatch ? parseInt(revenueMatch[1]) * 1000 : 400000
          },
          profitMargin: {
            expected: marginMatch ? parseInt(marginMatch[1]) : 40
          },
          investmentCapacity: investmentMatch ? parseInt(investmentMatch[1]) * 1000 : 100000
        };
      }
      
      return result;
    }
    
    /**
     * Generate Enhanced Strategy Canvas
     */
    private static generateCanvas(inputs: StrategyInputs): GeneratedDocument {
      // Process inputs to generate Canvas
      const customerSegments = inputs.businessModel?.customerSegments || ['Early-stage startups', 'SMEs'];
      const valueProposition = inputs.businessModel?.valueProposition || ['Integrated platform', 'Time savings'];
      
      // Generate HTML content
      const html = `
        <h2 class="text-xl font-bold mb-4">Enhanced Strategy Canvas - NEO</h2>
        
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-2">Business Model (Value Creation & Economic Viability)</h3>
          
          <div class="mb-4">
            <h4 class="font-medium">Customer Segments</h4>
            <ul class="list-disc pl-5">
              ${customerSegments.map(segment => `<li>${segment}</li>`).join('\n')}
            </ul>
          </div>
          
          <div class="mb-4">
            <h4 class="font-medium">Value Proposition</h4>
            <ul class="list-disc pl-5">
              ${valueProposition.map(value => `<li>${value}</li>`).join('\n')}
            </ul>
          </div>
        </div>
        
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-2">Strategy (Competitive Positioning & Strategic Choices)</h3>
          
          <div class="mb-4">
            <h4 class="font-medium">Where to Play</h4>
            <p>Focus on ${customerSegments[0]} and ${customerSegments[1] || 'related markets'}</p>
          </div>
          
          <div class="mb-4">
            <h4 class="font-medium">How to Win</h4>
            <p>Differentiate through ${valueProposition[0]} with ${inputs.strategicApproach || 'moderate'} growth approach</p>
          </div>
        </div>
      `;
      
      // Generate raw JSON data
      const raw = {
        businessModel: {
          customerSegments,
          valueProposition
        },
        strategy: {
          whereToPlay: customerSegments,
          howToWin: valueProposition,
          approach: inputs.strategicApproach || 'moderate'
        }
      };
      
      return { html, raw };
    }
    
    /**
     * Generate Strategy Document
     */
    private static generateStrategy(inputs: StrategyInputs): GeneratedDocument {
      // Create vision and mission based on inputs
      const customerSegment = inputs.businessModel?.customerSegments?.[0] || 'startups';
      const valueProposition = inputs.businessModel?.valueProposition?.[0] || 'integrated strategy platform';
      
      const vision = `To become the standard integrated platform that empowers ${customerSegment} with sustainable, data-driven success through our ${valueProposition}.`;
      
      const mission = `We enable organizations to adapt swiftly and align their strategic decisions using a ${inputs.strategicApproach || 'balanced'} approach to growth and innovation.`;
      
      // Generate business goals based on inputs and approach
      const goals = [];
      
      // Add profitability goal based on approach
      if (inputs.strategicApproach === 'conservative') {
        goals.push('Achieve sustainable profitability within 1 year');
      } else if (inputs.strategicApproach === 'aggressive') {
        goals.push('Scale rapidly while reaching profitability within 3 years');
      } else {
        goals.push('Reach operational profitability within 2 years');
      }
      
      // Add revenue goal if specified
      if (inputs.financialGoals?.revenue?.expected) {
        goals.push(`Achieve €${inputs.financialGoals.revenue.expected / 1000}K in first-year revenue`);
      } else {
        goals.push('Continuous growth in profit margins and net profit');
      }
      
      // Add standard goals
      goals.push('Demonstrate 50% reduction in planning cycle times for users');
      goals.push('Attain customer satisfaction rating over 90% within 18 months');
      
      // Generate HTML content
      const html = `
        <h2 class="text-xl font-bold mb-4">Strategy Document - NEO</h2>
        
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-2">Vision</h3>
          <p class="mb-4">${vision}</p>
          
          <h3 class="text-lg font-semibold mb-2">Mission</h3>
          <p class="mb-4">${mission}</p>
          
          <h3 class="text-lg font-semibold mb-2">Business Goals</h3>
          <ul class="list-disc pl-5 mb-4">
            ${goals.map(goal => `<li>${goal}</li>`).join('\n')}
          </ul>
        </div>
        
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-2">Guiding Policy</h3>
          <h4 class="font-medium mb-2">Strategic Principles</h4>
          <ul class="list-disc pl-5 mb-3">
            <li>Focus on Integration: Always align strategy with financial and operational realities</li>
            <li>Embrace Systems Thinking: Use holistic analysis to anticipate market dynamics</li>
            <li>Prioritize Customer Success: Design solutions for long-term retention and ROI</li>
          </ul>
        </div>
      `;
      
      // Generate raw JSON data
      const raw = {
        vision,
        mission,
        businessGoals: goals,
        guidingPolicy: {
          principles: [
            'Focus on Integration: Always align strategy with financial and operational realities',
            'Embrace Systems Thinking: Use holistic analysis to anticipate market dynamics',
            'Prioritize Customer Success: Design solutions for long-term retention and ROI'
          ]
        }
      };
      
      return { html, raw };
    }
    
    /**
     * Generate OKRs
     */
    private static generateOKRs(inputs: StrategyInputs): GeneratedDocument {
      // Create objectives and key results based on inputs
      const objectives = [];
      
      // Revenue objective
      const revenueTarget = inputs.financialGoals?.revenue?.expected || 400000;
      objectives.push({
        title: `Achieve €${revenueTarget / 1000}K in Total First-Year Revenue`,
        rationale: 'Secure short-term financial viability, build investor confidence, and lay the foundation for scaling.',
        keyResults: [
          `Generate a minimum of €${Math.round(revenueTarget / 12 / 100) * 100} in Monthly Recurring Revenue (MRR) by Month 12.`,
          'Close at least 8 high-ticket pilot engagements or consulting deals (≥ €5,000 each) within Year 1.',
          'Convert at least 40% of new signups to Pro (€99/mo) or Enterprise (€299/mo) tiers on an annual plan.'
        ]
      });
      
      // Growth objective
      objectives.push({
        title: 'Grow Subscription Base & Reduce Churn',
        rationale: 'Establish strong, recurring subscription income and foster stable user retention, particularly for high-value tiers.',
        keyResults: [
          'Reach 300 total paying subscribers by end of Year 1 (across all tiers).',
          'Maintain a monthly churn rate below 5% after the first 3 months of launch.',
          'Attain ≥ 40% of subscribers on Pro or Enterprise plans within 6 months.'
        ]
      });
      
      // Customer satisfaction objective (always include to avoid inconsistencies)
      objectives.push({
        title: 'Deliver Exceptional Customer Satisfaction',
        rationale: 'Ensure high retention and word-of-mouth growth through superior user experience.',
        keyResults: [
          'Maintain a Customer Satisfaction Score ≥ 90% across all paying tiers (via quarterly surveys).',
          'Attain an NPS (Net Promoter Score) ≥ 50 by Year 1, indicating strong brand advocacy.',
          'Log at least 10 verified ROI case studies from Pro/Enterprise clients.'
        ]
      });
      
      // Generate HTML content
      const html = `
        <h2 class="text-xl font-bold mb-4">OKRs - NEO</h2>
        
        ${objectives.map(objective => `
          <div class="mb-6">
            <h3 class="text-lg font-semibold mb-2">Objective: ${objective.title}</h3>
            <p class="italic mb-2">Rationale: ${objective.rationale}</p>
            <ul class="list-disc pl-5">
              ${objective.keyResults.map(kr => `<li>${kr}</li>`).join('\n')}
            </ul>
          </div>
        `).join('\n')}
      `;
      
      // Generate raw JSON data
      const raw = {
        objectives
      };
      
      return { html, raw };
    }
    
    /**
     * Generate Financial Projection
     */
    private static generateFinancial(inputs: StrategyInputs): GeneratedDocument {
      // Create financial projections based on inputs
      const revenueTarget = inputs.financialGoals?.revenue?.expected || 400000;
      const marginTarget = inputs.financialGoals?.profitMargin?.expected || 40;
      
      // Calculate costs based on revenue and margin
      const totalCosts = revenueTarget * (1 - marginTarget / 100);
      
      // Calculate subscription tiers revenue breakdown
      // Assuming 60% Basic, 30% Pro, 10% Enterprise as a default split
      const basicCount = 180;
      const proCount = 90;
      const enterpriseCount = 30;
      
      const basicRevenue = basicCount * 49 * 12;
      const proRevenue = proCount * 99 * 12;
      const enterpriseRevenue = enterpriseCount * 299 * 12;
      const subscriptionRevenue = basicRevenue + proRevenue + enterpriseRevenue;
      
      // Pilot revenue makes up the difference
      const pilotRevenue = revenueTarget - subscriptionRevenue;
      
      // Generate HTML content
      const html = `
        <h2 class="text-xl font-bold mb-4">Financial Projection - NEO</h2>
        
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-3">Revenue Streams</h3>
          <table class="min-w-full border">
            <thead>
              <tr>
                <th class="border p-2">Subscription Tier</th>
                <th class="border p-2">Price</th>
                <th class="border p-2">Year 1 Target</th>
                <th class="border p-2">Year 1 Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border p-2">Basic</td>
                <td class="border p-2">€49/mo</td>
                <td class="border p-2">${basicCount} subscribers</td>
                <td class="border p-2">€${basicRevenue.toLocaleString()}</td>
              </tr>
              <tr>
                <td class="border p-2">Pro</td>
                <td class="border p-2">€99/mo</td>
                <td class="border p-2">${proCount} subscribers</td>
                <td class="border p-2">€${proRevenue.toLocaleString()}</td>
              </tr>
              <tr>
                <td class="border p-2">Enterprise</td>
                <td class="border p-2">€299/mo</td>
                <td class="border p-2">${enterpriseCount} subscribers</td>
                <td class="border p-2">€${enterpriseRevenue.toLocaleString()}</td>
              </tr>
              <tr class="bg-gray-100">
                <td class="border p-2 font-medium">Total Subscription</td>
                <td class="border p-2"></td>
                <td class="border p-2">300 subscribers</td>
                <td class="border p-2 font-medium">€${subscriptionRevenue.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-3">Pilot Engagements</h3>
          <table class="min-w-full border">
            <thead>
              <tr>
                <th class="border p-2">Engagement Type</th>
                <th class="border p-2">Price Range</th>
                <th class="border p-2">Year 1 Target</th>
                <th class="border p-2">Year 1 Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border p-2">Strategy Accelerator</td>
                <td class="border p-2">€5,000 - €10,000</td>
                <td class="border p-2">8-10 deals</td>
                <td class="border p-2">€${pilotRevenue.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-3">Cost Structure</h3>
          <table class="min-w-full border">
            <thead>
              <tr>
                <th class="border p-2">Cost Category</th>
                <th class="border p-2">Annual</th>
                <th class="border p-2">% of Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border p-2">Development</td>
                <td class="border p-2">€${Math.round(totalCosts * 0.6).toLocaleString()}</td>
                <td class="border p-2">${Math.round(60 * (1 - marginTarget / 100))}%</td>
              </tr>
              <tr>
                <td class="border p-2">Marketing</td>
                <td class="border p-2">€${Math.round(totalCosts * 0.25).toLocaleString()}</td>
                <td class="border p-2">${Math.round(25 * (1 - marginTarget / 100))}%</td>
              </tr>
              <tr>
                <td class="border p-2">Operations</td>
                <td class="border p-2">€${Math.round(totalCosts * 0.15).toLocaleString()}</td>
                <td class="border p-2">${Math.round(15 * (1 - marginTarget / 100))}%</td>
              </tr>
              <tr class="bg-gray-100">
                <td class="border p-2 font-medium">Total Costs</td>
                <td class="border p-2 font-medium">€${Math.round(totalCosts).toLocaleString()}</td>
                <td class="border p-2 font-medium">${100 - marginTarget}%</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-3">Projected Profitability</h3>
          <table class="min-w-full border">
            <thead>
              <tr>
                <th class="border p-2">Category</th>
                <th class="border p-2">Year 1</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="border p-2">Total Revenue</td>
                <td class="border p-2">€${revenueTarget.toLocaleString()}</td>
              </tr>
              <tr>
                <td class="border p-2">Total Costs</td>
                <td class="border p-2">€${Math.round(totalCosts).toLocaleString()}</td>
              </tr>
              <tr class="bg-gray-100">
                <td class="border p-2 font-medium">Net Profit</td>
                <td class="border p-2 font-medium">€${Math.round(revenueTarget * marginTarget / 100).toLocaleString()}</td>
              </tr>
              <tr>
                <td class="border p-2">Profit Margin</td>
                <td class="border p-2">${marginTarget}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      `;
      
      // Generate raw JSON data
      const raw = {
        revenue: {
          subscriptions: [
            { tier: 'Basic', price: 49, subscribers: basicCount, revenue: basicRevenue },
            { tier: 'Pro', price: 99, subscribers: proCount, revenue: proRevenue },
            { tier: 'Enterprise', price: 299, subscribers: enterpriseCount, revenue: enterpriseRevenue }
          ],
          totalSubscription: subscriptionRevenue,
          pilots: {
            count: '8-10',
            priceRange: '€5,000 - €10,000',
            revenue: pilotRevenue
          },
          total: revenueTarget
        },
        costs: {
          development: Math.round(totalCosts * 0.6),
          marketing: Math.round(totalCosts * 0.25),
          operations: Math.round(totalCosts * 0.15),
          total: Math.round(totalCosts)
        },
        profitability: {
          totalRevenue: revenueTarget,
          totalCosts: Math.round(totalCosts),
          netProfit: Math.round(revenueTarget * marginTarget / 100),
          profitMargin: marginTarget
        }
      };
      
      return { html, raw };
    }
  }