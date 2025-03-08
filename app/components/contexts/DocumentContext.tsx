import React, { createContext, useContext, useState, useEffect } from 'react';
import { databaseService, DocumentData } from '../services/DatabaseService';
import { useAuth } from './AuthContext';

interface DocumentContextType {
  activeDocument: string;
  setActiveDocument: (doc: string) => void;
  projectId: string;
  setProjectId: (id: string) => void;
  projectList: any[];
  loadProjects: (userId: string) => Promise<void>;
  documentContent: Record<string, React.ReactNode>;
  setDocumentContent: React.Dispatch<React.SetStateAction<Record<string, React.ReactNode>>>;
  inconsistencyCount: Record<string, number>;
  setInconsistencyCount: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  isSyncing: boolean;
  setIsSyncing: (syncing: boolean) => void;
  lastSyncedAt: Date | null;
  loadProjectDocuments: (projectId: string) => Promise<void>;
  saveDocumentChanges: (documentType: string, htmlContent: string, rawContent: any) => Promise<void>;
  recordImplementedSuggestion: (suggestionId: string, documentType: string) => Promise<void>;
  hasDocuments: boolean;
}

const DocumentContext = createContext<DocumentContextType>({
  activeDocument: 'Strategy',
  setActiveDocument: () => {},
  projectId: 'default-project',
  setProjectId: () => {},
  projectList: [],
  loadProjects: async () => {},
  documentContent: {},
  setDocumentContent: () => {},
  inconsistencyCount: {},
  setInconsistencyCount: () => {},
  isSyncing: false,
  setIsSyncing: () => {},
  lastSyncedAt: null,
  loadProjectDocuments: async () => {},
  saveDocumentChanges: async () => {},
  recordImplementedSuggestion: async () => {},
  hasDocuments: false,
});

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  // Document state
  const [activeDocument, setActiveDocument] = useState<string>('Strategy');
  const [projectId, setProjectId] = useState<string>('default-project');
  const [projectList, setProjectList] = useState<any[]>([]);
  const [documentContent, setDocumentContent] = useState<Record<string, React.ReactNode>>({});
  const [inconsistencyCount, setInconsistencyCount] = useState<Record<string, number>>({
    'Canvas': 0,
    'Strategy': 1,
    'Financial Projection': 0,
    'OKRs': 2
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [hasDocuments, setHasDocuments] = useState<boolean>(false);

  // Initialize default document content on mount
  useEffect(() => {
    // Initialize default document content
    if (Object.keys(documentContent).length === 0) {
      setDocumentContent({
        Canvas: <div className="p-4">Loading Canvas...</div>,
        Strategy: <div className="p-4">Loading Strategy...</div>,
        'Financial Projection': <div className="p-4">Loading Financial Projection...</div>,
        OKRs: <div className="p-4">Loading OKRs...</div>,
      });
    }
  }, []);

  // Load projects when user changes
  useEffect(() => {
    if (user) {
      loadProjects(user.uid);
    }
  }, [user]);

  // Load project documents when projectId changes
  useEffect(() => {
    if (projectId !== 'default-project') {
      loadProjectDocuments(projectId);
    }
  }, [projectId]);

  // Load user's projects
  const loadProjects = async (userId: string) => {
    if (!userId) return;
    
    try {
      setIsSyncing(true);
      const projects = await databaseService.getProjects(userId);
      setProjectList(projects);
      
      // If we have projects but none selected, select the first one
      if (projects.length > 0 && projectId === 'default-project') {
        setProjectId(projects[0].id);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Load project documents
  const loadProjectDocuments = async (projectId: string) => {
    if (projectId === 'default-project') return;
    
    try {
      setIsSyncing(true);
      const documents = await databaseService.getDocuments(projectId);
      
      // Check if any documents exist with content
      const hasContent = Object.values(documents).some((doc: DocumentData) => 
        doc.content && Object.keys(doc.content).length > 0
      );
      
      setHasDocuments(hasContent);
      
      // Create document content and update inconsistency counts
      const documentMap: Record<string, React.ReactNode> = {};
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
      Object.entries(documents).forEach(([docType, docData]: [string, DocumentData]) => {
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
    } catch (error) {
      console.error("Error loading documents:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  // Save document changes
  const saveDocumentChanges = async (documentType: string, htmlContent: string, rawContent: any) => {
    if (!user || projectId === 'default-project') return;
    
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
      
      await databaseService.saveDocument(projectId, dbType, content);
      
      setLastSyncedAt(new Date());
      
      // Mark that we have documents
      setHasDocuments(true);
    } catch (error) {
      console.error("Error saving document:", error);
      throw error;
    } finally {
      setIsSyncing(false);
    }
  };

  // Record an implemented suggestion
  const recordImplementedSuggestion = async (suggestionId: string, documentType: string) => {
    if (!user || projectId === 'default-project') return;
    
    try {
      // Map UI document names to DB document types
      const docTypeMap: {[key: string]: string} = {
        'Canvas': 'canvas',
        'Strategy': 'strategy',
        'Financial Projection': 'financial',
        'OKRs': 'okrs'
      };
      
      const dbType = docTypeMap[documentType];
      await databaseService.recordImplementedSuggestion(projectId, dbType, suggestionId);
    } catch (error) {
      console.error("Error recording implemented suggestion:", error);
    }
  };

  return (
    <DocumentContext.Provider
      value={{
        activeDocument,
        setActiveDocument,
        projectId,
        setProjectId,
        projectList,
        loadProjects,
        documentContent,
        setDocumentContent,
        inconsistencyCount,
        setInconsistencyCount,
        isSyncing,
        setIsSyncing,
        lastSyncedAt,
        loadProjectDocuments,
        saveDocumentChanges,
        recordImplementedSuggestion,
        hasDocuments,
      }}
    >
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocuments = () => useContext(DocumentContext);