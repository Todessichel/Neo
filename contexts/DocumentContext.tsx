import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

// Define the document types
export type DocumentType = 'Canvas' | 'Strategy' | 'Financial Projection' | 'OKRs';

// Define the document interface
interface Document {
  type: DocumentType;
  content: any; // This could be more specifically typed based on document structure
  html?: string;
  lastModified: Date;
  inconsistencies?: Array<any>;
  suggestions?: Array<any>;
}

// Define the documents state
interface DocumentsState {
  [key: string]: Document | React.ReactNode;
}

// Define the context type
interface DocumentContextType {
  documents: DocumentsState;
  activeDocument: DocumentType;
  setActiveDocument: React.Dispatch<React.SetStateAction<DocumentType>>;
  lastSyncedAt: Date | null;
  isSyncing: boolean;
  hasDocuments: boolean;
  loadProjectDocuments: (projectId: string) => Promise<void>;
  saveDocumentChanges: (documentType: DocumentType, htmlContent: string, rawContent: any) => Promise<void>;
  createDocument: (documentType: DocumentType, content: any) => Promise<void>;
  updateDocument: (documentType: DocumentType, content: any) => Promise<void>;
  deleteDocument: (documentType: DocumentType) => Promise<void>;
  exportDocument: (documentType: DocumentType, format: string) => Promise<Blob>;
  importDocument: (documentType: DocumentType, file: File) => Promise<void>;
  projectId: string;
  setProjectId: React.Dispatch<React.SetStateAction<string>>;
  projectList: Array<any>;
  setProjectList: React.Dispatch<React.SetStateAction<Array<any>>>;
}

// Create the context with a default undefined value
export const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

// Props for the provider component
interface DocumentProviderProps {
  children: ReactNode;
}

export const DocumentProvider: React.FC<DocumentProviderProps> = ({ children }) => {
  // Get auth context to check if user is logged in
  const { user } = useAuth();
  
  // State for documents
  const [documents, setDocuments] = useState<DocumentsState>({
    Canvas: <div className="p-4">Loading Canvas...</div>,
    Strategy: <div className="p-4">Loading Strategy...</div>,
    'Financial Projection': <div className="p-4">Loading Financial Projection...</div>,
    OKRs: <div className="p-4">Loading OKRs...</div>
  });
  
  // State for active document
  const [activeDocument, setActiveDocument] = useState<DocumentType>('Strategy');
  
  // State for last synced time
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  
  // State for syncing indicator
  const [isSyncing, setIsSyncing] = useState(false);
  
  // State for whether documents exist
  const [hasDocuments, setHasDocuments] = useState(false);
  
  // State for project ID
  const [projectId, setProjectId] = useState('default-project');
  
  // State for project list
  const [projectList, setProjectList] = useState<Array<any>>([]);
  
  // Initialize default document content on client-side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDocuments({
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
      
      // Set hasDocuments to true since we added default content
      setHasDocuments(true);
    }
  }, []);
  
  // Effect to load project documents when projectId changes
  useEffect(() => {
    if (projectId !== 'default-project') {
      loadProjectDocuments(projectId);
    }
  }, [projectId]);
  
  /**
   * Load documents for a specific project
   */
  const loadProjectDocuments = async (projectId: string): Promise<void> => {
    if (projectId === 'default-project') return;
    
    try {
      setIsSyncing(true);
      
      // In a real app, this would be an API call to your database
      // For now, simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate loading project documents
      // In a real app, you would have a backend service
      const db = new DatabaseService();
      const documents = await db.getDocuments(projectId);
      
      // Check if any documents exist with content
      const hasContent = Object.values(documents).some((doc: any) => 
        doc.content && Object.keys(doc.content).length > 0
      );
      
      setHasDocuments(hasContent);
      
      // Create document content and update state
      const documentMap: DocumentsState = {};
      
      // Map DB document types to UI document names
      const docTypeMap: {[key: string]: DocumentType} = {
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
        }
      });
      
      // Only update if we found some documents
      if (Object.keys(documentMap).length > 0) {
        setDocuments(prevDocuments => ({
          ...prevDocuments,
          ...documentMap
        }));
      }
      
      setLastSyncedAt(new Date());
    } catch (error) {
      console.error('Error loading project documents:', error);
    } finally {
      setIsSyncing(false);
    }
  };
  
  /**
   * Save document changes to the database
   */
  const saveDocumentChanges = async (
    documentType: DocumentType, 
    htmlContent: string, 
    rawContent: any
  ): Promise<void> => {
    if (!user || projectId === 'default-project') {
      throw new Error('User must be logged in and a project must be selected');
    }
    
    try {
      setIsSyncing(true);
      
      // Map UI document names to DB document types
      const docTypeMap: {[key in DocumentType]: string} = {
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
      
      // In a real app, this would be an API call to your database
      const db = new DatabaseService();
      await db.saveDocument(projectId, dbType, content);
      
      setLastSyncedAt(new Date());
      
      // Update the local document state
      setDocuments(prevDocuments => ({
        ...prevDocuments,
        [documentType]: (
          <div className="p-4">
            <h2 className="text-xl font-bold mb-4">{documentType} - NEO</h2>
            <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
          </div>
        )
      }));
    } catch (error) {
      console.error('Error saving document changes:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };
  
  /**
   * Create a new document
   */
  const createDocument = async (documentType: DocumentType, content: any): Promise<void> => {
    if (!user || projectId === 'default-project') {
      throw new Error('User must be logged in and a project must be selected');
    }
    
    try {
      setIsSyncing(true);
      
      // Format content as HTML
      const htmlContent = formatContentToHtml(documentType, content);
      
      // Save to database
      await saveDocumentChanges(documentType, htmlContent, content);
      
      setHasDocuments(true);
    } catch (error) {
      console.error('Error creating document:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };
  
  /**
   * Update an existing document
   */
  const updateDocument = async (documentType: DocumentType, content: any): Promise<void> => {
    if (!user || projectId === 'default-project') {
      throw new Error('User must be logged in and a project must be selected');
    }
    
    try {
      setIsSyncing(true);
      
      // Format content as HTML
      const htmlContent = formatContentToHtml(documentType, content);
      
      // Save to database
      await saveDocumentChanges(documentType, htmlContent, content);
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };
  
  /**
   * Delete a document
   */
  const deleteDocument = async (documentType: DocumentType): Promise<void> => {
    if (!user || projectId === 'default-project') {
      throw new Error('User must be logged in and a project must be selected');
    }
    
    try {
      setIsSyncing(true);
      
      // Map UI document names to DB document types
      const docTypeMap: {[key in DocumentType]: string} = {
        'Canvas': 'canvas',
        'Strategy': 'strategy',
        'Financial Projection': 'financial',
        'OKRs': 'okrs'
      };
      
      const dbType = docTypeMap[documentType];
      
      // In a real app, this would be an API call to your database
      const db = new DatabaseService();
      await db.deleteDocument(projectId, dbType);
      
      // Reset the document in state
      setDocuments(prevDocuments => ({
        ...prevDocuments,
        [documentType]: <div className="p-4">No {documentType} document exists. Create one to get started.</div>
      }));
      
      setLastSyncedAt(new Date());
      
      // Check if any documents still exist
      const remainingDocs = Object.keys(documents).filter(
        key => key !== documentType && typeof documents[key] !== 'string'
      );
      
      setHasDocuments(remainingDocs.length > 0);
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };
  
  /**
   * Export a document to a specific format
   */
  const exportDocument = async (documentType: DocumentType, format: string): Promise<Blob> => {
    try {
      setIsSyncing(true);
      
      // In a real app, this would convert the document to the requested format
      // For now, just create a simple HTML blob
      
      // Get the document content
      const doc = documents[documentType];
      let content = '';
      
      if (React.isValidElement(doc)) {
        // This is a simplified approach, in a real app you'd use a proper HTML serializer
        content = `<html><body>${doc}</body></html>`;
      } else {
        content = JSON.stringify(doc);
      }
      
      // Create a blob with the content
      const blob = new Blob([content], { type: 'text/html' });
      
      return blob;
    } catch (error) {
      console.error('Error exporting document:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };
  
  /**
   * Import a document from a file
   */
  const importDocument = async (documentType: DocumentType, file: File): Promise<void> => {
    try {
      setIsSyncing(true);
      
      // In a real app, this would parse the file and convert it to the right format
      // For now, just read the file content and create a placeholder
      
      const content = await file.text();
      const placeholderContent = {
        title: `Imported ${documentType}`,
        content: content.substring(0, 100) + '...' // Truncate for simplicity
      };
      
      // Create HTML for the imported document
      const htmlContent = `
        <div>
          <h2>${placeholderContent.title}</h2>
          <p>Imported from ${file.name}</p>
          <pre>${placeholderContent.content}</pre>
        </div>
      `;
      
      // Save the imported document
      await saveDocumentChanges(documentType, htmlContent, placeholderContent);
      
      setHasDocuments(true);
    } catch (error) {
      console.error('Error importing document:', error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };
  
  /**
   * Format content object to HTML based on document type
   * This is a simplified version - a real app would have more robust formatting
   */
  const formatContentToHtml = (documentType: DocumentType, content: any): string => {
    let html = '';
    
    switch(documentType) {
      case 'Canvas':
        html = `
          <h2 class="text-xl font-bold mb-4">Enhanced Strategy Canvas</h2>
          <h3 class="text-lg font-semibold mb-2">Business Model</h3>
          ${content.customerSegments ? `
            <div class="mb-4">
              <h4 class="font-medium">Customer Segments</h4>
              <ul class="list-disc pl-5">
                ${content.customerSegments.map((segment: string) => `<li>${segment}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${content.valueProposition ? `
            <div class="mb-4">
              <h4 class="font-medium">Value Proposition</h4>
              <ul class="list-disc pl-5">
                ${content.valueProposition.map((value: string) => `<li>${value}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        `;
        break;
        
      case 'Strategy':
        html = `
          <h2 class="text-xl font-bold mb-4">Strategy Document</h2>
          ${content.vision ? `
            <h3 class="text-lg font-semibold mb-2">Vision</h3>
            <p class="mb-4">${content.vision}</p>
          ` : ''}
          ${content.mission ? `
            <h3 class="text-lg font-semibold mb-2">Mission</h3>
            <p class="mb-4">${content.mission}</p>
          ` : ''}
          ${content.businessGoals && content.businessGoals.length ? `
            <h3 class="text-lg font-semibold mb-2">Business Goals</h3>
            <ul class="list-disc pl-5 mb-4">
              ${content.businessGoals.map((goal: string) => `<li>${goal}</li>`).join('')}
            </ul>
          ` : ''}
        `;
        break;
        
      case 'Financial Projection':
        html = `
          <h2 class="text-xl font-bold mb-4">Financial Projection</h2>
          ${content.revenueStreams ? `
            <div class="mb-4">
              <h3 class="text-lg font-semibold mb-2">Revenue Streams</h3>
              <table class="min-w-full border">
                <thead>
                  <tr>
                    <th class="border p-2">Name</th>
                    <th class="border p-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(content.revenueStreams).map(([name, amount]: [string, any]) => `
                    <tr>
                      <td class="border p-2">${name}</td>
                      <td class="border p-2">${amount}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}
        `;
        break;
        
      case 'OKRs':
        html = `
          <h2 class="text-xl font-bold mb-4">OKRs</h2>
          ${content.objectives ? content.objectives.map((objective: any, index: number) => `
            <div class="mb-4">
              <h3 class="text-lg font-semibold mb-2">Objective ${index + 1}: ${objective.title}</h3>
              ${objective.rationale ? `<p class="italic mb-2">Rationale: ${objective.rationale}</p>` : ''}
              <ul class="list-disc pl-5">
                ${objective.keyResults.map((kr: string, krIndex: number) => `
                  <li>KR${krIndex + 1}: ${kr}</li>
                `).join('')}
              </ul>
            </div>
          `).join('') : ''}
        `;
        break;
    }
    
    return html;
  };
  
  // Context value
  const value = {
    documents,
    activeDocument,
    setActiveDocument,
    lastSyncedAt,
    isSyncing,
    hasDocuments,
    loadProjectDocuments,
    saveDocumentChanges,
    createDocument,
    updateDocument,
    deleteDocument,
    exportDocument,
    importDocument,
    projectId,
    setProjectId,
    projectList,
    setProjectList
  };
  
  return (
    <DocumentContext.Provider value={value}>
      {children}
    </DocumentContext.Provider>
  );
};

// Simple DatabaseService class to simulate database operations
class DatabaseService {
  async getDocuments(projectId: string) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (typeof window === 'undefined') {
          resolve({});
          return;
        }
        
        const documents = JSON.parse(localStorage.getItem(`neoDocuments_${projectId}`) || '{}');
        resolve(documents);
      }, 500);
    });
  }
  
  async saveDocument(projectId: string, docType: string, content: any) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (typeof window === 'undefined') {
          resolve(false);
          return;
        }
        
        const documents = JSON.parse(localStorage.getItem(`neoDocuments_${projectId}`) || '{}');
        
        documents[docType] = {
          type: docType,
          content: content,
          lastModified: new Date().toISOString()
        };
        
        localStorage.setItem(`neoDocuments_${projectId}`, JSON.stringify(documents));
        resolve(true);
      }, 500);
    });
  }
  
  async deleteDocument(projectId: string, docType: string) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (typeof window === 'undefined') {
          resolve(false);
          return;
        }
        
        const documents = JSON.parse(localStorage.getItem(`neoDocuments_${projectId}`) || '{}');
        
        if (documents[docType]) {
          delete documents[docType];
          localStorage.setItem(`neoDocuments_${projectId}`, JSON.stringify(documents));
        }
        
        resolve(true);
      }, 500);
    });
  }
}