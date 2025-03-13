'use client'
import React, { useState, useEffect, useCallback } from 'react';
import LoginModal from './components/modals/LoginModal';
import SettingsModal from './components/modals/SettingsModal';
import FileManagerModal from './components/modals/FileManagerModal';
import IntegrationModal from './components/modals/IntegrationModal';
import { DatabaseService } from './services/DatabaseService';
import type { User } from './types/userTypes';
import type { Project } from './types/projectTypes';
import { FileSetupModal } from './components/modals/FileSetupModal';
import { FileLocation } from './types/fileTypes';
import { FileService } from './services/FileService';
import { FileSystemService, FileData } from './services/FileSystemService';
import { marked } from 'marked';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';


// Note: In a real app, you'd need to install these packages
// npm install papaparse xlsx mammoth
// npm install --save-dev @types/papaparse @types/react @types/node

type DocumentType = 'Canvas' | 'Strategy' | 'Financial Projection' | 'OKRs';

type SystemicIssue = {
  id: string;
  type: 'trap' | 'opportunity' | 'feedback_loop' | 'delay' | 'hierarchy' | 'resilience';
  title: string;
  description: string;
  systemsPerspective: string;
  suggestedAction: {
    document: DocumentType;
    action: string;
    explanation: string;
  };
};

type ClaudeResponse = {
  id: number;
  response: string;
  suggestion?: {
    id: string;
    text: string;
    implementationDetails: {
      section: string;
      action: string;
    };
  };
};

function hasSuggestion(response: ClaudeResponse): response is ClaudeResponse & { suggestion: NonNullable<ClaudeResponse['suggestion']> } {
  return response.suggestion !== undefined;
}

// Move inconsistencies before state initialization
const useInconsistencies = () => {
  return React.useMemo(() => ({
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
  }), []);
};

interface DocumentData {
  content?: {
    html?: string;
    raw?: any;
  };
  inconsistencies?: Array<{
    id: string;
    type: string;
    description: string;
  }>;
}

interface DocumentContent {
  html: string;
  raw: any;
}

// Add type definition for inconsistency
interface Inconsistency {
  id: string;
  text: string;
  implementationDetails: {
    section: string;
    action: string;
  };
}

const NEOStrategyPlatform = (): JSX.Element => {
  // Client-side rendering check
  const [isClient, setIsClient] = useState(false);
  
  // Get inconsistencies
  const inconsistencies = useInconsistencies();
  
  // Initialize inconsistency count based on actual inconsistencies
  const [inconsistencyCount, setInconsistencyCount] = useState<Record<DocumentType, number>>({
    'Canvas': 0,
    'Strategy': 0,
    'Financial Projection': 0,
    'OKRs': 0
  });
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // Project state
  const [projectId, setProjectId] = useState('default-project');
  const [projectList, setProjectList] = useState<Project[]>([]);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  
  // Document states
  const [activeDocument, setActiveDocument] = useState<DocumentType>('Strategy');
  const [chatInput, setChatInput] = useState('');
  const [claudeResponses, setClaudeResponses] = useState<ClaudeResponse[]>([]);
  const [implementedSuggestions, setImplementedSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [claudePrompt, setClaudePrompt] = useState<string | null>(null);
  const [promptStage, setPromptStage] = useState('idle'); // idle, pending, completed
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [activeTab, setActiveTab] = useState('import');
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasDocuments, setHasDocuments] = useState(false);
  
  // Guided strategy state
  const [guidedStrategyState, setGuidedStrategyState] = useState({
    active: false,
    step: 0,
    inputs: {} as Record<number, string>
  });
  
  // Add storage states
  const [storageDirectory, setStorageDirectory] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFileManagerModal, setShowFileManagerModal] = useState(false);
  const [modalRefreshKey, setModalRefreshKey] = useState(0); // Add refresh key for modals
  
  // Add state for document assignments
  const [documentAssignments, setDocumentAssignments] = useState<Record<DocumentType, string>>({
    'Canvas': '',
    'Strategy': '',
    'Financial Projection': '',
    'OKRs': ''
  });
  
  // Add new state for handling warning suggestions
  const [selectedWarning, setSelectedWarning] = useState<{
    docType: DocumentType;
    inconsistency: Inconsistency;
  } | null>(null);
  
  // Initialize client-side state
  useEffect(() => {
    setIsClient(true);
    
    // Load document assignments from localStorage
    const savedAssignments = localStorage.getItem('neoDocumentAssignments');
    if (savedAssignments) {
      const parsedAssignments = JSON.parse(savedAssignments) as Record<DocumentType, string>;
      setDocumentAssignments(parsedAssignments);
      setHasDocuments(Object.values(parsedAssignments).some(path => path !== ''));
    }
    
    // Initialize guided strategy state
    const savedGuidedState = localStorage.getItem('neoGuidedStrategy');
    if (savedGuidedState) {
      setGuidedStrategyState(JSON.parse(savedGuidedState));
    }
    
    // Initialize Claude responses
    const savedResponses = localStorage.getItem('neoClaudeResponses');
    if (savedResponses) {
      setClaudeResponses(JSON.parse(savedResponses));
    }
  }, []);
  
  // Debug function to log the state of the file system
  const logFileSystemState = () => {
    if (!isClient) return;
    
    const fileSystem = JSON.parse(localStorage.getItem('neoFileSystem') || '{}');
    const cleanStorageDir = storageDirectory ? storageDirectory.replace(/^\/+|\/+$/g, '') : '';
    
    console.log('DEBUG - Current storage directory:', storageDirectory);
    console.log('DEBUG - Cleaned storage directory:', cleanStorageDir);
    console.log('DEBUG - All files in localStorage:', Object.keys(fileSystem));
    
    const filesInCurrentDir = Object.keys(fileSystem).filter(path => {
      const cleanPath = path.replace(/^\/+|\/+$/g, '');
      
      if (!cleanStorageDir) {
        return !cleanPath.includes('/');
      }
      
      return cleanPath.startsWith(cleanStorageDir + '/') && 
        !cleanPath.slice(cleanStorageDir.length + 1).includes('/');
    });
    
    console.log('DEBUG - Files in current directory:', filesInCurrentDir);
    console.log('DEBUG - File count in current directory:', filesInCurrentDir.length);
  };

  // Initialize db as state
  const [db, setDb] = useState<DatabaseService | null>(null);
  
  // Initialize default document content
  const [documentContent, setDocumentContent] = useState<Record<DocumentType, JSX.Element>>({
    Canvas: (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">NEO - Enhanced Strategy Canvas</h2>
        <div className="prose prose-sm max-w-none">
          <h3 className="text-lg font-semibold mb-2">Section 1: Business Model (Value Creation & Economic Viability)</h3>
          
          <h4 className="font-medium">1. Customer Segments</h4>
          <div className="mb-4">
            <p className="font-medium">Early‐ to Growth‐Stage Startups</p>
            <ul className="list-disc pl-5 mb-2">
              <li>Need integrated strategy + financial modeling</li>
              <li>Seek quick insights on product–market fit and pivot timing</li>
              <li>Comfortable with AI and new tech tools</li>
            </ul>

            <p className="font-medium">SMEs / Mittelstand</p>
            <ul className="list-disc pl-5 mb-2">
              <li>Require advanced scenario analysis (e.g., cost optimization)</li>
              <li>Traditional but under competitive + cost pressures</li>
              <li>Interested in partial automation of strategic planning</li>
            </ul>

            <p className="font-medium">Boutique Consultancies</p>
            <ul className="list-disc pl-5 mb-4">
              <li>Potential to white‐label or embed NEO in client engagements</li>
              <li>Value add: Automated strategy assessment + robust financial modules</li>
            </ul>
          </div>

          <h4 className="font-medium">2. Value Proposition</h4>
          <ul className="list-disc pl-5 mb-4">
            <li>Integrated AI for Strategy, Systems Thinking & Finance: Single tool unifying strategic planning, system dynamics, and real‐time financial projections.</li>
            <li>Minimal Effort, High Impact: NEO's interface and guided Q&A help non‐technical teams quickly produce consistent strategies + cash flow forecasts.</li>
            <li>High‐Touch + Self‐Serve: Subscription tiers from Basic to Enterprise, plus optional short-run pilot packages for immediate lumpsum value + advanced support.</li>
          </ul>

          <h4 className="font-medium">3. Revenue Model</h4>
          <div className="mb-4">
            <p className="font-medium">Subscription Tiers</p>
            <ul className="list-disc pl-5 mb-2">
              <li>Basic @ €49/mo: Core strategy interface + essential AI prompts</li>
              <li>Pro @ €99/mo: Deeper scenario planning, advanced analytics, partial priority support</li>
              <li>Enterprise @ €299/mo: Full feature set, premium support, potential customization</li>
            </ul>

            <p className="font-medium">Pilot Engagements & Consulting</p>
            <ul className="list-disc pl-5 mb-2">
              <li>Short-run "Strategy Accelerator" packages at €5–10k each</li>
              <li>Retainer options for ongoing advisory or extended support</li>
            </ul>

            <p className="italic">Goal: Combine recurring subscription MRR (~€8.3k needed by Month 12) with pilot deals to surpass €100k total revenue in Year 1.</p>
          </div>

          <h4 className="font-medium">4. Cost Structure & Resource Allocation</h4>
          <div className="mb-4">
            <p className="font-medium">Fixed / Operational Costs:</p>
            <ul className="list-disc pl-5 mb-2">
              <li>Tech stack (infrastructure, software subscriptions), marketing campaigns, some development resources (potential freelancers)</li>
            </ul>

            <p className="font-medium">Variable Costs:</p>
            <ul className="list-disc pl-5 mb-2">
              <li>Travel for in‐person pilot engagements, potential commissions for referral partnerships</li>
            </ul>

            <p className="italic">Emphasis: Lean operations but allocate enough to high‐ROI marketing (LinkedIn, partnership events) to secure pilot deals quickly.</p>
          </div>

          <h4 className="font-medium">5. Channels & Go‐to‐Market Strategy</h4>
          <div className="mb-4">
            <p className="font-medium">Digital Presence</p>
            <ul className="list-disc pl-5 mb-2">
              <li>Targeted LinkedIn Ads for startup founders / scale‐up CEOs</li>
              <li>Bi‐weekly NEO Live Demo Webinars (drive immediate signups or pilot interest)</li>
              <li>Thought leadership content (blog posts, short LinkedIn articles) focusing on synergy of AI + strategic finance</li>
            </ul>

            <p className="font-medium">Partnerships</p>
            <ul className="list-disc pl-5 mb-2">
              <li>2–3 startup accelerators or VC networks with special deals for portfolio companies</li>
              <li>Potential collaborations with boutique consulting firms</li>
            </ul>

            <p className="font-medium">Direct Sales</p>
            <ul className="list-disc pl-5 mb-2">
              <li>Founder‐led outbound to ~20–30 leads monthly, focusing on Enterprise or pilot deals</li>
              <li>Fast follow‐ups on inbound leads from events / content marketing</li>
            </ul>
          </div>

          <h4 className="font-medium">6. Key Activities</h4>
          <div className="mb-4">
            <p className="font-medium">Product Development:</p>
            <ul className="list-disc pl-5 mb-2">
              <li>Maintain monthly iteration cycles; implement top user requests for advanced analytics / financial modeling</li>
            </ul>

            <p className="font-medium">Marketing & Sales:</p>
            <ul className="list-disc pl-5 mb-2">
              <li>Execute 2–3 targeted campaigns per quarter</li>
              <li>Conduct live demos, manage pilot engagements, sign annual Enterprise deals</li>
            </ul>

            <p className="font-medium">Customer Success:</p>
            <ul className="list-disc pl-5 mb-2">
              <li>Onboarding flows for Basic, Pro, Enterprise</li>
              <li>Priority support + best‐practice sharing for pilot engagement clients</li>
            </ul>
          </div>

          <h4 className="font-medium">7. Key Partnerships & Ecosystem</h4>
          <div className="mb-6">
            <p className="font-medium">Startup Incubators / Accelerators</p>
            <ul className="list-disc pl-5 mb-2">
              <li>Bulk onboarding of early‐stage startups at Basic or Pro tiers</li>
              <li>Revenue share or discount codes in exchange for co‐branding</li>
            </ul>

            <p className="font-medium">SME Networks & Trade Organizations</p>
            <ul className="list-disc pl-5 mb-2">
              <li>Introductory webcasts explaining AI‐driven strategy for midsize businesses</li>
            </ul>

            <p className="font-medium">Consulting & Tech Alliances</p>
            <ul className="list-disc pl-5 mb-2">
              <li>Partnerships with complementary SaaS (e.g., project management or CRM tools)</li>
              <li>Cross‐sell packages targeting companies wanting an end‐to‐end digital transformation</li>
            </ul>
          </div>

          <h3 className="text-lg font-semibold mb-2">Section 2: Strategy (Competitive Positioning & Strategic Choices)</h3>
          
          <h4 className="font-medium">8. Market Definition & Competitive Landscape</h4>
          <ul className="list-disc pl-5 mb-4">
            <li>AI‐Driven Strategy Tools: Growing but often siloed—few unify strategy, finance & system dynamics in one interface.</li>
            <li>Generic Financial Projection Platforms: Excel add‐ons, basic CFO tools lacking deep strategic or AI support.</li>
            <li>Traditional Consultancies: High cost, manual methods. Can't easily scale for smaller clients.</li>
          </ul>

          <h4 className="font-medium">9. Where to Play (Strategic Positioning)</h4>
          <ul className="list-disc pl-5 mb-4">
            <li>Focus on Founders + Growth‐Stage Firms: They value an AI tool that can quickly assess new revenue models, cost structures, break‐even points, pivot timing.</li>
            <li>SMEs Seeking Competitive Modernization: Emphasize how NEO's advanced forecasting and scenario planning addresses cost pressures and digital transformation demands.</li>
          </ul>

          <h4 className="font-medium">10. How to Win (Competitive Advantage & Differentiation)</h4>
          <ul className="list-disc pl-5 mb-4">
            <li>Advanced AI: Specialized training in systems thinking, strategy frameworks, and integrated financial modeling.</li>
            <li>Immediate ROI: Clear outcomes from pilot engagements; pay‐once for a "Strategy Accelerator," keep subscription for ongoing iteration.</li>
            <li>Ease + Depth: Straightforward interface, but robust under the hood for advanced analytics.</li>
          </ul>

          <h4 className="font-medium">11. Trade‐offs & Focus Areas</h4>
          <ul className="list-disc pl-5 mb-4">
            <li>Prioritize Pilots Over General Low‐Tier Volume: Must close 8–10 higher‐value deals to ensure hitting €100k.</li>
            <li>Limit Over‐Customization: Avoid building excessive features that only serve niche demands. Keep product agile but consistent.</li>
          </ul>

          <h4 className="font-medium">12. Key Capabilities & Organizational Strengths</h4>
          <ul className="list-disc pl-5 mb-4">
            <li>AI Expertise: Efficiently convert large strategic / financial data sets into actionable insights.</li>
            <li>Systems Thinking: Holistic approach ensures clients see beyond linear "input–output," fosters deeper scenario planning.</li>
            <li>Sales + Consulting Experience: Ability to quickly build trust, pitch to top‐tier clients or accelerator cohorts.</li>
          </ul>

          <h4 className="font-medium">13. Business Model Scalability & Growth Strategy</h4>
          <div className="mb-6">
            <p className="font-medium">Year 1</p>
            <ul className="list-disc pl-5 mb-2">
              <li>€100k target via combined subscription + pilot revenues.</li>
              <li>300 paying subscribers, with 40% on Pro or Enterprise.</li>
            </ul>

            <p className="font-medium">Year 2–3</p>
            <ul className="list-disc pl-5 mb-2">
              <li>Expand marketing channels, formal reseller partnerships.</li>
              <li>Potential new modules (sector‐specific expansions, deeper ESG or supply chain risk analyses).</li>
            </ul>
          </div>

          <h3 className="text-lg font-semibold mb-2">Section 3: Systems Thinking (Resilience & Adaptability Mechanisms)</h3>
          
          <h4 className="font-medium">14. External Forces & Market Dynamics</h4>
          <ul className="list-disc pl-5 mb-4">
            <li>AI Regulation & Data Privacy: Watch for shifts that might affect how we develop or handle financial data.</li>
            <li>Economic Climate: If funding slows, pivot messaging to cost‐saving, ROI metrics.</li>
            <li>Competitive Imitation: Expect new entrants. Keep distinctive synergy of strategy + finance + systems approach.</li>
          </ul>

          <h4 className="font-medium">15. Risk Factors & Uncertainty Mapping</h4>
          <ul className="list-disc pl-5 mb-4">
            <li>Pricing Resistance: Some early‐stage founders might balk at €299 for Enterprise. Mitigate via pilot ROI demos.</li>
            <li>Resource Overextension: Founder's time is limited. Enlist help for marketing or user support if signups surge.</li>
            <li>Dependence on Partnerships: If an accelerator partnership underdelivers on signups, pivot quickly to direct outreach.</li>
          </ul>

          <h4 className="font-medium">16. Leading Indicators & Early Warning Signals</h4>
          <ul className="list-disc pl-5 mb-4">
            <li>Pilot Deal Pipeline: If fewer than 2 pilot deals close in the first quarter, intensify direct outreach / discount promos.</li>
            <li>Churn Rate: Spikes in monthly cancellations among Pro or Enterprise signups indicate product or onboarding issues.</li>
            <li>Lead Volume from Partnerships: Track signups from each referral link or event; course‐correct if conversions lag.</li>
          </ul>

          <h4 className="font-medium">17. Feedback Loops & Learning Mechanisms</h4>
          <ul className="list-disc pl-5 mb-4">
            <li>User Feedback Cycle: Gather monthly feedback from paying users. Rapidly implement top requests for scenario planning or advanced analytics.</li>
            <li>Pilot "Success Stories": Each short‐run engagement must end with a postmortem to refine NEO's frameworks.</li>
            <li>Quarterly Strategy Review: Evaluate go‐to‐market results, pivot marketing channels or pilot pricing if short of revenue targets.</li>
          </ul>

          <h4 className="font-medium">18. Scenario Planning & Contingency Strategies</h4>
          <ul className="list-disc pl-5 mb-4">
            <li>Best Case: Quick pilot wins, user base grows to 300+ at healthy Pro/Enterprise ratio, well over €100k.</li>
            <li>Moderate: Slower pilot traction, must double down on partner channels, maybe lower initial pilot price to fill the pipeline.</li>
            <li>Worst Case: Very low signups at new subscription levels, forcing promotional deals or pivot to a broader consulting focus.</li>
          </ul>

          <h4 className="font-medium">19. Long‐Term Sustainability & Competitive Evolution</h4>
          <ul className="list-disc pl-5 mb-4">
            <li>Continuous Innovation: Keep AI features relevant. Expand sectors (manufacturing, SaaS, healthcare).</li>
            <li>Scaling Freedoms: Once subscription MRR is stable, invest in expansions (APIs, advanced reporting modules).</li>
            <li>Global Market Reach: Localize the tool (languages, local compliance) if growth potential emerges internationally.</li>
          </ul>
        </div>
      </div>
    ),
    Strategy: (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Strategy Document for NEO</h2>
        <div className="prose prose-sm max-w-none">
          <h3 className="text-lg font-semibold mb-2">1. Strategic Narrative (Core Story)</h3>
          <p>NEO is our next-generation AI tool engineered to revolutionize the way businesses develop and execute strategy. By harnessing advanced machine learning and systems analysis, NEO delivers real-time, actionable insights that empower users to align strategic planning with financial performance. NEO not only automates the strategic design process—integrating customer insights, operational data, and financial projections—but also provides dynamic feedback loops and scenario planning capabilities that adapt to market changes. Its mission is to transform complex strategic challenges into clear, data-driven action plans with minimal user effort.</p>
          
          <h4 className="font-medium mt-4">Where We Are Now</h4>
          <ul className="list-disc pl-5 mb-4">
            <li>Many startups and growing businesses create one‐off strategic documents that quickly become outdated, fail to link to financial projections, and do not adapt to changing market needs.</li>
            <li>Venture Capital (VC) firms seek consistent, up‐to‐date insight into their portfolio companies but often rely on manual reporting.</li>
            <li>Tools exist for strategy, for financial projections, and for OKR monitoring — but they rarely stay in sync.</li>
          </ul>

          <h4 className="font-medium">Where We Want to Go</h4>
          <ul className="list-disc pl-5 mb-4">
            <li>NEO becomes the go-to platform for continuous strategic alignment: diagnosing challenges, defining strategy (with OKRs), matching financial projections, and adapting in real time based on performance.</li>
            <li>We cater to VC-backed startups (needing product‐market fit validation and investor‐ready projections) and VC firms (monitoring evolving portfolio needs), ensuring these pillars remain linked.</li>
          </ul>

          <h4 className="font-medium">How We Will Get There</h4>
          <ul className="list-disc pl-5 mb-6">
            <li>Provide a SaaS offering with monthly subscriptions so users have continuous access to iterative strategy development.</li>
            <li>Integrate strategy, metrics, and finances in one platform, ensuring that changes in financial assumptions automatically reflect in strategic objectives and vice versa.</li>
            <li>Offer premium consulting services for deeper engagements, especially where more customization and strategic insight is required by founders and VCs.</li>
          </ul>

          <h3 className="text-lg font-semibold mb-2">2. Vision, Mission & Business Goals</h3>
          <h4 className="font-medium">Vision</h4>
          <p className="mb-4">To become the industry-standard AI tool that redefines strategic planning by seamlessly integrating systems thinking, strategy formulation, financial projection and operational metrics — guiding both startups and their investors towards resilience, alignment and data‐driven success.</p>

          <h4 className="font-medium">Mission</h4>
          <p className="mb-4">We enable and empower startups and VCs to adapt swiftly and align their strategic decisions, action plans (OKRs), and financial projections in real time. By merging systems thinking, strategy formulation, and financial modeling, we ensure every business decision is coherent, evidence‐based, and future‐resilient.</p>

          <h4 className="font-medium">Business Goals</h4>
          <ul className="list-disc pl-5 mb-6">
            <li>Profit Every Year: Reach operational profitability for NEO within 2 years and contribute significantly to overall revenue growth. Avoid negative net margins by aligning staff expansion and R&D with actual MRR.</li>
            <li>Continuous growth in profit: continuous growth in profit margins and net profit with digital products.</li>
            <li>Productivity gains: Demonstrate a 50% reduction in planning cycle times for users compared to traditional methods.</li>
            <li>NPS score: Attain a customer satisfaction rating of over 90% within the first 18 months.</li>
            <li>Market Penetration: Achieve market penetration in the strategic planning software space by capturing at least 20% of the target market within 3 years.</li>
          </ul>

          <h3 className="text-lg font-semibold mb-2">3. Diagnosis of the Challenge</h3>
          <h4 className="font-medium">Root Problems</h4>
          <ol className="list-decimal pl-5 mb-4">
            <li className="mb-2">
              <strong>Integration Gap in Strategic Tools:</strong>
              <ul className="list-disc pl-5 mt-1">
                <li>Existing tools address either strategy formulation, financial projections, or OKRs in isolation</li>
                <li>No solution effectively unifies systems thinking, strategy, and financial modeling in one platform</li>
                <li>Organizations struggle with disconnected tools leading to strategic-financial misalignment</li>
              </ul>
            </li>
            <li className="mb-2">
              <strong>Market Adoption Barriers:</strong>
              <ul className="list-disc pl-5 mt-1">
                <li>Startups and SMEs are hesitant to adopt new strategic planning tools</li>
                <li>High customer education requirement as systems thinking is not widely understood</li>
                <li>Initial pricing resistance for an unproven but premium-positioned solution</li>
              </ul>
            </li>
            <li className="mb-2">
              <strong>Resource Constraints:</strong>
              <ul className="list-disc pl-5 mt-1">
                <li>Limited initial resources to simultaneously build robust product features, marketing presence, and support capabilities</li>
                <li>Challenge of balancing founder time between sales (pilot engagements), product development, and strategic partnerships</li>
                <li>Funding limitations requiring careful resource allocation without compromising quality</li>
              </ul>
            </li>
            <li className="mb-2">
              <strong>AI Integration Complexities:</strong>
              <ul className="list-disc pl-5 mt-1">
                <li>Technical challenge of ensuring consistent AI outputs across various strategy frameworks</li>
                <li>Potential model deprecation or changes could break core functionality</li>
                <li>Maintaining data security and privacy while leveraging AI capabilities</li>
              </ul>
            </li>
            <li className="mb-2">
              <strong>Competitive Differentiation:</strong>
              <ul className="list-disc pl-5 mt-1">
                <li>Risk of being perceived as "just another strategy tool" or "just another AI implementation"</li>
                <li>Need to establish clear value demonstration for different user segments (founders vs. VCs)</li>
                <li>Balancing depth of functionality with ease of use and implementation</li>
              </ul>
            </li>
          </ol>

          <h4 className="font-medium">External Drivers</h4>
          <div className="mb-6">
            <p className="font-medium">Market & Technology Factors:</p>
            <ul className="list-disc pl-5 mb-4">
              <li>Growing demand for real-time strategic insights amid economic uncertainty</li>
              <li>Increasing acceptance of AI-powered business tools</li>
              <li>Remote/distributed teams require centralized strategic collaboration</li>
              <li>Shift toward data-driven decision-making in strategy development</li>
            </ul>

            <p className="font-medium">Competitive Environment:</p>
            <ul className="list-disc pl-5 mb-4">
              <li>Risk of established consulting firms developing similar digital offerings</li>
              <li>Potential for larger SaaS platforms to add strategic planning modules</li>
              <li>Emergence of specialized AI tools that address portions of the strategic planning process</li>
            </ul>

            <p className="font-medium">Regulatory & Security Considerations:</p>
            <ul className="list-disc pl-5 mb-4">
              <li>Evolving AI regulations might impact how NEO processes and stores strategic data</li>
              <li>Data privacy concerns, especially with financial and strategic information</li>
              <li>Transparency requirements around AI-generated content and recommendations</li>
            </ul>
          </div>

          <h3 className="text-lg font-semibold mb-2">4. Where to Play (Market & Positioning Choices)</h3>
          <h4 className="font-medium">Primary Segments</h4>
          
          <div className="mb-4">
            <h5 className="font-medium">VC-Backed Startups (Growth Stage)</h5>
            <p className="font-medium mt-2">Jobs to be Done:</p>
            <ul className="list-disc pl-5 mb-2">
              <li>Refine product-market fit and validate strategic direction while scaling</li>
              <li>Create consistent, investor-ready documentation that aligns strategy with financial projections</li>
              <li>Track KPIs and metrics that demonstrate growth and validate the business model</li>
              <li>Make data-driven decisions about pivoting or doubling down on current strategies</li>
              <li>Effectively communicate strategic changes and financial impacts to investors and board members</li>
              <li>Scale operations while preserving the agility and innovation that drove initial success</li>
            </ul>

            <p className="font-medium mt-2">Pains:</p>
            <ul className="list-disc pl-5 mb-2">
              <li>Strategic misalignment between departments as company grows (60% fail due to poor strategy-execution alignment)</li>
              <li>Fragmented tools (Excel, Asana, QuickBooks) that don't synchronize, creating inconsistent data</li>
              <li>Reactive decision-making with manual scenario modeling taking weeks, delaying market responses</li>
              <li>Lack of real-time data to justify pivots to investors</li>
              <li>KPI/OKR confusion with teams tracking 50+ metrics without understanding which directly impact survival/growth</li>
              <li>Only 22% of employees can name their company's top 3 OKRs</li>
              <li>Scaling inefficiencies where rapid hiring/growth creates operational chaos</li>
              <li>Time-consuming investor reporting that feels disconnected from operational reality</li>
            </ul>

            <p className="font-medium mt-2">Gains:</p>
            <ul className="list-disc pl-5 mb-4">
              <li>Reduced time to pivot from 6-9 months to 3 weeks</li>
              <li>Alignment between strategic decisions, OKRs, and financial projections</li>
              <li>Data-driven confidence in strategic decisions</li>
              <li>Clear visibility into which metrics truly impact growth and sustainability</li>
              <li>Ability to quickly model different scenarios and their financial implications</li>
              <li>Improved investor relations through consistent, transparent reporting</li>
              <li>Preserved culture and innovation during scaling</li>
            </ul>
          </div>

          <h4 className="font-medium">Geographic Focus</h4>
          <ul className="list-disc pl-5 mb-4">
            <li>Start local (DACH region) for initial traction, expand globally via remote SaaS.</li>
          </ul>

          <h4 className="font-medium">Channels</h4>
          <ul className="list-disc pl-5 mb-4">
            <li>Direct Outreach to VC networks & accelerators.</li>
            <li>Digital self‐serve signups for early‐stage founders.</li>
            <li>LinkedIn and Website for marketing and sales</li>
            <li>Partnerships with financial software or strategic consultancies for joint go‐to‐market.</li>
          </ul>

          <h4 className="font-medium">Market Positioning</h4>
          <p className="mb-6">NEO is positioned as a cutting-edge, intelligent strategic partner—offering a unified platform that transforms complex strategic challenges into clear, actionable plans. Its value lies in its ability to reduce manual effort, speed up decision-making, and ensure continuous alignment between strategy and financial performance.</p>

          <h3 className="text-lg font-semibold mb-2">5. How to Win (Competitive Advantage & Unique Value Proposition)</h3>
          <h4 className="font-medium">Current Challenge in the Market</h4>
          <p className="mb-4">Traditional strategy development is fragmented, static, and lacks integration between strategic vision and financial realities. Business management tools exist in silos. Companies use one tool for strategic planning, another for financial modeling, a third for OKRs, and nothing connects them. When market conditions change, updating all these elements becomes time-consuming and error-prone due to human intervention.</p>

          <p className="mb-4">In short, current strategy tools are either:</p>
          <ul className="list-disc pl-5 mb-4">
            <li>Too theoretical (strategy frameworks without implementation guidance)</li>
            <li>Too tactical (financial spreadsheets without strategic context)</li>
            <li>Too rigid (templates that don't adapt to business evolution)</li>
            <li>Too fragmented (separate tools for strategy, finance, and execution)</li>
          </ul>

          <h4 className="font-medium">NEO's Proprietary AI Solution</h4>
          <p className="mb-2">NEO's AI approach is uniquely powerful because:</p>
          <ol className="list-decimal pl-5 mb-4">
            <li>Synchronized Systems Architecture: Our proprietary document synchronization engine ensures any change in one strategic element automatically triggers intelligent updates across all other documents.</li>
            <li>Strategy-Finance Integration Algorithm: We've developed a specialized AI model that translates strategic decisions directly into financial implications and vice versa.</li>
            <li>Adaptive Strategy Evolution Engine: Our unique AI capability learns from strategy implementation data, creating a continuous improvement cycle.</li>
            <li>Dynamic Strategy Canvas: Unlike static business model canvases, our Dynamic Strategy Canvas continuously evolves as the business learns and market conditions change.</li>
            <li>Investor-Ready Outputs: NEO produces professional-quality outputs specifically designed to appeal to venture capital firms.</li>
            <li>AI-Powered Scenario Planning: NEO generates multidimensional scenario analyses based on key assumptions.</li>
            <li>Implementation-First Approach: NEO bridges the strategy-execution gap by converting strategic intentions directly into actionable OKRs.</li>
            <li>Continuous Adaptation Framework: NEO ensures strategies evolve based on market feedback and performance data.</li>
            <li>End-to-End Strategy Integration: NEO seamlessly connects strategy formulation, financial projection, and execution tracking.</li>
          </ol>

          <h3 className="text-lg font-semibold mb-2">6. Guiding Policy (Strategic Principles & Trade‐offs)</h3>
          <h4 className="font-medium">Strategic Principles:</h4>
          <ul className="list-disc pl-5 mb-4">
            <li>Focus on Integration: Always align strategy with financial and operational realities.</li>
            <li>Embrace Systems Thinking: Use holistic analysis and feedback loops.</li>
            <li>Prioritize Customer Success: Design solutions that ensure long-term customer retention.</li>
            <li>Agile Adaptation: Be prepared to pivot based on real-time data.</li>
            <li>Monitor monthly net margin: Phase in expenses gradually to maintain profitability.</li>
            <li>Carefully monitor OPEX: Restrict expansions to avoid overspending.</li>
            <li>Preserve a Minimal Marketing Budget: Focus on word of mouth and inbound content.</li>
            <li>Slight price premium: Justify higher monthly fees with unique value proposition.</li>
            <li>Emphasize Premium Value: Maintain identity as a "close, personalized" solution.</li>
            <li>Limit consulting or implement standardized packages.</li>
          </ul>

          <h4 className="font-medium">Trade-offs:</h4>
          <ul className="list-disc pl-5 mb-6">
            <li>Prioritize long-term strategic alignment over short-term revenue gains.</li>
            <li>Invest in robust, scalable technology even if initial costs are higher.</li>
            <li>Focus on depth of service and simplicity rather than generic solutions.</li>
            <li>Deliver simple but functional solutions for small businesses.</li>
            <li>Ensure high quality content rather than new features.</li>
            <li>Won't chase hyper‐scaling or huge marketing blasts.</li>
            <li>Won't overspend in fear of being overrun.</li>
            <li>Won't drastically discount to gain mass users.</li>
            <li>Not a free or low‐end financial tool.</li>
          </ul>

          <h3 className="text-lg font-semibold mb-2">7. Key Strategic Priorities & Focus Areas</h3>
          <h4 className="font-medium">Product Development & Innovation:</h4>
          <ul className="list-disc pl-5 mb-4">
            <li>Continuously iterate the user interface for a seamless experience.</li>
            <li>Ongoing, user‐driven improvements.</li>
            <li>Enhance AI capabilities in systems thinking and financial forecasting.</li>
          </ul>

          <h4 className="font-medium">Market Expansion & Customer Acquisition:</h4>
          <ul className="list-disc pl-5 mb-6">
            <li>Target early adopters in the startup ecosystem.</li>
            <li>Develop robust digital marketing and thought leadership.</li>
            <li>Predefined annual marketing budget for content and community.</li>
            <li>Build relationships with VCs and growth‐stage startups.</li>
          </ul>

          <h3 className="text-lg font-semibold mb-2">8. Execution Plan (Coherent Actions & Resource Allocation)</h3>
          <h4 className="font-medium">Phase 1 (0–6 Months)</h4>
          <ul className="list-disc pl-5 mb-4">
            <li>MVP with essential synergy features</li>
            <li>Secure 10–15 pilot customers</li>
            <li>Gather feedback for improvement</li>
            <li>Initiate digital marketing campaigns</li>
          </ul>

          <h4 className="font-medium">Phase 2 (6–12 Months)</h4>
          <ul className="list-disc pl-5 mb-4">
            <li>Lean R&D expansions</li>
            <li>Expand subscription tiers</li>
            <li>Expand brand presence</li>
            <li>Build a small team for support</li>
          </ul>

          <h4 className="font-medium">Phase 3 (Year 2+)</h4>
          <ul className="list-disc pl-5 mb-6">
            <li>Staff additions based on MRR thresholds</li>
            <li>Implement "client cap" or waitlist</li>
            <li>Evaluate global expansions</li>
            <li>Introduce additional modules</li>
          </ul>

          <h3 className="text-lg font-semibold mb-2">9. Risk Management & Resilience</h3>
          <h4 className="font-medium">Key Risks</h4>
          <ul className="list-disc pl-5 mb-4">
            <li>Market Acceptance Risk: Resistance to new tools</li>
            <li>Competitive Risk: Larger players replicating features</li>
            <li>Scaling Risk: Growth straining support</li>
            <li>Churn Risk: Failure to deliver continuous value</li>
            <li>Market Acceptance: Heavy reliance on digital offerings</li>
            <li>Limited Consulting: Digital uptake challenges</li>
            <li>Competitive Pressure: Larger marketing budgets</li>
            <li>Tax & Regulatory Changes: Policy shifts</li>
          </ul>

          <h4 className="font-medium">Mitigation Strategies</h4>
          <ul className="list-disc pl-5 mb-6">
            <li>Seamless onboarding and early feedback loops</li>
            <li>Targeted content and community building</li>
            <li>Modular, high-margin packages</li>
            <li>Continuous differentiation</li>
            <li>Strong user engagement and retention</li>
            <li>Buffer & scenario planning</li>
          </ul>

          <h3 className="text-lg font-semibold mb-2">10. Performance Metrics & Success Measures</h3>
          <h4 className="font-medium">Leading Indicators</h4>
          <ul className="list-disc pl-5 mb-4">
            <li>Monthly Churn Rate below 5%</li>
            <li>New Startup Signups/Month from referrals</li>
            <li>Partnership Conversions</li>
            <li>Net Profit remaining positive</li>
            <li>Monthly Recurring Revenue (MRR)</li>
          </ul>

          <h4 className="font-medium">Lagging Indicators</h4>
          <ul className="list-disc pl-5 mb-4">
            <li>MRR Growth per quarter</li>
            <li>Net Promoter Score (NPS)</li>
            <li>Consulting Revenue ratio</li>
            <li>Team Growth based on MRR</li>
          </ul>

          <h4 className="font-medium">Review Cadence</h4>
          <ul className="list-disc pl-5 mb-6">
            <li>Monthly: Evaluate metrics and patterns</li>
            <li>Quarterly: Strategic updates and pivots</li>
          </ul>

          <h3 className="text-lg font-semibold mb-2">11. Long-Term Sustainability & Evolution</h3>
          <h4 className="font-medium">Sustainability Strategy</h4>
          <ul className="list-disc pl-5 mb-4">
            <li>Invest in continuous R&D</li>
            <li>Cultivate innovation culture</li>
            <li>Expand service ecosystem</li>
          </ul>

          <h4 className="font-medium">Evolution Strategy</h4>
          <ul className="list-disc pl-5 mb-4">
            <li>Regular strategic framework updates</li>
            <li>Foster strategic partnerships</li>
            <li>Balance efficiency with growth</li>
          </ul>
        </div>
      </div>
    ),
    'Financial Projection': (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">NEO Financial Projections (5-Year Plan)</h2>
        <div className="prose prose-sm max-w-none">
          
          <h3 className="text-lg font-semibold mb-2">1. Working Days Calculation</h3>
          <ul className="list-disc pl-5 mb-4">
            <li>Calendar Days: 365</li>
            <li>Non-Working Days:
              <ul className="list-none pl-5">
                <li>- Weekend Days: 104</li>
                <li>- Public Holidays: 11</li>
                <li>- Vacation Days: 30</li>
                <li>- Sick Days: 5</li>
                <li>- Training/Admin: 12</li>
              </ul>
            </li>
            <li>Net Available Working Days: 203</li>
            <li>Maximum Utilization Rate: 80%</li>
            <li>Maximum Billable Days: 162</li>
          </ul>

          <h3 className="text-lg font-semibold mb-2">2. Revenue Streams</h3>
          
          <h4 className="font-medium">Digital Revenue</h4>
          <p className="mb-2">Basic Subscription (Test Version):</p>
          <ul className="list-disc pl-5 mb-4">
            <li>Subscriptions Growth: 150 → 2400</li>
            <li>Price: Free trial version</li>
            <li>Churn Rate: 0%</li>
            <li>Revenue: €0 (Free tier)</li>
          </ul>

          <p className="mb-2">Professional Subscription:</p>
          <ul className="list-disc pl-5 mb-4">
            <li>Conversion Rate from Basic: 40%</li>
            <li>Subscriptions Growth: 60 → 960</li>
            <li>Price: €999/month</li>
            <li>Churn Rate: 2% monthly (24% yearly)</li>
            <li>Revenue Growth: €546,653 → €8,746,445</li>
          </ul>

          <p className="mb-2">Enterprise Subscription:</p>
          <ul className="list-disc pl-5 mb-4">
            <li>Subscriptions Growth: 1 → 15</li>
            <li>Price: €2,999/month</li>
            <li>Churn Rate: 2% monthly (24% yearly)</li>
            <li>Revenue Growth: €27,351 → €410,263</li>
          </ul>

          <h4 className="font-medium mt-4">Service Revenue</h4>
          <p className="mb-2">Basic Setup (5 days):</p>
          <ul className="list-disc pl-5 mb-4">
            <li>Conversion Rate: 20% from Basic</li>
            <li>Cost per Implementation: €10,000</li>
            <li>Implementations: 30 → 480</li>
            <li>Revenue Growth: €300,000 → €4,800,000</li>
          </ul>

          <p className="mb-2">Professional Onboarding (10 days):</p>
          <ul className="list-disc pl-5 mb-4">
            <li>Conversion Rate: 20% from Professional</li>
            <li>Cost per Implementation: €20,000</li>
            <li>Implementations: 12 → 192</li>
            <li>Revenue Growth: €240,000 → €3,840,000</li>
          </ul>

          <p className="mb-2">Enterprise Implementation (30 days):</p>
          <ul className="list-disc pl-5 mb-4">
            <li>Conversion Rate: 20% from Enterprise</li>
            <li>Cost per Implementation: €40,000</li>
            <li>Implementations: 0 → 3</li>
            <li>Revenue Growth: €0 → €120,000</li>
          </ul>

          <h3 className="text-lg font-semibold mb-2">3. Cost Structure</h3>
          
          <h4 className="font-medium">COGS Breakdown</h4>
          <p className="mb-2">Digital Revenue COGS (10% of revenue):</p>
          <ul className="list-disc pl-5 mb-4">
            <li>Cloud Infrastructure: €11,480 → €183,134</li>
            <li>Database Costs: €11,480 → €183,134</li>
            <li>Third-party API Licenses: €11,480 → €183,134</li>
            <li>Customer Support Tools: €22,960 → €366,268</li>
          </ul>

          <p className="mb-2">Consulting Services COGS:</p>
          <ul className="list-disc pl-5 mb-4">
            <li>Direct Consultant Salaries: €150,000 → €4,200,000</li>
            <li>Client Project Travel: €4,500 → €72,000</li>
            <li>Project Materials: €1,500 → €24,000</li>
            <li>Total COGS: €213,400 → €5,211,671</li>
          </ul>

          <h4 className="font-medium">Operating Expenses (OPEX)</h4>
          <ul className="list-disc pl-5 mb-4">
            <li>Tech & Infrastructure: €14,500 → €47,000</li>
            <li>Marketing (15% of revenue): €167,101 → €2,687,506</li>
            <li>Capability Development (5%): €55,700 → €895,838</li>
            <li>Growth Investments (5%): €55,700 → €895,835</li>
            <li>Total OPEX: €296,501 → €4,739,180</li>
          </ul>

          <h3 className="text-lg font-semibold mb-2">4. Profitability Summary</h3>
          <ul className="list-disc pl-5 mb-4">
            <li>Total Revenue: €1,114,004 → €17,916,708</li>
            <li>Total Costs: €509,901 → €9,950,851</li>
            <li>Net Profit: €332,256 → €4,381,221</li>
            <li>Net Profit Margin: 30% → 24%</li>
          </ul>

          <h3 className="text-lg font-semibold mb-2">5. Key Metrics</h3>
          <ul className="list-disc pl-5 mb-4">
            <li>Digital Products:
              <ul className="list-none pl-5">
                <li>- Total Subscribers: 211 → 3,375</li>
                <li>- LTV:CAC Ratio: 4-5x</li>
              </ul>
            </li>
            <li>Services:
              <ul className="list-none pl-5">
                <li>- Active Clients: 42 → 675</li>
                <li>- LTV:CAC Ratio: 4-6x</li>
              </ul>
            </li>
            <li>Cash Flow:
              <ul className="list-none pl-5">
                <li>- Operating Buffer: 10%</li>
                <li>- Monthly Net Profit: €27,688 → €365,102</li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    ),
    OKRs: (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">NEO – Objectives and Key Results derived from Strategy</h2>
        <div className="prose prose-sm max-w-none">
          {/* Objective 1 */}
          <div className="mb-8 bg-blue-50 p-4 rounded">
            <h3 className="text-lg font-semibold mb-2">Objective 1: Achieve €100K in Total First-Year Revenue</h3>
            <p className="italic mb-3">Rationale: Secure short-term financial viability, build investor confidence, and lay the foundation for scaling.</p>
            <h4 className="font-medium mb-2">Key Results</h4>
            <ol className="list-decimal pl-5">
              <li>Generate a minimum of €8,300 in Monthly Recurring Revenue (MRR) by Month 12.</li>
              <li>Close at least 8 high-ticket pilot engagements or consulting deals (≥ €5,000 each) within Year 1.</li>
              <li>Convert at least 40% of new signups to Pro (€99/mo) or Enterprise (€299/mo) tiers on an annual plan.</li>
              <li>Maintain an average 30-day sales cycle (from lead to closed deal) or less for B2B pilot offerings.</li>
              <li>Achieve an average revenue per user (ARPU) of at least €80 across all paying subscribers in Year 1.</li>
            </ol>
          </div>

          {/* Objective 2 */}
          <div className="mb-8 bg-green-50 p-4 rounded">
            <h3 className="text-lg font-semibold mb-2">Objective 2: Grow Subscription Base & Reduce Churn</h3>
            <p className="italic mb-3">Rationale: Establish strong, recurring subscription income and foster stable user retention, particularly for high-value tiers.</p>
            <h4 className="font-medium mb-2">Key Results</h4>
            <ol className="list-decimal pl-5">
              <li>Reach 300 total paying subscribers by end of Year 1 (across all tiers).</li>
              <li>Maintain a monthly churn rate below 5% after the first 3 months of launch.</li>
              <li>Attain ≥ 40% of subscribers on Pro or Enterprise plans within 6 months.</li>
              <li>Achieve ≥ 20% subscription upgrades (e.g., from Basic to Pro or Enterprise) by end of Year 1.</li>
              <li>Limit free trial to paid conversion time to a median of 10 days or fewer.</li>
            </ol>
          </div>

          {/* Objective 3 */}
          <div className="mb-8 bg-purple-50 p-4 rounded">
            <h3 className="text-lg font-semibold mb-2">Objective 3: Deliver Exceptional Customer Satisfaction & ROI</h3>
            <p className="italic mb-3">Rationale: Differentiate NEO through quality user experience, robust strategic insights, and clear value—driving long-term loyalty and word-of-mouth.</p>
            <h4 className="font-medium mb-2">Key Results</h4>
            <ol className="list-decimal pl-5">
              <li>Maintain a Customer Satisfaction Score ≥ 90% across all paying tiers (via quarterly surveys).</li>
              <li>Attain an NPS (Net Promoter Score) ≥ 50 by Year 1, indicating strong brand advocacy.</li>
              <li>Log at least 10 verified ROI case studies (e.g., cost savings, revenue growth, successful pivots) from Pro/Enterprise clients.</li>
              <li>Time-to-Value under 14 days for new signups—measure how quickly new users complete a meaningful strategic/financial scenario.</li>
              <li>Achieve a &lt;24-hour average response time for Enterprise-tier support tickets (and &lt;48 hours for all tiers).</li>
            </ol>
          </div>

          {/* Objective 4 */}
          <div className="mb-8 bg-yellow-50 p-4 rounded">
            <h3 className="text-lg font-semibold mb-2">Objective 4: Strengthen Market Presence & Channel Partnerships</h3>
            <p className="italic mb-3">Rationale: Leverage strategic alliances and targeted marketing to efficiently attract leads who can afford higher-tier subscriptions.</p>
            <h4 className="font-medium mb-2">Key Results</h4>
            <ol className="list-decimal pl-5">
              <li>Establish 2–3 formal accelerator or VC network partnerships that onboard at least 50 total Basic/Pro subscribers within the first 6 months.</li>
              <li>Generate more than 1,000 qualified leads from LinkedIn Ads, webinars, and direct outreach by the end of Year 1.</li>
              <li>Host a bi-weekly "NEO Live Demo" webinar with an average of 50+ attendees each, converting at least 10% to paying subscribers.</li>
              <li>Secure 5 external blog posts or press mentions highlighting NEO's unique AI-driven strategy + finance approach.</li>
              <li>Participate as a speaker or sponsor in 3 industry events or startup conferences, building brand credibility.</li>
            </ol>
          </div>

          {/* Objective 5 */}
          <div className="mb-8 bg-red-50 p-4 rounded">
            <h3 className="text-lg font-semibold mb-2">Objective 5: Rapid Product & AI Enhancement Aligned with User Needs</h3>
            <p className="italic mb-3">Rationale: Continuously evolve NEO's capabilities to retain competitive edge, especially at premium price points.</p>
            <h4 className="font-medium mb-2">Key Results</h4>
            <ol className="list-decimal pl-5">
              <li>Implement 5 top-voted feature requests from Enterprise tier clients each quarter, ensuring high perceived value at €299/mo.</li>
              <li>Release 2 major AI improvements (e.g., advanced scenario planning or deeper financial modeling modules) within the first 9 months.</li>
              <li>Maintain a monthly product iteration cycle—each iteration addresses at least 1 critical user feedback item from the pilot or Pro/Enterprise customers.</li>
              <li>Achieve a product uptime of 99.9% and keep bug resolution time under 72 hours on average.</li>
              <li>Conduct quarterly user-experience audits, ensuring that key workflows require ≤ 3 clicks to reach the main strategic or financial outcome screens.</li>
            </ol>
          </div>

          {/* Objective 6 */}
          <div className="mb-8 bg-indigo-50 p-4 rounded">
            <h3 className="text-lg font-semibold mb-2">Objective 6: Operational Efficiency & Resource Allocation</h3>
            <p className="italic mb-3">Rationale: Ensure stable internal processes despite rapid customer expansion and rising demands on support or custom engagements.</p>
            <h4 className="font-medium mb-2">Key Results</h4>
            <ol className="list-decimal pl-5">
              <li>Dedicate ≥ 30% of your weekly schedule to direct sales and pilot‐engagement calls, ensuring pipeline momentum.</li>
              <li>Onboard 1–2 reliable freelancers/contractors for either marketing or development by Month 6, freeing up founder time for high-value tasks.</li>
              <li>Keep monthly burn rate under €X (appropriate for your budget constraints) while maintaining planned OPEX for growth.</li>
              <li>Maintain a 3-month runway of operating cash in the bank at all times.</li>
              <li>Achieve a funnel conversion rate (from leads to paying customers) of ≥ 10% across all digital channels.</li>
            </ol>
          </div>
        </div>
      </div>
    )
  });

  // Initialize systemic issues
  const systemicIssues: {[key: string]: SystemicIssue[]} = {
    Strategy: [
      {
        id: 'sys-strategy-1',
        type: 'trap',
        title: 'Success to the Successful',
        description: 'Focus on high-value enterprise clients might create a reinforcing loop that neglects the basic tier, potentially limiting market reach.',
        systemsPerspective: 'This is a classic "Success to the Successful" archetype where resources flow disproportionately to one part of the system, potentially creating fragility.',
        suggestedAction: {
          document: 'Strategy',
          action: 'Add balanced growth strategy section',
          explanation: 'Implement a balanced resource allocation strategy that maintains growth across all customer segments while leveraging enterprise success.'
        }
      },
      {
        id: 'sys-strategy-2',
        type: 'feedback_loop',
        title: 'Delayed Customer Satisfaction Feedback',
        description: 'The 18-month target for customer satisfaction creates a significant delay in the feedback loop, potentially masking early warning signals.',
        systemsPerspective: 'Long feedback delays can lead to oscillations in system behavior and overcompensation in responses.',
        suggestedAction: {
          document: 'OKRs',
          action: 'Add intermediate satisfaction metrics',
          explanation: 'Introduce monthly NPS tracking and quarterly satisfaction pulse surveys to create tighter feedback loops.'
        }
      }
    ],
    'Financial Projection': [
      {
        id: 'sys-finance-1',
        type: 'resilience',
        title: 'Revenue Stream Interdependence',
        description: 'Heavy reliance on pilot deals creates a potential brittleness in the revenue structure.',
        systemsPerspective: 'Resilient systems have multiple, diverse, and independent ways of meeting needs.',
        suggestedAction: {
          document: 'Financial Projection',
          action: 'Diversify revenue streams',
          explanation: 'Add complementary revenue streams like training programs or consulting retainers to increase system resilience.'
        }
      }
    ],
    Canvas: [
      {
        id: 'sys-canvas-1',
        type: 'hierarchy',
        title: 'Centralized Value Creation',
        description: 'Current model assumes centralized control of value creation, limiting system adaptability.',
        systemsPerspective: 'Self-organizing systems often outperform centrally controlled ones in complex environments.',
        suggestedAction: {
          document: 'Canvas',
          action: 'Add community-driven value section',
          explanation: 'Incorporate user-generated content and community-driven features to enable distributed value creation.'
        }
      }
    ],
    OKRs: [
      {
        id: 'sys-okr-1',
        type: 'opportunity',
        title: 'Emergent Network Effects',
        description: 'Current OKRs focus on linear growth metrics, missing potential network effects.',
        systemsPerspective: 'Systems can exhibit emergent properties that create non-linear growth opportunities.',
        suggestedAction: {
          document: 'OKRs',
          action: 'Add network effect metrics',
          explanation: 'Include metrics that track and incentivize user collaboration and network growth.'
        }
      }
    ]
  };

  const [fileLocation, setFileLocation] = useState<FileLocation | null>(null);
  const [showFileSetup, setShowFileSetup] = useState(false);
  const [strategyDocument, setStrategyDocument] = useState<{ content: string }>({ content: '' });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing app...');
        const location = await FileService.getFileLocation();
        console.log('Retrieved file location:', location);
        
        if (location) {
          setFileLocation(location);
          await loadDocuments(location);
        } else {
          console.log('No file location found, showing setup modal');
          setShowFileSetup(true);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        setShowFileSetup(true);
      }
    };

    initializeApp();
  }, []);

  const loadDocuments = async (location: FileLocation) => {
    try {
      console.log('Loading documents from location:', location);
      // TODO: Implement document loading from the saved location
      // This will involve reading the JSON files and updating the state
      setHasDocuments(true);
    } catch (error) {
      console.error('Error loading documents:', error);
      setError('Failed to load documents');
    }
  };

  const handleFileSetupComplete = async (location: FileLocation) => {
    try {
      console.log('File setup completed with location:', location);
      setFileLocation(location);
      setShowFileSetup(false);
      await loadDocuments(location);
      setSuccessMessage('File setup completed successfully');
    } catch (error) {
      console.error('Error handling file setup completion:', error);
      setError('Failed to complete file setup');
    }
  };

  // Function to check for inconsistencies between documents
  const checkInconsistencies = (assignments: Record<DocumentType, string>) => {
    const newCounts: Record<DocumentType, number> = {
      'Canvas': 0,
      'Strategy': 0,
      'Financial Projection': 0,
      'OKRs': 0
    };

    // Only check for inconsistencies if at least 2 documents are assigned
    const assignedDocuments = Object.entries(assignments).filter(([_, path]) => path !== '');
    if (assignedDocuments.length < 2) {
      setInconsistencyCount(newCounts);
      return;
    }

    // Check for inconsistencies between assigned documents
    assignedDocuments.forEach(([docType, path]) => {
      const currentDocType = docType as DocumentType;
      
      // Example inconsistency checks (modify based on your actual requirements)
      if (currentDocType === 'Strategy' && assignments['OKRs'] !== '') {
        // Check for strategy-OKR alignment
        newCounts['Strategy']++;
        newCounts['OKRs']++;
      }
      
      if (currentDocType === 'Canvas' && assignments['OKRs'] !== '') {
        // Check for canvas-OKR alignment
        newCounts['Canvas']++;
        newCounts['OKRs']++;
      }
      
      if (currentDocType === 'Strategy' && assignments['Financial Projection'] !== '') {
        // Check for strategy-financial alignment
        newCounts['Strategy']++;
        newCounts['Financial Projection']++;
      }
    });

    setInconsistencyCount(newCounts);
  };

  // Initialize on client-side only
  useEffect(() => {
    setIsClient(true);
    
    if (typeof window !== 'undefined') {
      // Load document assignments from localStorage
      const savedAssignments = localStorage.getItem('neoDocumentAssignments');
      if (savedAssignments) {
        const assignments = JSON.parse(savedAssignments);
        setDocumentAssignments(assignments);
        checkInconsistencies(assignments);
      } else {
        // Reset inconsistency counts if no assignments exist
        setInconsistencyCount({
          'Canvas': 0,
          'Strategy': 0,
          'Financial Projection': 0,
          'OKRs': 0
        });
      }
      
      // Set up initial Claude response
      setClaudeResponses([{
        id: 1,
        response: "Welcome to NEO Strategy Platform. Please select your documents to begin analyzing your strategy."
      }]);
      
      // Load document assignments
      FileSystemService.loadDocumentAssignments();
      
      // Get storage directory from localStorage
      setStorageDirectory(localStorage.getItem('neoStorageDirectory') || '');
      
      // Initialize the database
      const database = new DatabaseService();
      database.initializeData();
      setDb(database);
      
      // Initialize document content with empty states
      setDocumentContent({
        Canvas: (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">NEO - Enhanced Strategy Canvas</h2>
            <div className="prose prose-sm max-w-none">
              <h3 className="text-lg font-semibold mb-2">Section 1: Business Model (Value Creation & Economic Viability)</h3>
              
              <h4 className="font-medium">1. Customer Segments</h4>
            <div className="mb-4">
                <p className="font-medium">Early‐ to Growth‐Stage Startups</p>
                <ul className="list-disc pl-5 mb-2">
                  <li>Need integrated strategy + financial modeling</li>
                  <li>Seek quick insights on product–market fit and pivot timing</li>
                  <li>Comfortable with AI and new tech tools</li>
                </ul>

                <p className="font-medium">SMEs / Mittelstand</p>
                <ul className="list-disc pl-5 mb-2">
                  <li>Require advanced scenario analysis (e.g., cost optimization)</li>
                  <li>Traditional but under competitive + cost pressures</li>
                  <li>Interested in partial automation of strategic planning</li>
                </ul>

                <p className="font-medium">Boutique Consultancies</p>
                <ul className="list-disc pl-5 mb-4">
                  <li>Potential to white‐label or embed NEO in client engagements</li>
                  <li>Value add: Automated strategy assessment + robust financial modules</li>
              </ul>
            </div>

              <h4 className="font-medium">2. Value Proposition</h4>
              <ul className="list-disc pl-5 mb-4">
                <li>Integrated AI for Strategy, Systems Thinking & Finance: Single tool unifying strategic planning, system dynamics, and real‐time financial projections.</li>
                <li>Minimal Effort, High Impact: NEO's interface and guided Q&A help non‐technical teams quickly produce consistent strategies + cash flow forecasts.</li>
                <li>High‐Touch + Self‐Serve: Subscription tiers from Basic to Enterprise, plus optional short-run pilot packages for immediate lumpsum value + advanced support.</li>
              </ul>

              <h4 className="font-medium">3. Revenue Model</h4>
            <div className="mb-4">
                <p className="font-medium">Subscription Tiers</p>
                <ul className="list-disc pl-5 mb-2">
                  <li>Basic @ €49/mo: Core strategy interface + essential AI prompts</li>
                  <li>Pro @ €99/mo: Deeper scenario planning, advanced analytics, partial priority support</li>
                  <li>Enterprise @ €299/mo: Full feature set, premium support, potential customization</li>
              </ul>

                <p className="font-medium">Pilot Engagements & Consulting</p>
                <ul className="list-disc pl-5 mb-2">
                  <li>Short-run "Strategy Accelerator" packages at €5–10k each</li>
                  <li>Retainer options for ongoing advisory or extended support</li>
                </ul>

                <p className="italic">Goal: Combine recurring subscription MRR (~€8.3k needed by Month 12) with pilot deals to surpass €100k total revenue in Year 1.</p>
              </div>

              <h4 className="font-medium">4. Cost Structure & Resource Allocation</h4>
              <div className="mb-4">
                <p className="font-medium">Fixed / Operational Costs:</p>
                <ul className="list-disc pl-5 mb-2">
                  <li>Tech stack (infrastructure, software subscriptions), marketing campaigns, some development resources (potential freelancers)</li>
                </ul>

                <p className="font-medium">Variable Costs:</p>
                <ul className="list-disc pl-5 mb-2">
                  <li>Travel for in‐person pilot engagements, potential commissions for referral partnerships</li>
                </ul>

                <p className="italic">Emphasis: Lean operations but allocate enough to high‐ROI marketing (LinkedIn, partnership events) to secure pilot deals quickly.</p>
              </div>

              <h4 className="font-medium">5. Channels & Go‐to‐Market Strategy</h4>
              <div className="mb-4">
                <p className="font-medium">Digital Presence</p>
                <ul className="list-disc pl-5 mb-2">
                  <li>Targeted LinkedIn Ads for startup founders / scale‐up CEOs</li>
                  <li>Bi‐weekly NEO Live Demo Webinars (drive immediate signups or pilot interest)</li>
                  <li>Thought leadership content (blog posts, short LinkedIn articles) focusing on synergy of AI + strategic finance</li>
                </ul>

                <p className="font-medium">Partnerships</p>
                <ul className="list-disc pl-5 mb-2">
                  <li>2–3 startup accelerators or VC networks with special deals for portfolio companies</li>
                  <li>Potential collaborations with boutique consulting firms</li>
                </ul>

                <p className="font-medium">Direct Sales</p>
                <ul className="list-disc pl-5 mb-2">
                  <li>Founder‐led outbound to ~20–30 leads monthly, focusing on Enterprise or pilot deals</li>
                  <li>Fast follow‐ups on inbound leads from events / content marketing</li>
                </ul>
              </div>

              <h4 className="font-medium">6. Key Activities</h4>
              <div className="mb-4">
                <p className="font-medium">Product Development:</p>
                <ul className="list-disc pl-5 mb-2">
                  <li>Maintain monthly iteration cycles; implement top user requests for advanced analytics / financial modeling</li>
                </ul>

                <p className="font-medium">Marketing & Sales:</p>
                <ul className="list-disc pl-5 mb-2">
                  <li>Execute 2–3 targeted campaigns per quarter</li>
                  <li>Conduct live demos, manage pilot engagements, sign annual Enterprise deals</li>
                </ul>

                <p className="font-medium">Customer Success:</p>
                <ul className="list-disc pl-5 mb-2">
                  <li>Onboarding flows for Basic, Pro, Enterprise</li>
                  <li>Priority support + best‐practice sharing for pilot engagement clients</li>
                </ul>
              </div>

              <h4 className="font-medium">7. Key Partnerships & Ecosystem</h4>
              <div className="mb-6">
                <p className="font-medium">Startup Incubators / Accelerators</p>
                <ul className="list-disc pl-5 mb-2">
                  <li>Bulk onboarding of early‐stage startups at Basic or Pro tiers</li>
                  <li>Revenue share or discount codes in exchange for co‐branding</li>
                </ul>

                <p className="font-medium">SME Networks & Trade Organizations</p>
                <ul className="list-disc pl-5 mb-2">
                  <li>Introductory webcasts explaining AI‐driven strategy for midsize businesses</li>
                </ul>

                <p className="font-medium">Consulting & Tech Alliances</p>
                <ul className="list-disc pl-5 mb-2">
                  <li>Partnerships with complementary SaaS (e.g., project management or CRM tools)</li>
                  <li>Cross‐sell packages targeting companies wanting an end‐to‐end digital transformation</li>
                </ul>
              </div>

              <h3 className="text-lg font-semibold mb-2">Section 2: Strategy (Competitive Positioning & Strategic Choices)</h3>
              
              <h4 className="font-medium">8. Market Definition & Competitive Landscape</h4>
              <ul className="list-disc pl-5 mb-4">
                <li>AI‐Driven Strategy Tools: Growing but often siloed—few unify strategy, finance & system dynamics in one interface.</li>
                <li>Generic Financial Projection Platforms: Excel add‐ons, basic CFO tools lacking deep strategic or AI support.</li>
                <li>Traditional Consultancies: High cost, manual methods. Can't easily scale for smaller clients.</li>
              </ul>

              <h4 className="font-medium">9. Where to Play (Strategic Positioning)</h4>
              <ul className="list-disc pl-5 mb-4">
                <li>Focus on Founders + Growth‐Stage Firms: They value an AI tool that can quickly assess new revenue models, cost structures, break‐even points, pivot timing.</li>
                <li>SMEs Seeking Competitive Modernization: Emphasize how NEO's advanced forecasting and scenario planning addresses cost pressures and digital transformation demands.</li>
              </ul>

              <h4 className="font-medium">10. How to Win (Competitive Advantage & Differentiation)</h4>
              <ul className="list-disc pl-5 mb-4">
                <li>Advanced AI: Specialized training in systems thinking, strategy frameworks, and integrated financial modeling.</li>
                <li>Immediate ROI: Clear outcomes from pilot engagements; pay‐once for a "Strategy Accelerator," keep subscription for ongoing iteration.</li>
                <li>Ease + Depth: Straightforward interface, but robust under the hood for advanced analytics.</li>
              </ul>

              <h4 className="font-medium">11. Trade‐offs & Focus Areas</h4>
              <ul className="list-disc pl-5 mb-4">
                <li>Prioritize Pilots Over General Low‐Tier Volume: Must close 8–10 higher‐value deals to ensure hitting €100k.</li>
                <li>Limit Over‐Customization: Avoid building excessive features that only serve niche demands. Keep product agile but consistent.</li>
              </ul>

              <h4 className="font-medium">12. Key Capabilities & Organizational Strengths</h4>
              <ul className="list-disc pl-5 mb-4">
                <li>AI Expertise: Efficiently convert large strategic / financial data sets into actionable insights.</li>
                <li>Systems Thinking: Holistic approach ensures clients see beyond linear "input–output," fosters deeper scenario planning.</li>
                <li>Sales + Consulting Experience: Ability to quickly build trust, pitch to top‐tier clients or accelerator cohorts.</li>
              </ul>

              <h4 className="font-medium">13. Business Model Scalability & Growth Strategy</h4>
              <div className="mb-6">
                <p className="font-medium">Year 1</p>
                <ul className="list-disc pl-5 mb-2">
                  <li>€100k target via combined subscription + pilot revenues.</li>
                  <li>300 paying subscribers, with 40% on Pro or Enterprise.</li>
                </ul>

                <p className="font-medium">Year 2–3</p>
                <ul className="list-disc pl-5 mb-2">
                  <li>Expand marketing channels, formal reseller partnerships.</li>
                  <li>Potential new modules (sector‐specific expansions, deeper ESG or supply chain risk analyses).</li>
                </ul>
              </div>

              <h3 className="text-lg font-semibold mb-2">Section 3: Systems Thinking (Resilience & Adaptability Mechanisms)</h3>
              
              <h4 className="font-medium">14. External Forces & Market Dynamics</h4>
              <ul className="list-disc pl-5 mb-4">
                <li>AI Regulation & Data Privacy: Watch for shifts that might affect how we develop or handle financial data.</li>
                <li>Economic Climate: If funding slows, pivot messaging to cost‐saving, ROI metrics.</li>
                <li>Competitive Imitation: Expect new entrants. Keep distinctive synergy of strategy + finance + systems approach.</li>
              </ul>

              <h4 className="font-medium">15. Risk Factors & Uncertainty Mapping</h4>
              <ul className="list-disc pl-5 mb-4">
                <li>Pricing Resistance: Some early‐stage founders might balk at €299 for Enterprise. Mitigate via pilot ROI demos.</li>
                <li>Resource Overextension: Founder's time is limited. Enlist help for marketing or user support if signups surge.</li>
                <li>Dependence on Partnerships: If an accelerator partnership underdelivers on signups, pivot quickly to direct outreach.</li>
              </ul>

              <h4 className="font-medium">16. Leading Indicators & Early Warning Signals</h4>
              <ul className="list-disc pl-5 mb-4">
                <li>Pilot Deal Pipeline: If fewer than 2 pilot deals close in the first quarter, intensify direct outreach / discount promos.</li>
                <li>Churn Rate: Spikes in monthly cancellations among Pro or Enterprise signups indicate product or onboarding issues.</li>
                <li>Lead Volume from Partnerships: Track signups from each referral link or event; course‐correct if conversions lag.</li>
              </ul>

              <h4 className="font-medium">17. Feedback Loops & Learning Mechanisms</h4>
              <ul className="list-disc pl-5 mb-4">
                <li>User Feedback Cycle: Gather monthly feedback from paying users. Rapidly implement top requests for scenario planning or advanced analytics.</li>
                <li>Pilot "Success Stories": Each short‐run engagement must end with a postmortem to refine NEO's frameworks.</li>
                <li>Quarterly Strategy Review: Evaluate go‐to‐market results, pivot marketing channels or pilot pricing if short of revenue targets.</li>
              </ul>

              <h4 className="font-medium">18. Scenario Planning & Contingency Strategies</h4>
              <ul className="list-disc pl-5 mb-4">
                <li>Best Case: Quick pilot wins, user base grows to 300+ at healthy Pro/Enterprise ratio, well over €100k.</li>
                <li>Moderate: Slower pilot traction, must double down on partner channels, maybe lower initial pilot price to fill the pipeline.</li>
                <li>Worst Case: Very low signups at new subscription levels, forcing promotional deals or pivot to a broader consulting focus.</li>
              </ul>

              <h4 className="font-medium">19. Long‐Term Sustainability & Competitive Evolution</h4>
              <ul className="list-disc pl-5 mb-4">
                <li>Continuous Innovation: Keep AI features relevant. Expand sectors (manufacturing, SaaS, healthcare).</li>
                <li>Scaling Freedoms: Once subscription MRR is stable, invest in expansions (APIs, advanced reporting modules).</li>
                <li>Global Market Reach: Localize the tool (languages, local compliance) if growth potential emerges internationally.</li>
              </ul>
            </div>
          </div>
        ),
        Strategy: (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Strategy Document for NEO</h2>
            <div className="prose prose-sm max-w-none">
              <h3 className="text-lg font-semibold mb-2">1. Strategic Narrative (Core Story)</h3>
              <p>NEO is our next-generation AI tool engineered to revolutionize the way businesses develop and execute strategy. By harnessing advanced machine learning and systems analysis, NEO delivers real-time, actionable insights that empower users to align strategic planning with financial performance. NEO not only automates the strategic design process—integrating customer insights, operational data, and financial projections—but also provides dynamic feedback loops and scenario planning capabilities that adapt to market changes. Its mission is to transform complex strategic challenges into clear, data-driven action plans with minimal user effort.</p>
              
              <h4 className="font-medium mt-4">Where We Are Now</h4>
              <ul className="list-disc pl-5 mb-4">
                <li>Many startups and growing businesses create one‐off strategic documents that quickly become outdated, fail to link to financial projections, and do not adapt to changing market needs.</li>
                <li>Venture Capital (VC) firms seek consistent, up‐to‐date insight into their portfolio companies but often rely on manual reporting.</li>
                <li>Tools exist for strategy, for financial projections, and for OKR monitoring — but they rarely stay in sync.</li>
              </ul>

              <h4 className="font-medium">Where We Want to Go</h4>
            <ul className="list-disc pl-5 mb-4">
                <li>NEO becomes the go-to platform for continuous strategic alignment: diagnosing challenges, defining strategy (with OKRs), matching financial projections, and adapting in real time based on performance.</li>
                <li>We cater to VC-backed startups (needing product‐market fit validation and investor‐ready projections) and VC firms (monitoring evolving portfolio needs), ensuring these pillars remain linked.</li>
              </ul>

              <h4 className="font-medium">How We Will Get There</h4>
              <ul className="list-disc pl-5 mb-6">
                <li>Provide a SaaS offering with monthly subscriptions so users have continuous access to iterative strategy development.</li>
                <li>Integrate strategy, metrics, and finances in one platform, ensuring that changes in financial assumptions automatically reflect in strategic objectives and vice versa.</li>
                <li>Offer premium consulting services for deeper engagements, especially where more customization and strategic insight is required by founders and VCs.</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2">2. Vision, Mission & Business Goals</h3>
              <h4 className="font-medium">Vision</h4>
              <p className="mb-4">To become the industry-standard AI tool that redefines strategic planning by seamlessly integrating systems thinking, strategy formulation, financial projection and operational metrics — guiding both startups and their investors towards resilience, alignment and data‐driven success.</p>

              <h4 className="font-medium">Mission</h4>
              <p className="mb-4">We enable and empower startups and VCs to adapt swiftly and align their strategic decisions, action plans (OKRs), and financial projections in real time. By merging systems thinking, strategy formulation, and financial modeling, we ensure every business decision is coherent, evidence‐based, and future‐resilient.</p>

              <h4 className="font-medium">Business Goals</h4>
              <ul className="list-disc pl-5 mb-6">
                <li>Profit Every Year: Reach operational profitability for NEO within 2 years and contribute significantly to overall revenue growth. Avoid negative net margins by aligning staff expansion and R&D with actual MRR.</li>
                <li>Continuous growth in profit: continuous growth in profit margins and net profit with digital products.</li>
                <li>Productivity gains: Demonstrate a 50% reduction in planning cycle times for users compared to traditional methods.</li>
                <li>NPS score: Attain a customer satisfaction rating of over 90% within the first 18 months.</li>
                <li>Market Penetration: Achieve market penetration in the strategic planning software space by capturing at least 20% of the target market within 3 years.</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2">3. Diagnosis of the Challenge</h3>
              <h4 className="font-medium">Root Problems</h4>
              <ol className="list-decimal pl-5 mb-4">
                <li className="mb-2">
                  <strong>Integration Gap in Strategic Tools:</strong>
                  <ul className="list-disc pl-5 mt-1">
                    <li>Existing tools address either strategy formulation, financial projections, or OKRs in isolation</li>
                    <li>No solution effectively unifies systems thinking, strategy, and financial modeling in one platform</li>
                    <li>Organizations struggle with disconnected tools leading to strategic-financial misalignment</li>
                  </ul>
                </li>
                <li className="mb-2">
                  <strong>Market Adoption Barriers:</strong>
                  <ul className="list-disc pl-5 mt-1">
                    <li>Startups and SMEs are hesitant to adopt new strategic planning tools</li>
                    <li>High customer education requirement as systems thinking is not widely understood</li>
                    <li>Initial pricing resistance for an unproven but premium-positioned solution</li>
                  </ul>
                </li>
                <li className="mb-2">
                  <strong>Resource Constraints:</strong>
                  <ul className="list-disc pl-5 mt-1">
                    <li>Limited initial resources to simultaneously build robust product features, marketing presence, and support capabilities</li>
                    <li>Challenge of balancing founder time between sales (pilot engagements), product development, and strategic partnerships</li>
                    <li>Funding limitations requiring careful resource allocation without compromising quality</li>
                  </ul>
                </li>
                <li className="mb-2">
                  <strong>AI Integration Complexities:</strong>
                  <ul className="list-disc pl-5 mt-1">
                    <li>Technical challenge of ensuring consistent AI outputs across various strategy frameworks</li>
                    <li>Potential model deprecation or changes could break core functionality</li>
                    <li>Maintaining data security and privacy while leveraging AI capabilities</li>
                  </ul>
                </li>
                <li className="mb-2">
                  <strong>Competitive Differentiation:</strong>
                  <ul className="list-disc pl-5 mt-1">
                    <li>Risk of being perceived as "just another strategy tool" or "just another AI implementation"</li>
                    <li>Need to establish clear value demonstration for different user segments (founders vs. VCs)</li>
                    <li>Balancing depth of functionality with ease of use and implementation</li>
                  </ul>
                </li>
              </ol>

              <h4 className="font-medium">External Drivers</h4>
              <div className="mb-6">
                <p className="font-medium">Market & Technology Factors:</p>
                <ul className="list-disc pl-5 mb-4">
                  <li>Growing demand for real-time strategic insights amid economic uncertainty</li>
                  <li>Increasing acceptance of AI-powered business tools</li>
                  <li>Remote/distributed teams require centralized strategic collaboration</li>
                  <li>Shift toward data-driven decision-making in strategy development</li>
                </ul>

                <p className="font-medium">Competitive Environment:</p>
                <ul className="list-disc pl-5 mb-4">
                  <li>Risk of established consulting firms developing similar digital offerings</li>
                  <li>Potential for larger SaaS platforms to add strategic planning modules</li>
                  <li>Emergence of specialized AI tools that address portions of the strategic planning process</li>
                </ul>

                <p className="font-medium">Regulatory & Security Considerations:</p>
                <ul className="list-disc pl-5 mb-4">
                  <li>Evolving AI regulations might impact how NEO processes and stores strategic data</li>
                  <li>Data privacy concerns, especially with financial and strategic information</li>
                  <li>Transparency requirements around AI-generated content and recommendations</li>
            </ul>
              </div>

              <h3 className="text-lg font-semibold mb-2">4. Where to Play (Market & Positioning Choices)</h3>
              <h4 className="font-medium">Primary Segments</h4>
              
              <div className="mb-4">
                <h5 className="font-medium">VC-Backed Startups (Growth Stage)</h5>
                <p className="font-medium mt-2">Jobs to be Done:</p>
                <ul className="list-disc pl-5 mb-2">
                  <li>Refine product-market fit and validate strategic direction while scaling</li>
                  <li>Create consistent, investor-ready documentation that aligns strategy with financial projections</li>
                  <li>Track KPIs and metrics that demonstrate growth and validate the business model</li>
                  <li>Make data-driven decisions about pivoting or doubling down on current strategies</li>
                  <li>Effectively communicate strategic changes and financial impacts to investors and board members</li>
                  <li>Scale operations while preserving the agility and innovation that drove initial success</li>
                </ul>

                <p className="font-medium mt-2">Pains:</p>
                <ul className="list-disc pl-5 mb-2">
                  <li>Strategic misalignment between departments as company grows (60% fail due to poor strategy-execution alignment)</li>
                  <li>Fragmented tools (Excel, Asana, QuickBooks) that don't synchronize, creating inconsistent data</li>
                  <li>Reactive decision-making with manual scenario modeling taking weeks, delaying market responses</li>
                  <li>Lack of real-time data to justify pivots to investors</li>
                  <li>KPI/OKR confusion with teams tracking 50+ metrics without understanding which directly impact survival/growth</li>
                  <li>Only 22% of employees can name their company's top 3 OKRs</li>
                  <li>Scaling inefficiencies where rapid hiring/growth creates operational chaos</li>
                  <li>Time-consuming investor reporting that feels disconnected from operational reality</li>
                </ul>

                <p className="font-medium mt-2">Gains:</p>
                <ul className="list-disc pl-5 mb-4">
                  <li>Reduced time to pivot from 6-9 months to 3 weeks</li>
                  <li>Alignment between strategic decisions, OKRs, and financial projections</li>
                  <li>Data-driven confidence in strategic decisions</li>
                  <li>Clear visibility into which metrics truly impact growth and sustainability</li>
                  <li>Ability to quickly model different scenarios and their financial implications</li>
                  <li>Improved investor relations through consistent, transparent reporting</li>
                  <li>Preserved culture and innovation during scaling</li>
                </ul>
              </div>

              <h4 className="font-medium">Geographic Focus</h4>
              <ul className="list-disc pl-5 mb-4">
                <li>Start local (DACH region) for initial traction, expand globally via remote SaaS.</li>
              </ul>

              <h4 className="font-medium">Channels</h4>
              <ul className="list-disc pl-5 mb-4">
                <li>Direct Outreach to VC networks & accelerators.</li>
                <li>Digital self‐serve signups for early‐stage founders.</li>
                <li>LinkedIn and Website for marketing and sales</li>
                <li>Partnerships with financial software or strategic consultancies for joint go‐to‐market.</li>
              </ul>

              <h4 className="font-medium">Market Positioning</h4>
              <p className="mb-6">NEO is positioned as a cutting-edge, intelligent strategic partner—offering a unified platform that transforms complex strategic challenges into clear, actionable plans. Its value lies in its ability to reduce manual effort, speed up decision-making, and ensure continuous alignment between strategy and financial performance.</p>

              <h3 className="text-lg font-semibold mb-2">5. How to Win (Competitive Advantage & Unique Value Proposition)</h3>
              <h4 className="font-medium">Current Challenge in the Market</h4>
              <p className="mb-4">Traditional strategy development is fragmented, static, and lacks integration between strategic vision and financial realities. Business management tools exist in silos. Companies use one tool for strategic planning, another for financial modeling, a third for OKRs, and nothing connects them. When market conditions change, updating all these elements becomes time-consuming and error-prone due to human intervention.</p>

              <p className="mb-4">In short, current strategy tools are either:</p>
              <ul className="list-disc pl-5 mb-4">
                <li>Too theoretical (strategy frameworks without implementation guidance)</li>
                <li>Too tactical (financial spreadsheets without strategic context)</li>
                <li>Too rigid (templates that don't adapt to business evolution)</li>
                <li>Too fragmented (separate tools for strategy, finance, and execution)</li>
              </ul>

              <h4 className="font-medium">NEO's Proprietary AI Solution</h4>
              <p className="mb-2">NEO's AI approach is uniquely powerful because:</p>
              <ol className="list-decimal pl-5 mb-4">
                <li>Synchronized Systems Architecture: Our proprietary document synchronization engine ensures any change in one strategic element automatically triggers intelligent updates across all other documents.</li>
                <li>Strategy-Finance Integration Algorithm: We've developed a specialized AI model that translates strategic decisions directly into financial implications and vice versa.</li>
                <li>Adaptive Strategy Evolution Engine: Our unique AI capability learns from strategy implementation data, creating a continuous improvement cycle.</li>
                <li>Dynamic Strategy Canvas: Unlike static business model canvases, our Dynamic Strategy Canvas continuously evolves as the business learns and market conditions change.</li>
                <li>Investor-Ready Outputs: NEO produces professional-quality outputs specifically designed to appeal to venture capital firms.</li>
                <li>AI-Powered Scenario Planning: NEO generates multidimensional scenario analyses based on key assumptions.</li>
                <li>Implementation-First Approach: NEO bridges the strategy-execution gap by converting strategic intentions directly into actionable OKRs.</li>
                <li>Continuous Adaptation Framework: NEO ensures strategies evolve based on market feedback and performance data.</li>
                <li>End-to-End Strategy Integration: NEO seamlessly connects strategy formulation, financial projection, and execution tracking.</li>
              </ol>

              <h3 className="text-lg font-semibold mb-2">6. Guiding Policy (Strategic Principles & Trade‐offs)</h3>
              <h4 className="font-medium">Strategic Principles:</h4>
              <ul className="list-disc pl-5 mb-4">
                <li>Focus on Integration: Always align strategy with financial and operational realities.</li>
                <li>Embrace Systems Thinking: Use holistic analysis and feedback loops.</li>
                <li>Prioritize Customer Success: Design solutions that ensure long-term customer retention.</li>
                <li>Agile Adaptation: Be prepared to pivot based on real-time data.</li>
                <li>Monitor monthly net margin: Phase in expenses gradually to maintain profitability.</li>
                <li>Carefully monitor OPEX: Restrict expansions to avoid overspending.</li>
                <li>Preserve a Minimal Marketing Budget: Focus on word of mouth and inbound content.</li>
                <li>Slight price premium: Justify higher monthly fees with unique value proposition.</li>
                <li>Emphasize Premium Value: Maintain identity as a "close, personalized" solution.</li>
                <li>Limit consulting or implement standardized packages.</li>
              </ul>

              <h4 className="font-medium">Trade-offs:</h4>
              <ul className="list-disc pl-5 mb-6">
                <li>Prioritize long-term strategic alignment over short-term revenue gains.</li>
                <li>Invest in robust, scalable technology even if initial costs are higher.</li>
                <li>Focus on depth of service and simplicity rather than generic solutions.</li>
                <li>Deliver simple but functional solutions for small businesses.</li>
                <li>Ensure high quality content rather than new features.</li>
                <li>Won't chase hyper‐scaling or huge marketing blasts.</li>
                <li>Won't overspend in fear of being overrun.</li>
                <li>Won't drastically discount to gain mass users.</li>
                <li>Not a free or low‐end financial tool.</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2">7. Key Strategic Priorities & Focus Areas</h3>
              <h4 className="font-medium">Product Development & Innovation:</h4>
              <ul className="list-disc pl-5 mb-4">
                <li>Continuously iterate the user interface for a seamless experience.</li>
                <li>Ongoing, user‐driven improvements.</li>
                <li>Enhance AI capabilities in systems thinking and financial forecasting.</li>
              </ul>

              <h4 className="font-medium">Market Expansion & Customer Acquisition:</h4>
              <ul className="list-disc pl-5 mb-6">
                <li>Target early adopters in the startup ecosystem.</li>
                <li>Develop robust digital marketing and thought leadership.</li>
                <li>Predefined annual marketing budget for content and community.</li>
                <li>Build relationships with VCs and growth‐stage startups.</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2">8. Execution Plan (Coherent Actions & Resource Allocation)</h3>
              <h4 className="font-medium">Phase 1 (0–6 Months)</h4>
              <ul className="list-disc pl-5 mb-4">
                <li>MVP with essential synergy features</li>
                <li>Secure 10–15 pilot customers</li>
                <li>Gather feedback for improvement</li>
                <li>Initiate digital marketing campaigns</li>
              </ul>

              <h4 className="font-medium">Phase 2 (6–12 Months)</h4>
              <ul className="list-disc pl-5 mb-4">
                <li>Lean R&D expansions</li>
                <li>Expand subscription tiers</li>
                <li>Expand brand presence</li>
                <li>Build a small team for support</li>
              </ul>

              <h4 className="font-medium">Phase 3 (Year 2+)</h4>
              <ul className="list-disc pl-5 mb-6">
                <li>Staff additions based on MRR thresholds</li>
                <li>Implement "client cap" or waitlist</li>
                <li>Evaluate global expansions</li>
                <li>Introduce additional modules</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2">9. Risk Management & Resilience</h3>
              <h4 className="font-medium">Key Risks</h4>
              <ul className="list-disc pl-5 mb-4">
                <li>Market Acceptance Risk: Resistance to new tools</li>
                <li>Competitive Risk: Larger players replicating features</li>
                <li>Scaling Risk: Growth straining support</li>
                <li>Churn Risk: Failure to deliver continuous value</li>
                <li>Market Acceptance: Heavy reliance on digital offerings</li>
                <li>Limited Consulting: Digital uptake challenges</li>
                <li>Competitive Pressure: Larger marketing budgets</li>
                <li>Tax & Regulatory Changes: Policy shifts</li>
              </ul>

              <h4 className="font-medium">Mitigation Strategies</h4>
              <ul className="list-disc pl-5 mb-6">
                <li>Seamless onboarding and early feedback loops</li>
                <li>Targeted content and community building</li>
                <li>Modular, high-margin packages</li>
                <li>Continuous differentiation</li>
                <li>Strong user engagement and retention</li>
                <li>Buffer & scenario planning</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2">10. Performance Metrics & Success Measures</h3>
              <h4 className="font-medium">Leading Indicators</h4>
              <ul className="list-disc pl-5 mb-4">
                <li>Monthly Churn Rate below 5%</li>
                <li>New Startup Signups/Month from referrals</li>
                <li>Partnership Conversions</li>
                <li>Net Profit remaining positive</li>
                <li>Monthly Recurring Revenue (MRR)</li>
              </ul>

              <h4 className="font-medium">Lagging Indicators</h4>
              <ul className="list-disc pl-5 mb-4">
                <li>MRR Growth per quarter</li>
                <li>Net Promoter Score (NPS)</li>
                <li>Consulting Revenue ratio</li>
                <li>Team Growth based on MRR</li>
              </ul>

              <h4 className="font-medium">Review Cadence</h4>
              <ul className="list-disc pl-5 mb-6">
                <li>Monthly: Evaluate metrics and patterns</li>
                <li>Quarterly: Strategic updates and pivots</li>
              </ul>

              <h3 className="text-lg font-semibold mb-2">11. Long-Term Sustainability & Evolution</h3>
              <h4 className="font-medium">Sustainability Strategy</h4>
              <ul className="list-disc pl-5 mb-4">
                <li>Invest in continuous R&D</li>
                <li>Cultivate innovation culture</li>
                <li>Expand service ecosystem</li>
              </ul>

              <h4 className="font-medium">Evolution Strategy</h4>
              <ul className="list-disc pl-5 mb-4">
                <li>Regular strategic framework updates</li>
                <li>Foster strategic partnerships</li>
                <li>Balance efficiency with growth</li>
              </ul>
            </div>
          </div>
        ),
        'Financial Projection': (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">NEO Financial Projections (5-Year Plan)</h2>
            <div className="prose prose-sm max-w-none">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300 mb-6">
                <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-2">Category</th>
                      <th className="border border-gray-300 p-2">Q1</th>
                      <th className="border border-gray-300 p-2">Q2</th>
                      <th className="border border-gray-300 p-2">Q3</th>
                      <th className="border border-gray-300 p-2">Q4</th>
                  </tr>
                </thead>
                <tbody>
                    {/* Revenue Section */}
                    <tr className="bg-blue-50 font-semibold">
                      <td colSpan={5} className="border border-gray-300 p-2">Revenue</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2">Basic Subscriptions</td>
                      <td className="border border-gray-300 p-2">€2,450</td>
                      <td className="border border-gray-300 p-2">€4,900</td>
                      <td className="border border-gray-300 p-2">€7,350</td>
                      <td className="border border-gray-300 p-2">€9,800</td>
                  </tr>
                  <tr>
                      <td className="border border-gray-300 p-2">Pro Subscriptions</td>
                      <td className="border border-gray-300 p-2">€2,970</td>
                      <td className="border border-gray-300 p-2">€5,940</td>
                      <td className="border border-gray-300 p-2">€8,910</td>
                      <td className="border border-gray-300 p-2">€11,880</td>
                  </tr>
                  <tr>
                      <td className="border border-gray-300 p-2">Enterprise Subscriptions</td>
                      <td className="border border-gray-300 p-2">€2,990</td>
                      <td className="border border-gray-300 p-2">€5,980</td>
                      <td className="border border-gray-300 p-2">€8,970</td>
                      <td className="border border-gray-300 p-2">€11,960</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2">Pilot Projects</td>
                      <td className="border border-gray-300 p-2">€15,000</td>
                      <td className="border border-gray-300 p-2">€20,000</td>
                      <td className="border border-gray-300 p-2">€25,000</td>
                      <td className="border border-gray-300 p-2">€30,000</td>
                    </tr>
                    <tr className="bg-green-50 font-semibold">
                      <td className="border border-gray-300 p-2">Total Revenue</td>
                      <td className="border border-gray-300 p-2">€23,410</td>
                      <td className="border border-gray-300 p-2">€36,820</td>
                      <td className="border border-gray-300 p-2">€50,230</td>
                      <td className="border border-gray-300 p-2">€63,640</td>
                    </tr>

                    {/* Expenses Section */}
                    <tr className="bg-red-50 font-semibold">
                      <td colSpan={5} className="border border-gray-300 p-2">Operating Expenses</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2">Infrastructure Costs</td>
                      <td className="border border-gray-300 p-2">€2,500</td>
                      <td className="border border-gray-300 p-2">€3,000</td>
                      <td className="border border-gray-300 p-2">€3,500</td>
                      <td className="border border-gray-300 p-2">€4,000</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2">Marketing & Sales</td>
                      <td className="border border-gray-300 p-2">€5,000</td>
                      <td className="border border-gray-300 p-2">€6,000</td>
                      <td className="border border-gray-300 p-2">€7,000</td>
                      <td className="border border-gray-300 p-2">€8,000</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 p-2">Development</td>
                      <td className="border border-gray-300 p-2">€8,000</td>
                      <td className="border border-gray-300 p-2">€10,000</td>
                      <td className="border border-gray-300 p-2">€12,000</td>
                      <td className="border border-gray-300 p-2">€15,000</td>
                    </tr>
                    <tr className="bg-red-50 font-semibold">
                      <td className="border border-gray-300 p-2">Total Expenses</td>
                      <td className="border border-gray-300 p-2">€15,500</td>
                      <td className="border border-gray-300 p-2">€19,000</td>
                      <td className="border border-gray-300 p-2">€22,500</td>
                      <td className="border border-gray-300 p-2">€27,000</td>
                    </tr>

                    {/* Net Profit Section */}
                    <tr className="bg-purple-50 font-semibold">
                      <td className="border border-gray-300 p-2">Net Profit</td>
                      <td className="border border-gray-300 p-2">€7,910</td>
                      <td className="border border-gray-300 p-2">€17,820</td>
                      <td className="border border-gray-300 p-2">€27,730</td>
                      <td className="border border-gray-300 p-2">€36,640</td>
                  </tr>
                </tbody>
              </table>

                {/* Key Metrics and Analysis */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Key Financial Metrics & Analysis</h3>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-blue-50 p-4 rounded">
                      <h4 className="font-medium mb-2">Revenue Growth</h4>
                      <ul className="list-disc pl-5">
                        <li>Q1 to Q2: 57.3% growth</li>
                        <li>Q2 to Q3: 36.4% growth</li>
                        <li>Q3 to Q4: 26.7% growth</li>
                        <li>Projected Annual Revenue: €174,100</li>
                      </ul>
            </div>

                    <div className="bg-green-50 p-4 rounded">
                      <h4 className="font-medium mb-2">Profitability Metrics</h4>
                      <ul className="list-disc pl-5">
                        <li>Average Quarterly Profit Margin: 45.2%</li>
                        <li>Q4 Profit Margin: 57.6%</li>
                        <li>Total Annual Profit: €90,100</li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-6 bg-yellow-50 p-4 rounded">
                    <h4 className="font-medium mb-2">Key Observations</h4>
                    <ul className="list-disc pl-5">
                      <li>Strong revenue growth from subscription model</li>
                      <li>Pilot projects contribute significantly to revenue</li>
                      <li>Controlled expense growth maintains profitability</li>
                      <li>Healthy profit margins indicate sustainable business model</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ),
        OKRs: (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">NEO – Objectives and Key Results derived from Strategy</h2>
            <div className="prose prose-sm max-w-none">
              {/* Objective 1 */}
              <div className="mb-8 bg-blue-50 p-4 rounded">
              <h3 className="text-lg font-semibold mb-2">Objective 1: Achieve €100K in Total First-Year Revenue</h3>
                <p className="italic mb-3">Rationale: Secure short-term financial viability, build investor confidence, and lay the foundation for scaling.</p>
                <h4 className="font-medium mb-2">Key Results</h4>
                <ol className="list-decimal pl-5">
                  <li>Generate a minimum of €8,300 in Monthly Recurring Revenue (MRR) by Month 12.</li>
                  <li>Close at least 8 high-ticket pilot engagements or consulting deals (≥ €5,000 each) within Year 1.</li>
                  <li>Convert at least 40% of new signups to Pro (€99/mo) or Enterprise (€299/mo) tiers on an annual plan.</li>
                  <li>Maintain an average 30-day sales cycle (from lead to closed deal) or less for B2B pilot offerings.</li>
                  <li>Achieve an average revenue per user (ARPU) of at least €80 across all paying subscribers in Year 1.</li>
                </ol>
            </div>
            
              {/* Objective 2 */}
              <div className="mb-8 bg-green-50 p-4 rounded">
              <h3 className="text-lg font-semibold mb-2">Objective 2: Grow Subscription Base & Reduce Churn</h3>
                <p className="italic mb-3">Rationale: Establish strong, recurring subscription income and foster stable user retention, particularly for high-value tiers.</p>
                <h4 className="font-medium mb-2">Key Results</h4>
                <ol className="list-decimal pl-5">
                  <li>Reach 300 total paying subscribers by end of Year 1 (across all tiers).</li>
                  <li>Maintain a monthly churn rate below 5% after the first 3 months of launch.</li>
                  <li>Attain ≥ 40% of subscribers on Pro or Enterprise plans within 6 months.</li>
                  <li>Achieve ≥ 20% subscription upgrades (e.g., from Basic to Pro or Enterprise) by end of Year 1.</li>
                  <li>Limit free trial to paid conversion time to a median of 10 days or fewer.</li>
                </ol>
              </div>

              {/* Objective 3 */}
              <div className="mb-8 bg-purple-50 p-4 rounded">
                <h3 className="text-lg font-semibold mb-2">Objective 3: Deliver Exceptional Customer Satisfaction & ROI</h3>
                <p className="italic mb-3">Rationale: Differentiate NEO through quality user experience, robust strategic insights, and clear value—driving long-term loyalty and word-of-mouth.</p>
                <h4 className="font-medium mb-2">Key Results</h4>
                <ol className="list-decimal pl-5">
                  <li>Maintain a Customer Satisfaction Score ≥ 90% across all paying tiers (via quarterly surveys).</li>
                  <li>Attain an NPS (Net Promoter Score) ≥ 50 by Year 1, indicating strong brand advocacy.</li>
                  <li>Log at least 10 verified ROI case studies (e.g., cost savings, revenue growth, successful pivots) from Pro/Enterprise clients.</li>
                  <li>Time-to-Value under 14 days for new signups—measure how quickly new users complete a meaningful strategic/financial scenario.</li>
                  <li>Achieve a &lt;24-hour average response time for Enterprise-tier support tickets (and &lt;48 hours for all tiers).</li>
                </ol>
              </div>

              {/* Objective 4 */}
              <div className="mb-8 bg-yellow-50 p-4 rounded">
                <h3 className="text-lg font-semibold mb-2">Objective 4: Strengthen Market Presence & Channel Partnerships</h3>
                <p className="italic mb-3">Rationale: Leverage strategic alliances and targeted marketing to efficiently attract leads who can afford higher-tier subscriptions.</p>
                <h4 className="font-medium mb-2">Key Results</h4>
                <ol className="list-decimal pl-5">
                  <li>Establish 2–3 formal accelerator or VC network partnerships that onboard at least 50 total Basic/Pro subscribers within the first 6 months.</li>
                  <li>Generate more than 1,000 qualified leads from LinkedIn Ads, webinars, and direct outreach by the end of Year 1.</li>
                  <li>Host a bi-weekly "NEO Live Demo" webinar with an average of 50+ attendees each, converting at least 10% to paying subscribers.</li>
                  <li>Secure 5 external blog posts or press mentions highlighting NEO's unique AI-driven strategy + finance approach.</li>
                  <li>Participate as a speaker or sponsor in 3 industry events or startup conferences, building brand credibility.</li>
                </ol>
              </div>

              {/* Objective 5 */}
              <div className="mb-8 bg-red-50 p-4 rounded">
                <h3 className="text-lg font-semibold mb-2">Objective 5: Rapid Product & AI Enhancement Aligned with User Needs</h3>
                <p className="italic mb-3">Rationale: Continuously evolve NEO's capabilities to retain competitive edge, especially at premium price points.</p>
                <h4 className="font-medium mb-2">Key Results</h4>
                <ol className="list-decimal pl-5">
                  <li>Implement 5 top-voted feature requests from Enterprise tier clients each quarter, ensuring high perceived value at €299/mo.</li>
                  <li>Release 2 major AI improvements (e.g., advanced scenario planning or deeper financial modeling modules) within the first 9 months.</li>
                  <li>Maintain a monthly product iteration cycle—each iteration addresses at least 1 critical user feedback item from the pilot or Pro/Enterprise customers.</li>
                  <li>Achieve a product uptime of 99.9% and keep bug resolution time under 72 hours on average.</li>
                  <li>Conduct quarterly user-experience audits, ensuring that key workflows require ≤ 3 clicks to reach the main strategic or financial outcome screens.</li>
                </ol>
              </div>

              {/* Objective 6 */}
              <div className="mb-8 bg-indigo-50 p-4 rounded">
                <h3 className="text-lg font-semibold mb-2">Objective 6: Operational Efficiency & Resource Allocation</h3>
                <p className="italic mb-3">Rationale: Ensure stable internal processes despite rapid customer expansion and rising demands on support or custom engagements.</p>
                <h4 className="font-medium mb-2">Key Results</h4>
                <ol className="list-decimal pl-5">
                  <li>Dedicate ≥ 30% of your weekly schedule to direct sales and pilot‐engagement calls, ensuring pipeline momentum.</li>
                  <li>Onboard 1–2 reliable freelancers/contractors for either marketing or development by Month 6, freeing up founder time for high-value tasks.</li>
                  <li>Keep monthly burn rate under €X (appropriate for your budget constraints) while maintaining planned OPEX for growth.</li>
                  <li>Maintain a 3-month runway of operating cash in the bank at all times.</li>
                  <li>Achieve a funnel conversion rate (from leads to paying customers) of ≥ 10% across all digital channels.</li>
                </ol>
              </div>
            </div>
          </div>
        )
      });
    }
  }, []);

  // Effect hook to check for empty documents and show guided strategy option
  useEffect(() => {
    if (isClient && !hasDocuments && !guidedStrategyState.active && claudeResponses.length <= 1) {
      // Only show this once when the app first loads with no documents
      const initialResponse = {
        id: claudeResponses.length + 1,
        response: "I notice you don't have any strategy documents yet. Would you like me to guide you through creating a complete strategy? I can help you develop a business model, strategic direction, OKRs, and financial projections."
      };
      
      setClaudeResponses([...claudeResponses, initialResponse]);
    }
  }, [hasDocuments, isClient, guidedStrategyState.active, claudeResponses]);

  // Effect hook to load project documents when projectId changes
  useEffect(() => {
    if (projectId !== 'default-project' && db) {
      loadProjectDocuments(projectId);
    }
  }, [projectId, db]);

  // Database integration functions
  const loginUser = async (email: string, password: string) => {
    if (!db) return;
    
    try {
      setIsLoading(true);
      const userCredential = await db.login(email, password);
      setUser(userCredential);
      setShowLoginModal(false);
      loadProjects(userCredential.uid);
    } catch (error: any) {
      console.error("Login error:", error);
      setSuccessMessage(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const logoutUser = async () => {
    try {
      setUser(null);
      setProjectList([]);
      setProjectId('default-project');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const loadProjects = async (userId: string) => {
    if (!userId || !db) return;
    
    try {
      setIsLoading(true);
      const projects = await db.getProjects(userId);
      setProjectList(projects);
      
      // If we have projects but none selected, select the first one
      if (projects.length > 0 && projectId === 'default-project') {
        setProjectId(projects[0].id);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading projects:", error);
      setIsLoading(false);
    }
  };

  const loadProjectDocuments = async (projectId: string) => {
    if (projectId === 'default-project' || !db) return;
    
    try {
      setIsSyncing(true);
      const documents = await db.getDocuments(projectId);
      
      // Check if any documents exist with content
      const hasContent = Object.values(documents).some((doc: any) => 
        doc.content && Object.keys(doc.content).length > 0
      );
      
      setHasDocuments(hasContent);
      
      // Create document content and update inconsistency counts
      const documentMap: any = {};
      const counts: Record<DocumentType, number> = {
        'Canvas': 0,
        'Strategy': 0,
        'Financial Projection': 0,
        'OKRs': 0
      };
      
      // Map DB document types to UI document names
      const docTypeMap: {[key: string]: string} = {
        'canvas': 'Canvas',
        'strategy': 'Strategy',
        'financial': 'Financial Projection',
        'okrs': 'OKRs'
      };
      
      // Process each document type
      Object.entries(documents).forEach(([docType, docData]: [string, any]) => {
        const uiDocType = docTypeMap[docType];
        
        if (uiDocType) {
          // Store content if available
          if (docData.content && docData.content.html) {
            documentMap[uiDocType] = (
              <div className="p-4">
                <h2 className="text-xl font-bold mb-4">{uiDocType} - NEO</h2>
                <div dangerouslySetInnerHTML={{ __html: docData.content.html }} />
              </div>
            );
          }
          
          // Update inconsistency count
          if (uiDocType in counts) {
            counts[uiDocType as DocumentType] = docData.inconsistencies?.length || 0;
          }
        }
      });
      
      // Only update if we found some documents
      if (Object.keys(documentMap).length > 0) {
        setDocumentContent(prevContent => ({
          ...prevContent,
          ...documentMap
        }));
        
        setInconsistencyCount(counts);
      }
      
      setLastSyncedAt(new Date());
      setIsSyncing(false);
    } catch (error) {
      console.error("Error loading documents:", error);
      setIsSyncing(false);
    }
  };
  
  // Save document changes to database
  const saveDocumentChanges = async (documentType: string, htmlContent: string, rawContent: any) => {
    if (!user || projectId === 'default-project' || !db || !isClient) return;
    
    try {
      setIsSyncing(true);
      
      // Map UI document names to DB document types
      const docTypeMap: {[key: string]: string} = {
        'Canvas': 'canvas',
        'Strategy': 'strategy',
        'Financial Projection': 'financial',
        'OKRs': 'okrs'
      };
      
      const dbType = docTypeMap[documentType];
      const content = {
        html: htmlContent,
        raw: rawContent
      };
      
      await db.saveDocument(projectId, dbType, content);
      
      setLastSyncedAt(new Date());
      setSuccessMessage(`${documentType} successfully saved to the database`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error("Error saving document:", error);
      setSuccessMessage(`Error: ${error}`);
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Record an implemented suggestion
  const recordImplementedSuggestion = async (suggestionId: string, documentType: string) => {
    if (!user || projectId === 'default-project' || !db || !isClient) return;
    
    try {
      // Map UI document names to DB document types
      const docTypeMap: {[key: string]: string} = {
        'Canvas': 'canvas',
        'Strategy': 'strategy',
        'Financial Projection': 'financial',
        'OKRs': 'okrs'
      };
      
      const dbType = docTypeMap[documentType];
      await db.recordImplementedSuggestion(projectId, dbType, suggestionId);
    } catch (error) {
      console.error("Error recording implemented suggestion:", error);
    }
  };

  // Function to start the guided strategy process
  const startAIGuidedStrategy = () => {
    if (!isClient) return;
    
    // Initialize the process
    setGuidedStrategyState({
      active: true,
      step: 1,
      inputs: {}
    });
    
    // Add initial Claude response
    const welcomeResponse = {
      id: claudeResponses.length + 1,
      response: `Let's create your strategy step by step. We'll follow this process:

1. Goals & Vision (Current Step)
   - What are your main business goals for the next 1-3 years?
   - What's your vision for the company?
   - What impact do you want to make?

Please start by sharing your goals and vision.`
    };
    
    setClaudeResponses([...claudeResponses, welcomeResponse]);
  };

  // Function to create strategy documents from guided inputs
  const createStrategyDocuments = (inputs: Record<number, string>) => {
    if (!isClient) return;
    
    // Extract information from inputs
    const goals = inputs[1]; // Step 1: Goals & Vision
    const challenges = inputs[2]; // Step 2: Challenges
    const opportunities = inputs[3]; // Step 3: Opportunities
    const valueProposition = inputs[4]; // Step 4: Value Proposition
    
    // Create Strategy Document
    const strategyContent = (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Strategy Document</h2>
        
        <h3 className="text-lg font-semibold mb-2">Vision & Goals</h3>
        <div className="mb-4 bg-blue-50 p-3 rounded">
          <p className="mb-2">{goals}</p>
      </div>
        
        <h3 className="text-lg font-semibold mb-2">Market Analysis</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-red-50 p-3 rounded">
            <h4 className="font-medium mb-2">Challenges</h4>
            <p>{challenges}</p>
        </div>
          <div className="bg-green-50 p-3 rounded">
            <h4 className="font-medium mb-2">Opportunities</h4>
            <p>{opportunities}</p>
        </div>
      </div>
        
        <h3 className="text-lg font-semibold mb-2">Value Proposition</h3>
        <div className="mb-4 bg-purple-50 p-3 rounded">
          <p>{valueProposition}</p>
        </div>
      </div>
    );
    
    // Update document content
    setDocumentContent(prevContent => ({
      ...prevContent,
      Strategy: strategyContent
    }));
    
    // Add completion message
    const completionResponse = {
      id: claudeResponses.length + 1,
      response: "I've created your strategy document based on our discussion. You can find it in the Strategy section. Would you like me to help you create aligned OKRs and financial projections based on this strategy?"
    };
    
    setClaudeResponses(prev => [...prev, completionResponse]);
    
    // Reset guided strategy state
    setGuidedStrategyState({
      active: false,
      step: 0,
      inputs: {}
    });
    
    // Set success message
    setSuccessMessage("Strategy document created successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Function to handle submits
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() === '' || !isClient) return;
    
    // If guided strategy is active, process the input for the current step
    if (guidedStrategyState.active) {
      // Save user input for current step
      const updatedInputs = {
        ...guidedStrategyState.inputs,
        [guidedStrategyState.step]: chatInput
      };
      
      // Determine next step and response based on current step
      let nextStep = guidedStrategyState.step + 1;
      let nextResponse = "";
      
      switch(guidedStrategyState.step) {
        case 1: // After Goals & Vision
          nextResponse = `Thank you for sharing your goals and vision. Now, let's identify the key challenges you face:

2. Challenges (Current Step)
   - What are the main obstacles to achieving your goals?
   - What market challenges do you face?
   - What internal limitations need to be addressed?`;
          break;
        
        case 2: // After Challenges
          nextResponse = `Understanding the challenges helps us focus. Now, let's explore the opportunities:

3. Opportunities (Current Step)
   - What market opportunities can you capitalize on?
   - What unique advantages do you have?
   - What trends can you leverage?`;
          break;
        
        case 3: // After Opportunities
          nextResponse = `Great insights on the opportunities. Finally, let's define your unique value proposition:

4. Value Proposition (Current Step)
   - What makes your solution unique?
   - Why should customers choose you over alternatives?
   - What specific benefits do you deliver?`;
          break;
          
        case 4: // After Value Proposition
          nextResponse = "Thank you for all this valuable information. I'm now generating your strategy document that brings all these elements together coherently.";
          // Generate strategy documents
          setTimeout(() => {
            createStrategyDocuments(updatedInputs);
          }, 2000);
          break;
      }
      
      // Update state
      setGuidedStrategyState({
        active: nextStep <= 4,
        step: nextStep,
        inputs: updatedInputs
      });
      
      // Add Claude response
      const newResponse = {
        id: claudeResponses.length + 1,
        response: nextResponse
      };
      
      setClaudeResponses([...claudeResponses, newResponse]);
    } else {
      // Regular chat handling
      const newResponse = {
        id: claudeResponses.length + 1,
        response: "I'm analyzing your input regarding " + activeDocument.toLowerCase() + ". Based on systems thinking principles, I can see potential reinforcing loops between your strategy and financial projections that need attention. Would you like me to elaborate on specific adjustments?"
      };
      
      setClaudeResponses([...claudeResponses, newResponse]);
    }
    
    setChatInput('');
  };

  // Settings modal handler
  const handleSaveSettings = async (directory: string) => {
    if (!isClient) return;
    
    setStorageDirectory(directory);
    localStorage.setItem('neoStorageDirectory', directory);
    
    setShowSettingsModal(false);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Update inconsistency count when suggestions are implemented
  useEffect(() => {
    // Only update inconsistency counts if there are assigned documents
    const assignedDocuments = Object.entries(documentAssignments).filter(([_, path]) => path !== '');
    if (assignedDocuments.length < 2) {
      setInconsistencyCount({
        'Canvas': 0,
        'Strategy': 0,
        'Financial Projection': 0,
        'OKRs': 0
      });
      return;
    }

    const newCounts: Record<DocumentType, number> = {
      'Canvas': 0,
      'Strategy': 0,
      'Financial Projection': 0,
      'OKRs': 0
    };

    // Count unimplemented inconsistencies for each document
    Object.entries(inconsistencies).forEach(([docType, docInconsistencies]) => {
      newCounts[docType as DocumentType] = docInconsistencies.filter(
        inconsistency => !implementedSuggestions.includes(inconsistency.id)
      ).length;
    });

    setInconsistencyCount(newCounts);
  }, [implementedSuggestions, inconsistencies, documentAssignments]);

  // Add this function near the top with other function declarations
  const scrollToBottom = () => {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-responses');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100); // Small delay to ensure content is rendered
  };

  // Modify the file selection handler
  const handleFileSelect = async (file: FileData) => {
    console.log('File selected:', file);
    try {
      // Save the document assignment
      FileSystemService.setDocumentAssignment(file.docType, file.fullPath);
      
      // Update document assignments state
      const newAssignments = {
        ...documentAssignments,
        [file.docType]: file.fullPath
      };
      setDocumentAssignments(newAssignments);
      
      // Save to localStorage
      localStorage.setItem('neoDocumentAssignments', JSON.stringify(newAssignments));
      
      // Check for inconsistencies with new assignments
      checkInconsistencies(newAssignments);
      
      if (file.docType === 'Strategy') {
        const content = await FileSystemService.readFileContent(file);
        console.log('File content loaded:', content);
        // Update both strategyDocument and documentContent states
        setStrategyDocument({
          ...strategyDocument,
          content: content
        });
        // Update the document content to display the loaded file
        setDocumentContent(prevContent => ({
          ...prevContent,
          Strategy: (
            <div className="p-4">
              <h2 className="text-xl font-bold mb-4">Strategy Document</h2>
              <div 
                className="prose prose-sm max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:text-base prose-ul:list-disc prose-ul:pl-5 prose-li:text-base prose-strong:font-bold prose-em:italic prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded"
                dangerouslySetInnerHTML={{ __html: marked(content
                  .replace(/[•>]/g, '') // Remove bullets and arrows
                  .replace(/[|+=-]/g, '') // Remove box-drawing characters
                  .replace(/\s+/g, ' ') // Normalize whitespace
                  .replace(/[‐—]/g, '-') // Normalize dashes
                  .replace(/['']/g, "'") // Normalize quotes
                  .replace(/[""]/g, '"') // Normalize double quotes
                  .replace(/&;/g, '') // Remove HTML entities
                  .replace(/<[^>]*>/g, '') // Remove HTML tags
                  .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
                  .replace(/\n{3,}/g, '\n\n') // Normalize multiple newlines
                  .replace(/\s*>\s*/g, '') // Remove standalone > characters
                  .trim(), {
                  breaks: true,
                  gfm: true
                }) }}
              />
            </div>
          )
        }));
        setSuccessMessage('Strategy document updated successfully');
      } else {
        setErrorMessage('Please select a Strategy document');
      }
    } catch (error) {
      console.error('Error loading file content:', error);
      setErrorMessage('Failed to load file content');
    }
  };

  // Function to handle opening the file manager
  const handleOpenFileManager = () => {
    setModalRefreshKey(prevKey => prevKey + 1); // Increment the key to force refresh
    logFileSystemState(); // Log file system state for debugging
    setShowFileManagerModal(true);
  };

  // Function to handle opening the settings modal
  const handleOpenSettings = () => {
    setModalRefreshKey(prevKey => prevKey + 1); // Increment the key to force refresh
    logFileSystemState(); // Log file system state for debugging
    setShowSettingsModal(true);
  };

  // Remove the checkFilesInDirectory function and its usage
  const handleDirectoryChange = async (newDirectory: string) => {
    setStorageDirectory(newDirectory);
    localStorage.setItem('neoStorageDirectory', newDirectory);
  };

  // Remove the implementSuggestion function and its usage
  const handleSuggestionClick = (suggestionId: string) => {
    // Handle suggestion click without implementing changes
    console.log('Suggestion clicked:', suggestionId);
  };

  // Add handler for warning clicks
  const handleWarningClick = async (docType: DocumentType, inconsistency: Inconsistency) => {
    // Switch to the document related to the warning
    setActiveDocument(docType);
    
    setSelectedWarning({ docType, inconsistency });
    
    const prompt = `I've identified an inconsistency in your ${docType} document that needs attention:

Location: ${inconsistency.implementationDetails.section}
Issue: ${inconsistency.text}
Recommended Action: ${inconsistency.implementationDetails.action}

I'll provide a detailed suggestion to resolve this issue:
1. What exactly needs to change
2. How it should be changed
3. Why this change is important
4. The expected impact of this change

Please analyze this issue and provide specific, actionable steps to resolve it.`;
    
    setClaudePrompt(prompt);
    setPromptStage('pending');
    
    try {
      const response: ClaudeResponse = {
        id: Date.now(),
        response: `I've analyzed the inconsistency in your ${docType} document and here's my detailed suggestion:

Issue Location: ${inconsistency.implementationDetails.section}

Current Issue:
${inconsistency.text}

Recommended Fix:
${inconsistency.implementationDetails.action}

Implementation Steps:
1. Navigate to the ${inconsistency.implementationDetails.section} section
2. Review the current content
3. Apply the suggested changes
4. Verify the consistency with other sections

Would you like me to help you implement these changes?`,
        suggestion: {
          id: `suggestion-${Date.now()}`,
          text: inconsistency.text,
        implementationDetails: {
            section: inconsistency.implementationDetails.section,
            action: inconsistency.implementationDetails.action
          }
        }
      };
      
      setClaudeResponses(prev => [...prev, response]);
      setPromptStage('completed');
    } catch (error) {
      setError('Failed to generate suggestion');
      setPromptStage('idle');
    }
  };

  // Remove the improvementSuggestions object and its usage
  const renderSuggestions = () => {
    return null; // Or implement a different suggestion rendering logic
  };

  // Add the function to generate improvement suggestions
  const generateImprovementSuggestion = async (documentType: DocumentType) => {
    const prompt = `Please analyze the current ${documentType} document and suggest improvements:
1. Review the content structure
2. Check for clarity and completeness
3. Identify potential enhancements
4. Consider best practices for ${documentType.toLowerCase()} documents

Please provide specific, actionable suggestions for improving this document.`;
    
    setClaudePrompt(prompt);
    setPromptStage('pending');
    
    try {
      const response: ClaudeResponse = {
        id: Date.now(),
        response: `I've analyzed your ${documentType} and here's my suggestion for improvement:`,
        suggestion: {
          id: `improvement-${Date.now()}`,
          text: `Consider enhancing the ${documentType} by improving its structure and content`,
        implementationDetails: {
            section: documentType,
            action: 'Enhance document structure and content'
          }
        }
      };
      
      setClaudeResponses(prev => [...prev, response]);
      setPromptStage('completed');
    } catch (error) {
      setError('Failed to generate improvement suggestion');
      setPromptStage('idle');
    }
  };

  // Add an interval to periodically check for potential improvements
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeDocument) {
        generateImprovementSuggestion(activeDocument);
      }
    }, 300000); // Check every 5 minutes

    return () => clearInterval(interval);
  }, [activeDocument]);

  // Render the component
  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Top Bar */}
    {user && (
        <div className="w-full bg-blue-600 text-white p-2 flex justify-between items-center z-10">
        <div className="flex items-center">
          <span className="font-medium ml-2">
            {user.email} | Project: {projectId !== 'default-project' ? 
              projectList.find(p => p.id === projectId)?.name || projectId : 'No Project Selected'}
          </span>
        </div>
        <div className="flex items-center">
          {lastSyncedAt && (
            <span className="text-sm mr-4">
              Last synced: {lastSyncedAt.toLocaleTimeString()}
            </span>
          )}
            <button 
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mr-2"
              onClick={handleOpenFileManager}
            >
              Choose File
            </button>
          <button 
            className="text-white hover:text-gray-200 text-sm"
            onClick={logoutUser}
          >
            Sign Out
          </button>
        </div>
      </div>
    )}
    
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
      {/* Left Sidebar */}
        <div className="w-64 bg-gray-200 flex flex-col h-full">
          <div className="flex-1 p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Project Files</h2>
          
          <button 
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded mb-4 flex items-center justify-center gap-2 transition-colors"
              onClick={startAIGuidedStrategy}
          >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
              Create New Strategy
          </button>
          
            {/* Document buttons */}
            {Object.keys(documentAssignments).map((docType) => (
          <button 
                key={docType}
                className={`w-full p-2 rounded mb-2 flex items-center justify-between ${
                  activeDocument === docType ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100'
                }`}
                onClick={() => setActiveDocument(docType as DocumentType)}
              >
                {docType}
                {inconsistencies[docType as DocumentType]?.length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {inconsistencies[docType as DocumentType]?.length}
                  </span>
                )}
          </button>
            ))}

            {/* Warnings section */}
            <div className="mt-4 bg-white p-4 rounded shadow">
              <h3 className="font-bold text-lg mb-2">Warnings</h3>
              {Object.entries(inconsistencies).map(([docType, docInconsistencies]) => 
                docInconsistencies.map((inconsistency: Inconsistency) => (
                  <div
                    key={inconsistency.id}
                    className="mb-2 p-2 bg-red-50 rounded cursor-pointer hover:bg-red-100 transition-colors"
                    onClick={() => handleWarningClick(docType as DocumentType, inconsistency)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{docType}</span>
                      <span className="text-sm text-red-600">{inconsistency.implementationDetails.section}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{inconsistency.text}</p>
                    <p className="text-xs text-red-600 mt-1">
                      Action needed: {inconsistency.implementationDetails.action}
                    </p>
                  </div>
                ))
              )}
              {Object.keys(inconsistencies).every(key => !inconsistencies[key as DocumentType]?.length) && (
                <p className="text-gray-500 text-sm">No warnings found</p>
              )}
            </div>

            {/* Fixed bottom buttons */}
            <div className="p-4 border-t border-gray-300 bg-gray-200">
            <button 
                className="w-full bg-green-500 hover:bg-green-600 text-white p-2 rounded mb-2 flex items-center justify-center transition-colors"
                onClick={handleOpenFileManager}
            >
                File Manager
            </button>
              <button 
                className="w-full bg-purple-500 hover:bg-purple-600 text-white p-2 rounded flex items-center justify-center transition-colors"
                onClick={handleOpenSettings}
              >
                Settings
              </button>
            </div>
        </div>
      </div>

        {/* Center Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
        {/* Document Display */}
        <div className={`flex-1 bg-white m-4 mb-2 rounded shadow overflow-auto ${isSyncing ? 'opacity-50' : ''}`}>
          {isSyncing && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="bg-white p-4 rounded-lg shadow-lg">
                <div className="flex items-center">
                  <svg className="animate-spin h-8 w-8 text-blue-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-gray-700 font-medium">Syncing with database...</span>
                </div>
              </div>
            </div>
          )}
            <div className="text-left">
              {documentContent[activeDocument as DocumentType]}
        </div>
                </div>
        </div>
        
      {/* Right Sidebar */}
        <div className="w-80 bg-gray-100 flex flex-col h-full">
          {/* Scrollable content area */}
          <div className="flex-1 p-4 overflow-y-auto">
            {/* Systemic Issues */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Systemic Issues</h3>
              <div className="bg-white rounded-lg shadow">
                {systemicIssues[activeDocument]?.length > 0 ? (
                  systemicIssues[activeDocument].map(issue => (
                    <div
                      key={issue.id}
                      className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 ${
                        issue.type === 'trap' ? 'border-l-4 border-l-red-500' :
                        issue.type === 'opportunity' ? 'border-l-4 border-l-green-500' :
                        issue.type === 'feedback_loop' ? 'border-l-4 border-l-blue-500' :
                        issue.type === 'delay' ? 'border-l-4 border-l-yellow-500' :
                        'border-l-4 border-l-purple-500'
                      }`}
                      onClick={() => handleWarningClick(activeDocument, {
                        id: issue.id,
                        text: issue.description,
                        implementationDetails: {
                          section: issue.suggestedAction.document,
                          action: issue.suggestedAction.action
                        }
                      })}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{issue.title}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          issue.type === 'trap' ? 'bg-red-100 text-red-800' :
                          issue.type === 'opportunity' ? 'bg-green-100 text-green-800' :
                          issue.type === 'feedback_loop' ? 'bg-blue-100 text-blue-800' :
                          issue.type === 'delay' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {issue.type.replace('_', ' ')}
                        </span>
                </div>
                      <p className="text-sm text-gray-600">{issue.description}</p>
              </div>
                  ))
                ) : (
                  <p className="p-3 text-sm text-gray-500">No systemic issues detected</p>
                )}
              </div>
            </div>

            {/* Improvement Suggestions */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Improvement Suggestions</h3>
              <div className="bg-white rounded-lg shadow">
                {claudeResponses
                  .filter(response => response.suggestion && !response.suggestion.text.includes('inconsistency'))
                  .map(response => (
                    <div
                      key={response.suggestion!.id}
                      className={`p-3 border-b last:border-b-0 ${
                        implementedSuggestions.includes(response.suggestion!.id)
                          ? 'bg-green-50'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <p className="text-sm mb-2">{response.suggestion!.text}</p>
                      <p className="text-xs text-gray-600 mb-2">
                        Section: {response.suggestion!.implementationDetails.section}
                      </p>
                      {!implementedSuggestions.includes(response.suggestion!.id) && (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleSuggestionClick(response.suggestion!.id)}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => setImplementedSuggestions(prev => [...prev, response.suggestion!.id])}
                            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                          >
                            Reject
                          </button>
            </div>
                      )}
          </div>
                  ))}
                {claudeResponses.filter(response => response.suggestion && !response.suggestion.text.includes('inconsistency')).length === 0 && (
                  <p className="p-3 text-sm text-gray-500">No improvement suggestions yet</p>
                )}
              </div>
            </div>

            {/* Document Inconsistencies */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Document Inconsistencies</h3>
              <div className="bg-white rounded-lg shadow">
                {inconsistencies[activeDocument]?.length > 0 ? (
                  inconsistencies[activeDocument].map((inconsistency: Inconsistency) => (
                    <div
                key={inconsistency.id} 
                      className="p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleWarningClick(activeDocument, inconsistency)}
                    >
                      <p className="text-sm">{inconsistency.text}</p>
                      <p className="text-xs text-red-600 mt-1">
                        {inconsistency.implementationDetails.section} → {inconsistency.implementationDetails.action}
                      </p>
          </div>
                  ))
                ) : (
                  <p className="p-3 text-sm text-gray-500">No inconsistencies found</p>
                )}
              </div>
          </div>
        </div>
        
          {/* Fixed AI Response Window at bottom */}
          <div className="border-t border-gray-200 bg-white">
            <div className="p-3 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold">AI Response</h3>
          </div>
            <div className="h-64 overflow-y-auto p-3">
              {claudeResponses.map(response => (
                <div key={response.id} className="mb-3 last:mb-0 text-left">
                  <p className="text-sm whitespace-pre-wrap">{response.response}</p>
                </div>
              ))}
              {promptStage === 'pending' && (
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              )}
              {claudeResponses.length === 0 && promptStage !== 'pending' && (
                <p className="text-sm text-gray-500 text-left">Click on an item above to get AI assistance</p>
              )}
            </div>
            {/* Chat input area */}
            <div className="p-3 border-t border-gray-200">
              <div className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask for clarification..."
                  className="flex-1 px-3 py-2 border rounded text-sm"
            />
            <button 
                  onClick={() => {/* Handle chat submit */}}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Send
            </button>
        </div>
      </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showIntegrationModal && (
        <IntegrationModal 
          onClose={() => setShowIntegrationModal(false)}
          onShowSettings={() => {
            setShowIntegrationModal(false);
            handleOpenSettings();
          }}
          storageDirectory={storageDirectory}
        />
      )}
      
      {showSettingsModal && (
        <SettingsModal 
          key={`settings-modal-${modalRefreshKey}`}
          storageDirectory={storageDirectory}
          onSave={handleSaveSettings}
          onClose={() => setShowSettingsModal(false)}
          fileCount={isClient ? Object.keys(JSON.parse(localStorage.getItem('neoFileSystem') || '{}'))
            .filter(path => {
              const cleanPath = path.replace(/^\/+|\/+$/g, '');
              const cleanStorageDir = storageDirectory ? storageDirectory.replace(/^\/+|\/+$/g, '') : '';
              
              if (!cleanStorageDir) {
                return !cleanPath.includes('/');
              }
              
              return cleanPath.startsWith(cleanStorageDir + '/') && 
                !cleanPath.slice(cleanStorageDir.length + 1).includes('/');
            }).length : 0}
        />
      )}
      
      {showFileManagerModal && (
        <FileManagerModal 
          isOpen={showFileManagerModal}
          onFileSelect={handleFileSelect}
          storageDirectory={storageDirectory}
          isClient={isClient}
          onClose={() => setShowFileManagerModal(false)}
          onFileAction={(message) => {
            setSuccessMessage(message);
          }}
          onDirectoryChange={handleDirectoryChange}
        />
      )}
      
      {showLoginModal && (
        <LoginModal 
          loginEmail={loginEmail}
          setLoginEmail={setLoginEmail}
          loginPassword={loginPassword}
          setLoginPassword={setLoginPassword}
          isLoading={isLoading}
          onLogin={loginUser}
          onClose={() => setShowLoginModal(false)}
        />
      )}
      
      <FileSetupModal
        isOpen={showFileSetup}
        onClose={() => {
          console.log('File setup modal closed');
          setShowFileSetup(false);
        }}
        onSetupComplete={handleFileSetupComplete}
      />
    </div>
  );
};

export default NEOStrategyPlatform;