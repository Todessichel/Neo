'use client'
import React, { useState, useEffect } from 'react';
import LoginModal from './LoginModal';
import SettingsModal from './SettingsModal';
import FileManagerModal from './FileManagerModal';
import IntegrationModal from './IntegrationModal';
import { DatabaseService } from './services/DatabaseService';
import { User } from './types/userTypes';
import { Project } from './types/projectTypes';
import { ClaudeResponse } from './types/aiTypes';


// Note: In a real app, you'd need to install these packages
// npm install papaparse xlsx mammoth
// npm install --save-dev @types/papaparse @types/react @types/node

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
  const [activeDocument, setActiveDocument] = useState('Strategy');
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
  
  // Count of inconsistencies per document as state
  const [inconsistencyCount, setInconsistencyCount] = useState({
    'Canvas': 0,
    'Strategy': 1,
    'Financial Projection': 0,
    'OKRs': 2
  });

  // Initialize db as state
  const [db, setDb] = useState<DatabaseService | null>(null);
  
  // Initialize default document content
  const [documentContent, setDocumentContent] = useState({
    Canvas: <div className="p-4">Loading Canvas...</div>,
    Strategy: <div className="p-4">Loading Strategy...</div>,
    'Financial Projection': <div className="p-4">Loading Financial Projection...</div>,
    OKRs: <div className="p-4">Loading OKRs...</div>
  });

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
      const counts = {
        'Canvas': 1,
        'Strategy': 1,
        'Financial Projection': 2,
        'OKRs': 1
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
          counts[uiDocType] = docData.inconsistencies?.length || 0;
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
      response: "I'll help you create a complete strategy. Let's start with the fundamentals of your business model. Could you tell me about your target customer segments, what pain points you're solving, and what unique value you provide?"
    };
    
    setClaudeResponses([...claudeResponses, welcomeResponse]);
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
      setActiveDocument(internalDocType);
      
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

  // Function to create strategy documents from guided inputs
  const createStrategyDocuments = (inputs: Record<number, string>) => {
    if (!isClient) return;
    
    // Process inputs and create documents
    console.log("Creating strategy documents from inputs:", inputs);
    
    // For example, create a basic Strategy Document
    const strategyContent = (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Strategy Document - Generated</h2>
        <h3 className="text-lg font-semibold mb-2">Vision</h3>
        <p className="mb-4">Custom vision based on user inputs...</p>
        
        <h3 className="text-lg font-semibold mb-2">Mission</h3>
        <p className="mb-4">Custom mission based on user inputs...</p>
        
        <h3 className="text-lg font-semibold mb-2">Business Goals</h3>
        <ul className="list-disc pl-5 mb-4">
          <li>Goal 1 based on user inputs</li>
          <li>Goal 2 based on user inputs</li>
          <li>Goal 3 based on user inputs</li>
        </ul>
      </div>
    );
    
    // Sample OKR Content
    const okrContent = (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">OKRs - Generated</h2>
        
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Objective 1: Generated from user input</h3>
          <p className="italic mb-2">Rationale: Based on strategic direction from step 2.</p>
          <ul className="list-disc pl-5">
            <li>KR1: Specific metric based on user input</li>
            <li>KR2: Specific metric based on user input</li>
            <li>KR3: Specific metric based on user input</li>
          </ul>
        </div>
        
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Objective 2: Generated from user input</h3>
          <p className="italic mb-2">Rationale: Based on financial goals from step 4.</p>
          <ul className="list-disc pl-5">
            <li>KR1: Specific metric based on user input</li>
            <li>KR2: Specific metric based on user input</li>
            <li>KR3: Specific metric based on user input</li>
          </ul>
        </div>
      </div>
    );
    
    // Sample Canvas Content
    const canvasContent = (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Enhanced Strategy Canvas - Generated</h2>
        <h3 className="text-lg font-semibold mb-2">Business Model (Value Creation & Economic Viability)</h3>
        <div className="mb-4">
          <h4 className="font-medium">Customer Segments</h4>
          <ul className="list-disc pl-5">
            <li>Segment 1 based on user input from step 1</li>
            <li>Segment 2 based on user input from step 1</li>
          </ul>
        </div>
        <div className="mb-4">
          <h4 className="font-medium">Value Proposition</h4>
          <ul className="list-disc pl-5">
            <li>Value proposition based on user input from step 1</li>
            <li>Additional value proposition based on analysis</li>
          </ul>
        </div>
        <div className="mb-4">
          <h4 className="font-medium">Revenue Model</h4>
          <ul className="list-disc pl-5">
            <li>Revenue stream based on user input from step 4</li>
            <li>Additional revenue opportunities identified</li>
          </ul>
        </div>
      </div>
    );
    
    // Sample Financial Projection
    const financialContent = (
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Financial Projection - Generated</h2>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Revenue Forecasts</h3>
          <p>Based on financial goals from step 4 inputs</p>
          <table className="min-w-full border mt-2">
            <thead>
              <tr>
                <th className="border p-2">Scenario</th>
                <th className="border p-2">Year 1</th>
                <th className="border p-2">Year 2</th>
                <th className="border p-2">Year 3</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border p-2">Optimistic</td>
                <td className="border p-2">€XXX,XXX</td>
                <td className="border p-2">€XXX,XXX</td>
                <td className="border p-2">€XXX,XXX</td>
              </tr>
              <tr>
                <td className="border p-2">Expected</td>
                <td className="border p-2">€XXX,XXX</td>
                <td className="border p-2">€XXX,XXX</td>
                <td className="border p-2">€XXX,XXX</td>
              </tr>
              <tr>
                <td className="border p-2">Conservative</td>
                <td className="border p-2">€XXX,XXX</td>
                <td className="border p-2">€XXX,XXX</td>
                <td className="border p-2">€XXX,XXX</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Cost Structure</h3>
          <p>Derived from business model in step 1</p>
        </div>
      </div>
    );
    
    // Update document content
    setDocumentContent({
      'Strategy': strategyContent,
      'OKRs': okrContent,
      'Canvas': canvasContent,
      'Financial Projection': financialContent
    });
    
    // Set hasDocuments to true
    setHasDocuments(true);
    
    // Add confirmation response
    const completionResponse = {
      id: claudeResponses.length + 1,
      response: "I've created your strategy documents! You can view and edit them using the tabs on the left. I've also identified some potential improvements and inconsistencies that you might want to address to strengthen your strategy."
    };
    
    setClaudeResponses([...claudeResponses, completionResponse]);
    
    // Add some sample inconsistencies
    setInconsistencyCount({
      'Canvas': 1,
      'Strategy': 1,
      'Financial Projection': 1,
      'OKRs': 2
    });
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
        case 1: // Business Model Fundamentals
          nextResponse = "Great! Now let's talk about your strategic approach. Would you prefer a conservative approach prioritizing stability and consistent profitability, a moderate approach balancing growth with risk management, or an aggressive approach emphasizing faster growth with higher risk?";
          break;
        case 2: // Strategic Direction
          nextResponse = "I'll create a strategy document based on your approach. Now let's define some key objectives and results. What are the 3-5 most important goals you want to achieve in the next year?";
          break;
        case 3: // OKR Development
          nextResponse = "Now let's set some financial goals. What are your targets for revenue, profit margin, and investment capacity? Please provide ranges for optimistic, expected, and pessimistic scenarios.";
          break;
        case 4: // Financial Goals
          // Final step - generate documents
          nextResponse = "Thank you! I'm now generating your complete set of strategy documents based on all your inputs. This includes an Enhanced Strategy Canvas, Strategy Document, OKRs, and Financial Projections - all aligned and coherent with each other.";
          
          // Here you would actually generate the documents based on collected inputs
          setTimeout(() => {
            createStrategyDocuments(updatedInputs);
          }, 2000);
          break;
      }
      
      // Update state
      setGuidedStrategyState({
        active: nextStep <= 4, // Only active for steps 1-4
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



  // Render the component
  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-100">
    {/* Top Bar for Auth Status */}
    {user && (
      <div className="absolute top-0 left-0 right-0 bg-blue-600 text-white p-2 flex justify-between items-center z-10">
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
    
      {/* Left Sidebar */}
      <div className="w-64 bg-gray-200 p-4">
        <h2 className="text-xl font-bold mb-4">Project Files</h2>
        <div className="space-y-2">
          {['Canvas', 'Strategy', 'Financial Projection', 'OKRs'].map((doc) => (
            <div 
              key={doc} 
              className={`p-2 rounded cursor-pointer flex justify-between items-center ${activeDocument === doc ? 'bg-blue-100 font-semibold' : 'bg-gray-300 hover:bg-gray-400'}`}
              onClick={() => setActiveDocument(doc)}
            >
              <span>{doc}</span>
              {inconsistencyCount[doc] > 0 ? (
                <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {inconsistencyCount[doc]}
                </span>
              ) : (
                <span className="bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  0
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-8 space-y-2">
          <button 
            className="w-full bg-blue-500 text-white p-2 rounded flex items-center justify-center"
            onClick={() => setShowIntegrationModal(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            Import/Export
          </button>
          
          <button 
            className="w-full bg-green-500 text-white p-2 rounded flex items-center justify-center"
            onClick={() => setShowFileManagerModal(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z" clipRule="evenodd" />
              <path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H2h2a2 2 0 002-2v-2z" />
            </svg>
            File Manager
          </button>
          
          <button 
            className="w-full bg-purple-500 text-white p-2 rounded flex items-center justify-center"
            onClick={() => setShowSettingsModal(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            Settings
          </button>
          
          {!user && (
            <button 
              className="w-full bg-indigo-500 text-white p-2 rounded flex items-center justify-center"
              onClick={() => setShowLoginModal(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
              </svg>
              Sign In
            </button>
          )}
          
          {!hasDocuments && !guidedStrategyState.active && (
            <button 
              className="w-full bg-yellow-500 text-white p-2 rounded flex items-center justify-center mt-4"
              onClick={startAIGuidedStrategy}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              AI-Guided Strategy
            </button>
          )}
          
          {user && projectList.length > 0 && (
            <div className="mt-4">
              <label className="block mb-1 font-medium text-sm">Select Project</label>
              <select 
                className="w-full p-2 border rounded"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
              >
                {projectList.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
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
          {documentContent[activeDocument]}
        </div>
        
        {/* Prompt to Claude - shows when a suggestion is clicked */}
        {promptStage !== 'idle' && (
          <div className={`mx-4 mb-2 p-3 border rounded ${promptStage === 'pending' ? 'bg-yellow-50 border-yellow-200' : 'bg-blue-50 border-blue-200'}`}>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a7 7 0 100 14 7 7 0 000-14zm0 1a6 6 0 100 12 6 6 0 000-12z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M10 11a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="font-semibold">Prompt to Claude</h3>
              </div>
              <div className="text-sm font-medium">
                {promptStage === 'pending' ? 'Processing...' : 'Completed'}
              </div>
            </div>
            <div className="bg-white p-2 rounded border border-gray-200 font-mono text-sm overflow-x-auto">
              {claudePrompt}
            </div>
          </div>
        )}
        
        {/* Claude AI Response Box */}
        <div className="mx-4 mb-2 p-4 bg-purple-50 border border-purple-200 rounded shadow">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold mr-2">C</div>
            <h3 className="font-semibold">Claude AI</h3>
          </div>
          <div className="max-h-32 overflow-y-auto">
            {claudeResponses.length > 0 && (
              <p>{claudeResponses[claudeResponses.length - 1].response}</p>
            )}
          </div>
        </div>
        
        {/* Chat Interface */}
        <div className="p-4 pt-0">
          <form onSubmit={handleSubmit} className="flex">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={guidedStrategyState.active ? `Tell me about step ${guidedStrategyState.step}...` : "Ask Claude about your strategy..."}
              className="flex-1 p-2 border rounded-l"
            />
            <button 
              type="submit" 
              className="bg-blue-500 text-white px-4 rounded-r"
            >
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-64 bg-gray-200 p-4 flex flex-col">
        <div className="flex-1 bg-white p-3 rounded mb-4 overflow-auto">
          {successMessage && (
            <div className="mb-3 p-2 bg-green-100 text-green-800 rounded">
              ✓ {successMessage}
            </div>
          )}
          
          <h3 className="font-bold mb-2">Improvement Suggestions</h3>
          <ul className="list-disc pl-5">
            {improvementSuggestions[activeDocument]?.map(suggestion => (
              <li 
                key={suggestion.id} 
                className={`mb-2 ${implementedSuggestions.includes(suggestion.id) ? 'text-gray-400 line-through' : 'cursor-pointer hover:text-blue-600 hover:bg-blue-50 p-1 rounded'}`}
                onClick={() => !implementedSuggestions.includes(suggestion.id) && implementSuggestion(suggestion)}
              >
                {suggestion.text}
              </li>
            ))}
            {improvementSuggestions[activeDocument]?.length === 0 && (
              <li className="text-gray-500 italic">No suggestions yet</li>
            )}
          </ul>

          <h3 className="font-bold mt-4 mb-2">Inconsistencies</h3>
          <ul className="list-disc pl-5">
            {inconsistencies[activeDocument]?.map(inconsistency => (
              <li 
                key={inconsistency.id} 
                className={`mb-2 ${implementedSuggestions.includes(inconsistency.id) ? 'text-gray-400 line-through' : 'cursor-pointer hover:text-blue-600 hover:bg-blue-50 p-1 rounded'}`}
                onClick={() => !implementedSuggestions.includes(inconsistency.id) && implementSuggestion(inconsistency)}
              >
                {inconsistency.text}
              </li>
            ))}
            {inconsistencyCount[activeDocument] === 0 && (
              <li className="text-green-500">No inconsistencies detected</li>
            )}
          </ul>
          
          {/* Systems Thinking Analysis */}
          <h3 className="font-bold mt-4 mb-2">Systems Analysis</h3>
          <div className="text-sm">
            <p className="mb-2">Key feedback loops identified:</p>
            <ul className="list-disc pl-5 mb-3">
              <li className="text-green-600">Revenue Growth Loop (reinforcing)</li>
              <li className="text-red-600">Potential Burnout Loop (reinforcing)</li>
              <li className="text-blue-600">Customer Retention Balance</li>
            </ul>
            <p className="mb-1">High-leverage points:</p>
            <ul className="list-disc pl-5">
              <li>Improving customer acquisition channels</li>
              <li>Focus on retention vs acquisition balance</li>
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