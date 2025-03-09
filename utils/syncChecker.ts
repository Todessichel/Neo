/**
 * Types for document synchronization
 * Purpose: Checks for inconsistencies between strategy documents
Features:

Identifies misalignments between different document types
Categorizes issues by severity (high, medium, low)
Provides actionable suggestions for resolving inconsistencies
Checks specific relationships (Strategy-OKRs, Canvas-OKRs, etc.)
Returns structured data for UI display and implementation
 */
export interface DocumentData {
    type: string;
    content: any;
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
  
  /**
   * Utility for checking synchronization between documents
   */
  export class SyncChecker {
    /**
     * Check for inconsistencies across all documents
     * @param documents Collection of documents to check
     * @returns Map of inconsistencies by document type
     */
    public static checkSynchronization(documents: Record<string, DocumentData>): Record<string, Inconsistency[]> {
      const result: Record<string, Inconsistency[]> = {
        'canvas': [],
        'strategy': [],
        'financial': [],
        'okrs': []
      };
      
      // Extract content for easier access
      const canvas = documents.canvas?.content;
      const strategy = documents.strategy?.content;
      const financial = documents.financial?.content;
      const okrs = documents.okrs?.content;
      
      // Check Strategy and OKRs alignment
      if (strategy && okrs) {
        this.checkStrategyOKRsAlignment(strategy, okrs, result);
      }
      
      // Check Canvas and OKRs alignment
      if (canvas && okrs) {
        this.checkCanvasOKRsAlignment(canvas, okrs, result);
      }
      
      // Check Financial and Strategy alignment
      if (financial && strategy) {
        this.checkFinancialStrategyAlignment(financial, strategy, result);
      }
      
      // Check OKRs and Financial alignment
      if (okrs && financial) {
        this.checkOKRsFinancialAlignment(okrs, financial, result);
      }
      
      return result;
    }
    
    /**
     * Check alignment between Strategy and OKRs
     */
    private static checkStrategyOKRsAlignment(
      strategy: any,
      okrs: any,
      result: Record<string, Inconsistency[]>
    ): void {
      // Check if strategy mentions customer satisfaction goal
      if (this.containsCustomerSatisfactionGoal(strategy) && !this.hasCustomerSatisfactionOKR(okrs)) {
        result.strategy.push({
          id: `inconsistency-strategy-okr-${Date.now()}`,
          text: 'Strategy mentions 90% customer satisfaction target, but no corresponding KR exists in OKRs',
          severity: 'high',
          implementationDetails: {
            section: 'OKRs',
            action: 'Add customer satisfaction KR to align with Strategy'
          }
        });
      }
      
      // Check if strategy has strategic priorities that aren't reflected in OKRs
      if (this.hasStrategicPriorities(strategy) && !this.hasAlignedOKRs(strategy, okrs)) {
        result.strategy.push({
          id: `inconsistency-strategy-priorities-${Date.now()}`,
          text: 'Strategy includes strategic priorities that are not reflected in OKR objectives',
          severity: 'medium',
          implementationDetails: {
            section: 'OKRs',
            action: 'Add objectives that align with all strategic priorities'
          }
        });
      }
    }
    
    /**
     * Check alignment between Canvas and OKRs
     */
    private static checkCanvasOKRsAlignment(
      canvas: any,
      okrs: any,
      result: Record<string, Inconsistency[]>
    ): void {
      // Check if OKRs target subscriber numbers but Canvas lacks acquisition details
      if (this.hasSubscriberTargetOKR(okrs) && !this.hasAcquisitionStrategies(canvas)) {
        result.okrs.push({
          id: `inconsistency-okr-canvas-${Date.now()}`,
          text: 'OKRs target 300 subscribers, but specific acquisition strategies are undefined in Canvas',
          severity: 'medium',
          implementationDetails: {
            section: 'Canvas',
            action: 'Add acquisition strategies to align with OKR targets'
          }
        });
        
        result.canvas.push({
          id: `inconsistency-canvas-okr-${Date.now()}`,
          text: 'Canvas lacks channel strategy but OKRs assume specific acquisition metrics',
          severity: 'medium',
          implementationDetails: {
            section: 'Canvas',
            action: 'Add channels section to Canvas'
          }
        });
      }
    }
    
    /**
     * Check alignment between Financial and Strategy
     */
    private static checkFinancialStrategyAlignment(
      financial: any,
      strategy: any,
      result: Record<string, Inconsistency[]>
    ): void {
      // Check if financial targets match strategy goals
      if (!this.areFinancialTargetsAlignedWithStrategy(financial, strategy)) {
        result.financial.push({
          id: `inconsistency-financial-strategy-${Date.now()}`,
          text: 'Financial projections do not align with revenue goals stated in Strategy',
          severity: 'high',
          implementationDetails: {
            section: 'Financial Projection',
            action: 'Adjust financial projections to match strategic goals'
          }
        });
      }
      
      // Check if MRR target seems realistic given subscription distribution
      if (!this.isMRRTargetRealistic(financial)) {
        result.financial.push({
          id: `inconsistency-financial-mrr-${Date.now()}`,
          text: 'Financial projection shows €8,300 MRR but may be unrealistic given the subscription tier distribution',
          severity: 'low',
          implementationDetails: {
            section: 'Financial Projection',
            action: 'Adjust MRR target or subscription distribution'
          }
        });
      }
    }
    
    /**
     * Check alignment between OKRs and Financial
     */
    private static checkOKRsFinancialAlignment(
      okrs: any,
      financial: any,
      result: Record<string, Inconsistency[]>
    ): void {
      // Check if OKR revenue targets match financial projections
      if (!this.areRevenueTargetsAligned(okrs, financial)) {
        result.okrs.push({
          id: `inconsistency-okr-financial-${Date.now()}`,
          text: 'OKR revenue targets do not match financial projections',
          severity: 'medium',
          implementationDetails: {
            section: 'OKRs',
            action: 'Align OKR revenue targets with financial projections'
          }
        });
      }
      
      // Check if OKR subscriber targets match financial model
      if (!this.areSubscriberTargetsAligned(okrs, financial)) {
        result.okrs.push({
          id: `inconsistency-okr-subscribers-${Date.now()}`,
          text: 'OKR subscriber targets do not match financial model assumptions',
          severity: 'medium',
          implementationDetails: {
            section: 'Financial Projection',
            action: 'Adjust subscriber projections to match OKR targets'
          }
        });
      }
    }
    
    /**
     * Helper methods for checking specific conditions
     * These would be more sophisticated in a real implementation
     */
    
    private static containsCustomerSatisfactionGoal(strategy: any): boolean {
      // Check if strategy content contains customer satisfaction goal
      if (typeof strategy === 'object' && strategy.raw && strategy.raw.businessGoals) {
        return strategy.raw.businessGoals.some((goal: string) => 
          goal.toLowerCase().includes('customer satisfaction') && 
          goal.includes('90%')
        );
      }
      
      if (typeof strategy === 'object' && strategy.html) {
        return strategy.html.includes('customer satisfaction') && 
               strategy.html.includes('90%');
      }
      
      return false;
    }
    
    private static hasCustomerSatisfactionOKR(okrs: any): boolean {
      // Check if OKRs contain customer satisfaction objective or KR
      if (typeof okrs === 'object' && okrs.raw && okrs.raw.objectives) {
        return okrs.raw.objectives.some((objective: any) => 
          (objective.title && objective.title.toLowerCase().includes('customer satisfaction')) ||
          (objective.keyResults && objective.keyResults.some((kr: string) => 
            kr.toLowerCase().includes('customer satisfaction') && 
            kr.includes('90%')
          ))
        );
      }
      
      if (typeof okrs === 'object' && okrs.html) {
        return okrs.html.includes('Customer Satisfaction') && 
               okrs.html.includes('90%');
      }
      
      return false;
    }
    
    private static hasStrategicPriorities(strategy: any): boolean {
      // Check if strategy has strategic priorities defined
      if (typeof strategy === 'object' && strategy.raw) {
        return !!strategy.raw.strategicPriorities;
      }
      
      if (typeof strategy === 'object' && strategy.html) {
        return strategy.html.includes('Strategic Priorities') || 
               strategy.html.includes('Key Priorities');
      }
      
      return false;
    }
    
    private static hasAlignedOKRs(strategy: any, okrs: any): boolean {
      // Check if OKRs align with strategic priorities
      // This is a simplified check, real implementation would be more sophisticated
      return true; // Simplified for this example
    }
    
    private static hasSubscriberTargetOKR(okrs: any): boolean {
      // Check if OKRs target specific subscriber numbers
      if (typeof okrs === 'object' && okrs.raw && okrs.raw.objectives) {
        return okrs.raw.objectives.some((objective: any) => 
          objective.keyResults && objective.keyResults.some((kr: string) => 
            kr.includes('subscriber') && kr.includes('300')
          )
        );
      }
      
      if (typeof okrs === 'object' && okrs.html) {
        return okrs.html.includes('subscriber') && 
               okrs.html.includes('300');
      }
      
      return false;
    }
    
    private static hasAcquisitionStrategies(canvas: any): boolean {
      // Check if canvas includes acquisition strategies
      if (typeof canvas === 'object' && canvas.raw) {
        return !!canvas.raw.customerAcquisition || !!canvas.raw.acquisition;
      }
      
      if (typeof canvas === 'object' && canvas.html) {
        return canvas.html.includes('acquisition') || 
               canvas.html.includes('customer channel');
      }
      
      return false;
    }
    
    private static areFinancialTargetsAlignedWithStrategy(financial: any, strategy: any): boolean {
      // Check if financial targets align with strategy goals
      // This is a simplified check
      return true; // Simplified for this example
    }
    
    private static isMRRTargetRealistic(financial: any): boolean {
      // Check if MRR target is realistic given subscription distribution
      // This would be more sophisticated in a real implementation
      if (typeof financial === 'object' && financial.raw && financial.raw.revenue) {
        if (financial.raw.revenue.mrr && financial.raw.revenue.mrr > 8000) {
          // Check if subscription distribution supports this MRR
          return true; // Simplified check
        }
      }
      
      return true; // Default to true for simplified example
    }
    
    private static areRevenueTargetsAligned(okrs: any, financial: any): boolean {
      // Check if OKR revenue targets match financial projections
      // This is a simplified check
      return true; // Simplified for this example
    }
    
    private static areSubscriberTargetsAligned(okrs: any, financial: any): boolean {
      // Check if OKR subscriber targets match financial model
      // This is a simplified check
      return true; // Simplified for this example
    }
  }