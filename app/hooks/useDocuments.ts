// useDocuments.ts
import { useState, useEffect, ReactNode } from 'react';
import { DatabaseService } from '../services/DatabaseService';
import { User } from './useAuth';

export interface DocumentContent {
  [key: string]: ReactNode;
}

export interface InconsistencyCount {
  [key: string]: number;
}

export interface DocumentState {
  activeDocument: string;
  documentContent: DocumentContent;
  inconsistencyCount: InconsistencyCount;
  isSyncing: boolean;
  lastSyncedAt: Date | null;
  hasDocuments: boolean;
}

export interface DocumentActions {
  setActiveDocument: (document: string) => void;
  updateDocumentContent: (document: string, content: ReactNode) => void;
  updateInconsistencyCount: (document: string, count: number) => void;
  saveDocumentChanges: (documentType: string, htmlContent: string, rawContent: any) => Promise<void>;
  recordImplementedSuggestion: (suggestionId: string, documentType: string) => Promise<void>;
}

export const useDocuments = (
  db: DatabaseService | null, 
  user: User | null, 
  projectId: string,
  setSuccessMessage: (message: string | null) => void
): [DocumentState, DocumentActions] => {
  // State for document management
  const [activeDocument, setActiveDocument] = useState<string>('Strategy');
  const [documentContent, setDocumentContent] = useState<DocumentContent>({
    Canvas: <div className="p-4">Loading Canvas...</div>,
    Strategy: <div className="p-4">Loading Strategy...</div>,
    'Financial Projection': <div className="p-4">Loading Financial Projection...</div>,
    OKRs: <div className="p-4">Loading OKRs...</div>
  });
  
  const [inconsistencyCount, setInconsistencyCount] = useState<InconsistencyCount>({
    'Canvas': 0,
    'Strategy': 1,
    'Financial Projection': 0,
    'OKRs': 2
  });
  
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [hasDocuments, setHasDocuments] = useState<boolean>(false);
  
  // Effect to initialize default document content
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Set initial document content
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
  }, []);
  
  // Effect to load project documents when projectId changes
  useEffect(() => {
    if (projectId !== 'default-project' && db) {
      loadProjectDocuments();
    }
  }, [projectId, db]);
  
  // Load project documents
  const loadProjectDocuments = async () => {
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
  
  // Update document content
  const updateDocumentContent = (document: string, content: ReactNode) => {
    setDocumentContent(prevContent => ({
      ...prevContent,
      [document]: content
    }));
  };
  
  // Update inconsistency count
  const updateInconsistencyCount = (document: string, count: number) => {
    setInconsistencyCount(prevCount => ({
      ...prevCount,
      [document]: count
    }));
  };
  
  // Save document changes to database
  const saveDocumentChanges = async (documentType: string, htmlContent: string, rawContent: any) => {
    if (!user || projectId === 'default-project' || !db || typeof window === 'undefined') return;
    
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
      
      // Set hasDocuments to true since we now have at least one document
      setHasDocuments(true);
    } catch (error) {
      console.error("Error saving document:", error);
      setSuccessMessage(`Error: ${error}`);
    } finally {
      setIsSyncing(false);
    }
  };
  
  // Record an implemented suggestion
  const recordImplementedSuggestion = async (suggestionId: string, documentType: string) => {
    if (!user || projectId === 'default-project' || !db || typeof window === 'undefined') return;
    
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
  
  return [
    { 
      activeDocument, 
      documentContent, 
      inconsistencyCount, 
      isSyncing, 
      lastSyncedAt, 
      hasDocuments 
    },
    { 
      setActiveDocument, 
      updateDocumentContent, 
      updateInconsistencyCount, 
      saveDocumentChanges, 
      recordImplementedSuggestion 
    }
  ];
};