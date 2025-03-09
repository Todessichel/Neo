import React from 'react';

interface CanvasDocumentProps {
  content: React.ReactNode;
}

const CanvasDocument: React.FC<CanvasDocumentProps> = ({ content }) => {
  // Default content if none is provided
  const defaultContent = (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Enhanced Strategy Canvas - NEO</h2>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Business Model (Value Creation & Economic Viability)</h3>
        
        <div className="mb-4">
          <h4 className="font-medium">Customer Segments</h4>
          <p className="text-gray-500 italic mb-2">Define who your customers are and what problems you solve for them</p>
          <ul className="list-disc pl-5">
            <li>Early‐ to Growth‐Stage Startups</li>
            <li>SMEs / Mittelstand</li>
            <li>Boutique Consultancies</li>
          </ul>
        </div>
        
        <div className="mb-4">
          <h4 className="font-medium">Value Proposition</h4>
          <p className="text-gray-500 italic mb-2">What unique value do you deliver? How do you solve customers' problems?</p>
          <ul className="list-disc pl-5">
            <li>Integrated AI for Strategy, Systems Thinking & Finance</li>
            <li>Minimal Effort, High Impact</li>
            <li>High‐Touch + Self‐Serve</li>
          </ul>
        </div>
        
        <div className="mb-4">
          <h4 className="font-medium">Revenue Model</h4>
          <p className="text-gray-500 italic mb-2">How do you monetize your value proposition?</p>
          <ul className="list-disc pl-5">
            <li>Subscription tiers (Basic, Pro, Enterprise)</li>
            <li>Strategy accelerator packages</li>
          </ul>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Strategy (Competitive Positioning & Strategic Choices)</h3>
        
        <div className="mb-4">
          <h4 className="font-medium">Where to Play</h4>
          <p className="text-gray-500 italic mb-2">Which markets, segments, and geographies will you focus on?</p>
          <p>Focus on Founders + Growth‐Stage Firms and SMEs seeking competitive modernization</p>
        </div>
        
        <div className="mb-4">
          <h4 className="font-medium">How to Win</h4>
          <p className="text-gray-500 italic mb-2">What will be your unique competitive advantage?</p>
          <ul className="list-disc pl-5">
            <li>Advanced AI specialized in strategic frameworks</li>
            <li>Ease + Depth: Straightforward interface with robust analytics</li>
          </ul>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Systems Thinking (Resilience & Adaptability)</h3>
        
        <div className="mb-4">
          <h4 className="font-medium">External Forces & Market Dynamics</h4>
          <p className="text-gray-500 italic mb-2">What external factors could impact your business?</p>
          <ul className="list-disc pl-5">
            <li>AI Regulation & Data Privacy</li>
            <li>Economic Climate</li>
            <li>Competitive Imitation</li>
          </ul>
        </div>
        
        <div className="mb-4">
          <h4 className="font-medium">Feedback Loops & Learning Mechanisms</h4>
          <p className="text-gray-500 italic mb-2">How will you adapt to changing conditions?</p>
          <ul className="list-disc pl-5">
            <li>User Feedback Cycle</li>
            <li>Pilot "Success Stories"</li>
            <li>Quarterly Strategy Review</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return content || defaultContent;
};

export default CanvasDocument;