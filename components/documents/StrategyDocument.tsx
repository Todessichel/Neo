import React from 'react';

interface StrategyDocumentProps {
  content: React.ReactNode;
}

const StrategyDocument: React.FC<StrategyDocumentProps> = ({ content }) => {
  // Default content if none is provided
  const defaultContent = (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Strategy Document - NEO</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Strategic Narrative</h3>
        <p className="mb-4">
          NEO is our next-generation AI tool engineered to revolutionize the way businesses develop and execute strategy. 
          By harnessing advanced machine learning and systems analysis, NEO delivers real-time, actionable insights that 
          empower users to align strategic planning with financial performance.
        </p>
        
        <h4 className="font-medium mb-2">Where We Are Now</h4>
        <ul className="list-disc pl-5 mb-3">
          <li>Many startups create one-off strategic documents that quickly become outdated</li>
          <li>Tools exist for strategy, financial projections, and OKRs but rarely stay in sync</li>
        </ul>
        
        <h4 className="font-medium mb-2">Where We Want to Go</h4>
        <ul className="list-disc pl-5 mb-3">
          <li>NEO becomes the go-to platform for continuous strategic alignment</li>
          <li>We cater to VC-backed startups and VC firms, ensuring all pillars remain linked</li>
        </ul>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Vision & Mission</h3>
        
        <h4 className="font-medium mb-2">Vision</h4>
        <p className="mb-3">
          To become the industry-standard AI tool that redefines strategic planning by seamlessly integrating systems thinking, 
          strategy formulation, financial projection and operational metrics.
        </p>
        
        <h4 className="font-medium mb-2">Mission</h4>
        <p className="mb-3">
          We enable startups and VCs to adapt swiftly and align their strategic decisions, action plans, and financial 
          projections in real time.
        </p>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Business Goals</h3>
        <ul className="list-disc pl-5 mb-4">
          <li>Profit Every Year: Reach operational profitability for NEO within 2 years</li>
          <li>Continuous growth in profit margins and net profit</li>
          <li>Demonstrate a 50% reduction in planning cycle times for users</li>
          <li>Attain a customer satisfaction rating of over 90% within the first 18 months</li>
        </ul>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Guiding Policy</h3>
        <h4 className="font-medium mb-2">Strategic Principles</h4>
        <ul className="list-disc pl-5 mb-3">
          <li>Focus on Integration: Always align strategy with financial and operational realities</li>
          <li>Embrace Systems Thinking: Use holistic analysis to anticipate market dynamics</li>
          <li>Prioritize Customer Success: Design solutions for long-term retention and ROI</li>
        </ul>
        
        <h4 className="font-medium mb-2">Trade-offs</h4>
        <div className="pl-5 mb-3">
          <p className="mb-1 font-medium">Will Do:</p>
          <ul className="list-disc pl-5 mb-2">
            <li>Focus on hands-on implementation support</li>
            <li>Create measurable client outcomes</li>
          </ul>
          
          <p className="mb-1 font-medium">Won't Do:</p>
          <ul className="list-disc pl-5">
            <li>Pure theoretical strategy</li>
            <li>One-off consulting calls</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return content || defaultContent;
};

export default StrategyDocument;