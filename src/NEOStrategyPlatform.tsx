'use client'
import React, { useState, useEffect, JSX } from 'react';
import LoginModal from './components/modals/LoginModal';
import SettingsModal from './components/modals/SettingsModal';
import FileManagerModal from './components/modals/FileManagerModal';
import IntegrationModal from './components/modals/IntegrationModal';
import { DatabaseService } from './services/DatabaseService';
import { User } from './types/userTypes';
import { Project } from './types/projectTypes';


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

// Inconsistencies based on active document
const inconsistencies: {[key: string]: Array<{id: string, text: string, implementationDetails: {section: string, action: string}}> } = {
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

const NEOStrategyPlatform = () => {
  // Client-side rendering check
  const [isClient, setIsClient] = useState(false);
  
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
  
  // Initialize inconsistency count based on actual inconsistencies
  const [inconsistencyCount, setInconsistencyCount] = useState<Record<DocumentType, number>>({
    'Canvas': inconsistencies['Canvas']?.length || 0,
    'Strategy': inconsistencies['Strategy']?.length || 0,
    'Financial Projection': inconsistencies['Financial Projection']?.length || 0,
    'OKRs': inconsistencies['OKRs']?.length || 0
  });

  // Initialize db as state
  const [db, setDb] = useState<DatabaseService | null>(null);
  
  // Initialize default document content
  const [documentContent, setDocumentContent] = useState<Record<DocumentType, JSX.Element>>({
    Canvas: <div className="p-4">Loading Canvas...</div>,
    Strategy: <div className="p-4">Loading Strategy...</div>,
    'Financial Projection': <div className="p-4">Loading Financial Projection...</div>,
    OKRs: <div className="p-4">Loading OKRs...</div>
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

  // Initialize on client-side only
  useEffect(() => {
    setIsClient(true);
    
    if (typeof window !== 'undefined') {
      // Set up initial Claude response
      setClaudeResponses([{
        id: 1,
        response: "I've analyzed your strategy document and financial projections. There are several areas where the OKRs could be better aligned with your financial goals. Would you like me to suggest specific improvements?"
      }]);
      
      // Get storage directory from localStorage
      setStorageDirectory(localStorage.getItem('neoStorageDirectory') || '');
      
      // Initialize the database
      const database = new DatabaseService();
      database.initializeData();
      setDb(database);
      
      // Initialize proper document content
      setDocumentContent({
        Canvas: (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Enhanced Strategy Canvas - NEO</h2>
            <h3 className="text-lg font-semibold mb-2">Business Model (Value Creation & Economic Viability)</h3>
            <div className="mb-4">
              <h4 className="font-medium">Customer Segments</h4>
              <ul className="list-disc pl-5">
                <li>Early‐ to Growth‐Stage Startups</li>
                <li>SMEs / Mittelstand</li>
                <li>Boutique Consultancies</li>
              </ul>
            </div>
            <div className="mb-4">
              <h4 className="font-medium">Value Proposition</h4>
              <ul className="list-disc pl-5">
                <li>Integrated AI for Strategy, Systems Thinking & Finance</li>
                <li>Minimal Effort, High Impact</li>
                <li>High‐Touch + Self‐Serve</li>
              </ul>
            </div>
          </div>
        ),
        Strategy: (
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
          </div>
        ),
        'Financial Projection': (
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
          </div>
        ),
        OKRs: (
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

  // Convert various file types to JSON
  const convertFileToJson = async (file: File, docType: string): Promise<any> => {
    if (!isClient) return null;
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    try {
      // CSV files
      if (fileExtension === 'csv') {
        return new Promise((resolve, reject) => {
          // @ts-ignore - Papa is imported dynamically
          Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            complete: (results: any) => {
              resolve({
                type: docType,
                format: 'csv',
                fileName: file.name,
                data: results.data,
                meta: results.meta,
                lastModified: new Date().toISOString()
              });
            },
            error: (error: any) => {
              reject(error);
            }
          });
        });
      }
      
      // Excel files
      else if (['xlsx', 'xls'].includes(fileExtension || '')) {
        const arrayBuffer = await file.arrayBuffer();
        // @ts-ignore - XLSX is imported dynamically
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // Convert to JSON
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        // @ts-ignore - XLSX is imported dynamically
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        return {
          type: docType,
          format: 'excel',
          fileName: file.name,
          sheetName: firstSheetName,
          data: data,
          lastModified: new Date().toISOString()
        };
      }
      
      // Word documents
      else if (['docx', 'doc'].includes(fileExtension || '')) {
        const arrayBuffer = await file.arrayBuffer();
        // @ts-ignore - mammoth is imported dynamically
        const result = await mammoth.extractRawText({ arrayBuffer });
        
        return {
          type: docType,
          format: 'word',
          fileName: file.name,
          content: result.value,
          lastModified: new Date().toISOString()
        };
      }
      
      // JSON files
      else if (fileExtension === 'json') {
        const text = await file.text();
        const data = JSON.parse(text);
        
        return {
          type: docType,
          format: 'json',
          fileName: file.name,
          data: data,
          lastModified: new Date().toISOString()
        };
      }
      
      // Text files
      else if (['txt', 'md'].includes(fileExtension || '')) {
        const text = await file.text();
        
        return {
          type: docType,
          format: 'text',
          fileName: file.name,
          content: text,
          lastModified: new Date().toISOString()
        };
      }
      
      // Fallback for other file types
      else {
        const text = await file.text();
        
        return {
          type: docType,
          format: 'unknown',
          fileName: file.name,
          content: text,
          lastModified: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Error converting file to JSON:', error);
      throw error;
    }
  };

  // File upload handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processUploadedFile(files[0]);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processUploadedFile(files[0]);
    }
  };

  // Save JSON to "filesystem" (localStorage for prototype)
  const saveJsonToFileSystem = (jsonData: any, fileName: string) => {
    if (!isClient) return null;
    
    try {
      // Create directory structure if it doesn't exist
      if (!localStorage.getItem('neoFileSystem')) {
        localStorage.setItem('neoFileSystem', JSON.stringify({}));
      }
      
      const fileSystem = JSON.parse(localStorage.getItem('neoFileSystem') || '{}');
      const filePath = `${storageDirectory ? storageDirectory + '/' : ''}${fileName}`;
      
      // Store the file in our simulated filesystem
      fileSystem[filePath] = {
        content: jsonData,
        lastModified: new Date().toISOString()
      };
      
      localStorage.setItem('neoFileSystem', JSON.stringify(fileSystem));
      
      // Also create an actual downloadable file
      const json = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a downloadable link
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return filePath;
    } catch (error) {
      console.error('Error saving JSON to filesystem:', error);
      throw error;
    }
  };

  // Process an uploaded file
  const processUploadedFile = async (file: File) => {
    if (!isClient) return;
    
    try {
      // Get selected document type
      const docTypeSelect = document.querySelector('select') as HTMLSelectElement;
      const docType = docTypeSelect ? docTypeSelect.value : 'Strategy Document';
      
      // Map the UI document type to the internal type
      const docTypeMap: {[key: string]: string} = {
        'Strategy Document': 'Strategy',
        'Canvas': 'Canvas',
        'OKRs': 'OKRs',
        'Financial Projection': 'Financial Projection'
      };
      
      const internalDocType = docTypeMap[docType] || 'Strategy';
      
      // Convert file to JSON
      setSuccessMessage(`Converting ${file.name} to JSON format...`);
      const jsonData = await convertFileToJson(file, internalDocType.toLowerCase());
      
      // Save to filesystem
      setSuccessMessage(`Saving ${file.name} to filesystem...`);
      const filePath = saveJsonToFileSystem(jsonData, `${internalDocType.toLowerCase()}_${file.name}`);
      
      // Create placeholder content for display
      const placeholderContent = (
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">{internalDocType} - Imported from {file.name}</h2>
          <p className="mb-4">File successfully imported and saved to: {filePath}</p>
          <div className="p-4 bg-gray-100 rounded mb-4">
            <p className="font-medium mb-2">File Details:</p>
            <ul className="list-disc pl-5">
              <li><strong>Format:</strong> {jsonData.format}</li>
              <li><strong>Saved as:</strong> {filePath}</li>
              <li><strong>Last Modified:</strong> {new Date().toLocaleString()}</li>
            </ul>
          </div>
          <div className="p-4 bg-gray-100 rounded">
            <p className="font-mono text-sm mb-2">Preview of JSON data:</p>
            <div className="max-h-40 overflow-auto">
              <pre className="font-mono text-xs whitespace-pre-wrap">
                {JSON.stringify(jsonData, null, 2).substring(0, 500)}
                {JSON.stringify(jsonData, null, 2).length > 500 ? '...' : ''}
              </pre>
            </div>
          </div>
        </div>
      );
      
      // Update document content
      setDocumentContent(prevContent => ({
        ...prevContent,
        [internalDocType]: placeholderContent
      }));
      
      // Set hasDocuments to true since we now have at least one document
      setHasDocuments(true);
      
      // Set active document to the one we just imported
      setActiveDocument(internalDocType as DocumentType);
      
      // Show success message
      setSuccessMessage(`Successfully imported ${file.name} as ${internalDocType} and saved to ${filePath}`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Close the modal
      setShowIntegrationModal(false);
    } catch (error) {
      console.error('Error processing file:', error);
      setSuccessMessage(`Error: Failed to process ${file.name}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  // Function to implement suggested changes
  const implementSuggestion = (suggestion: {id: string, text: string, implementationDetails: {section: string, action: string}}) => {
    if (!isClient) return;
    
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
          
          // Update inconsistency count for Strategy
          setInconsistencyCount(prevCount => ({
            ...prevCount,
            'Strategy': Math.max(0, prevCount['Strategy'] - 1)
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

  // Content for improvement suggestions based on active document
  const improvementSuggestions: {[key: string]: Array<{id: string, text: string, implementationDetails: {section: string, action: string}}> } = {
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
  const handleSaveSettings = (directory: string) => {
    if (!isClient) return;
    
    setStorageDirectory(directory);
    localStorage.setItem('neoStorageDirectory', directory);
    setShowSettingsModal(false);
    setSuccessMessage('Settings saved successfully');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Update inconsistency count when suggestions are implemented
  useEffect(() => {
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
  }, [implementedSuggestions, inconsistencies]);

  // Add this function near the top with other function declarations
  const scrollToBottom = () => {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-responses');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100); // Small delay to ensure content is rendered
  };

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
        <div className="w-64 bg-gray-200 p-4 overflow-y-auto flex flex-col">
          <h2 className="text-xl font-bold mb-4">Project Files</h2>
          
          {/* Add the new Guided Strategy button at the top */}
          <button 
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded mb-4 flex items-center justify-center gap-2 transition-colors"
            onClick={startAIGuidedStrategy}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
            Create New Strategy
          </button>
          
          <div className="space-y-2 mb-8">
            {['Canvas', 'Strategy', 'Financial Projection', 'OKRs'].map((doc) => (
              <div 
                key={doc} 
                className={`p-2 rounded cursor-pointer flex justify-between items-center ${activeDocument === doc ? 'bg-blue-100 font-semibold' : 'bg-gray-300 hover:bg-gray-400'}`}
                onClick={() => setActiveDocument(doc as DocumentType)}
              >
                <span>{doc}</span>
                {inconsistencyCount[doc as DocumentType] > 0 ? (
                  <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {inconsistencyCount[doc as DocumentType]}
                  </span>
                ) : (
                  <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    0
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-auto space-y-2">
            <button 
              className="w-full bg-blue-500 text-white p-2 rounded flex items-center justify-center"
              onClick={() => setShowIntegrationModal(true)}
            >
              Import/Export
            </button>
            <button 
              className="w-full bg-green-500 text-white p-2 rounded flex items-center justify-center"
              onClick={() => setShowFileManagerModal(true)}
            >
              File Manager
            </button>
            <button 
              className="w-full bg-purple-500 text-white p-2 rounded flex items-center justify-center"
              onClick={() => setShowSettingsModal(true)}
            >
              Settings
            </button>
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
            {documentContent[activeDocument as DocumentType]}
          </div>

          {/* Chat Responses */}
          <div className="chat-responses max-h-48 overflow-y-auto bg-white m-4 mt-0 mb-2 rounded shadow p-4">
            {claudeResponses.map((response) => (
              <div key={response.id} className="mb-3 last:mb-0">
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-gray-800 whitespace-pre-wrap">{response.response}</p>
                  {response.suggestion && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => implementSuggestion(response.suggestion!)}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Accept
                      </button>
                      <button
                        onClick={() => {
                          // Add to implemented suggestions to hide it
                          setImplementedSuggestions(prev => [...prev, response.suggestion!.id]);
                          // Add rejection response
                          setClaudeResponses(prev => [...prev, {
                            id: prev.length + 1,
                            response: "I understand. Let me know if you'd like to explore other ways to improve the document's consistency."
                          }]);
                        }}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="p-4 pt-0 bg-white m-4 mt-0 rounded shadow">
            <form onSubmit={handleSubmit} className="flex">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={guidedStrategyState.active ? `Tell me about step ${guidedStrategyState.step}...` : "Ask Claude about your strategy..."}
                className="flex-1 p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                type="submit" 
                className="bg-blue-500 text-white px-6 rounded-r hover:bg-blue-600 transition-colors"
              >
                Send
              </button>
            </form>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-64 bg-gray-200 p-4 overflow-y-auto">
          {successMessage && (
            <div className="mb-3 p-2 bg-green-100 text-green-800 rounded">
              ✓ {successMessage}
            </div>
          )}
          
          {/* Systemic Issues Block */}
          <h3 className="font-bold mb-2">Systemic Analysis</h3>
          <div className="bg-white p-3 rounded mb-4">
            {systemicIssues[activeDocument]?.length > 0 ? (
              <ul className="space-y-3">
                {systemicIssues[activeDocument]?.map(issue => (
                  <li 
                    key={issue.id} 
                    className={`${implementedSuggestions.includes(issue.id) ? 'opacity-50' : ''}`}
                  >
                    <div 
                      className={`cursor-pointer rounded-lg border p-2 hover:border-blue-500 transition-colors
                        ${issue.type === 'trap' ? 'border-red-200 bg-red-50' :
                          issue.type === 'opportunity' ? 'border-green-200 bg-green-50' :
                          issue.type === 'feedback_loop' ? 'border-blue-200 bg-blue-50' :
                          issue.type === 'delay' ? 'border-yellow-200 bg-yellow-50' :
                          issue.type === 'hierarchy' ? 'border-purple-200 bg-purple-50' :
                          'border-gray-200 bg-gray-50'}`}
                      onClick={() => {
                        if (!implementedSuggestions.includes(issue.id)) {
                          const systemicResponse = {
                            id: claudeResponses.length + 1,
                            response: `From a systems thinking perspective (channeling Donella Meadows):\n\n"${issue.systemsPerspective}"\n\nI've identified a systemic ${issue.type} in your strategy:\n${issue.description}\n\nTo address this, I suggest:\n- Document to modify: ${issue.suggestedAction.document}\n- Action: ${issue.suggestedAction.action}\n- Rationale: ${issue.suggestedAction.explanation}\n\nWould you like me to implement this systems-informed change to strengthen your strategy?`
                          };
                          setClaudeResponses(prev => {
                            const newResponses = [...prev, systemicResponse];
                            scrollToBottom();
                            return newResponses;
                          });
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <span className={`text-xs px-2 py-1 rounded-full
                          ${issue.type === 'trap' ? 'bg-red-200 text-red-800' :
                            issue.type === 'opportunity' ? 'bg-green-200 text-green-800' :
                            issue.type === 'feedback_loop' ? 'bg-blue-200 text-blue-800' :
                            issue.type === 'delay' ? 'bg-yellow-200 text-yellow-800' :
                            issue.type === 'hierarchy' ? 'bg-purple-200 text-purple-800' :
                            'bg-gray-200 text-gray-800'}`}>
                          {issue.type.replace('_', ' ')}
                        </span>
                      </div>
                      <h4 className="font-medium mt-2">{issue.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{issue.description}</p>
                      {!implementedSuggestions.includes(issue.id) && (
                        <p className="text-xs text-blue-600 mt-2 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          View systems perspective
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm italic">No systemic issues detected in current document</p>
            )}
          </div>
          
          {/* Existing Inconsistencies Block */}
          <h3 className="font-bold mb-2">Document Inconsistencies</h3>
          <div className="bg-white p-3 rounded mb-4">
            {inconsistencies[activeDocument]?.length > 0 ? (
              <ul className="list-disc pl-5">
                {inconsistencies[activeDocument]?.map(inconsistency => (
                  <li 
                    key={inconsistency.id} 
                    className={`mb-2 ${implementedSuggestions.includes(inconsistency.id) ? 'text-gray-400 line-through' : 'cursor-pointer hover:text-blue-600'}`}
                    onClick={() => {
                      if (!implementedSuggestions.includes(inconsistency.id)) {
                        // Add Claude response suggesting the fix
                        const suggestionResponse = {
                          id: claudeResponses.length + 1,
                          response: `I've detected an inconsistency: ${inconsistency.text}\n\nI suggest implementing the following change to resolve this:\n- Document to modify: ${inconsistency.implementationDetails.section}\n- Proposed action: ${inconsistency.implementationDetails.action}\n\nWould you like me to implement this change to maintain consistency across your documents?`,
                          suggestion: inconsistency
                        };
                        setClaudeResponses(prev => {
                          const newResponses = [...prev, suggestionResponse];
                          scrollToBottom();
                          return newResponses;
                        });
                      }
                    }}
                  >
                    <div className="group">
                      <p className={implementedSuggestions.includes(inconsistency.id) ? 'line-through' : 'font-medium'}>
                        {inconsistency.text}
                      </p>
                      {!implementedSuggestions.includes(inconsistency.id) && (
                        <p className="text-sm text-gray-500 mt-1 group-hover:text-blue-500">
                          Click to see suggestion →
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 text-sm italic">No inconsistencies detected in current document</p>
            )}
          </div>
          
          {/* Existing Improvement Suggestions Block */}
          <h3 className="font-bold mb-2">Improvement Suggestions</h3>
          <div className="bg-white p-3 rounded mb-4">
            <ul className="list-disc pl-5">
              {improvementSuggestions[activeDocument]?.map(suggestion => (
                <li 
                  key={suggestion.id} 
                  className={`mb-2 ${implementedSuggestions.includes(suggestion.id) ? 'text-gray-400 line-through' : 'cursor-pointer hover:text-blue-600'}`}
                  onClick={() => !implementedSuggestions.includes(suggestion.id) && implementSuggestion(suggestion)}
                >
                  {suggestion.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showIntegrationModal && (
        <IntegrationModal 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onClose={() => setShowIntegrationModal(false)}
          storageDirectory={storageDirectory}
          onShowSettings={() => {
            setShowIntegrationModal(false);
            setShowSettingsModal(true);
          }}
          onFileSelect={handleFileSelect}
          onFileDrop={handleFileDrop}
        />
      )}
      
      {showSettingsModal && (
        <SettingsModal 
          storageDirectory={storageDirectory}
          onSave={handleSaveSettings}
          onClose={() => setShowSettingsModal(false)}
          fileCount={isClient ? Object.keys(JSON.parse(localStorage.getItem('neoFileSystem') || '{}')).length : 0}
        />
      )}
      
      {showFileManagerModal && (
        <FileManagerModal 
          storageDirectory={storageDirectory}
          isClient={isClient}
          onClose={() => setShowFileManagerModal(false)}
          onFileAction={(message) => {
            setSuccessMessage(message);
            setTimeout(() => setSuccessMessage(null), 3000);
          }}
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
    </div>
  );
};

export default NEOStrategyPlatform;