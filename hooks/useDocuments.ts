'use client'
import { useState, useEffect, useCallback } from 'react';
import { useContext } from 'react';
import { DocumentContext, DocumentType } from '../contexts/DocumentContext';

// Define types for our documents
export type DocumentContent = {
  html: string;
  raw: any;
};

export type Document = {
  id: string;
  type: 'Strategy' | 'Canvas' | 'Financial Projection' | 'OKRs';
  content: DocumentContent;
  lastModified: string;
  inconsistencies?: Array<{
    id: string;
    text: string;
    implementationDetails: {
      section: string;
      action: string;
    };
  }>;
};

type UseDocumentsReturn = {
  documents: Record<string, Document>;
  getDocument: (type: string) => Document | null;
  updateDocument: (type: string, content: DocumentContent) => void;
  saveDocuments: () => void;
  loadDocuments: (projectId: string) => Promise<void>;
  inconsistencyCounts: Record<string, number>;
  activeDocument?: DocumentType;
  setActiveDocument?: React.Dispatch<React.SetStateAction<DocumentType>>;
  lastSyncedAt?: Date | null;
  isSyncing?: boolean;
  hasDocuments?: boolean;
  projectId?: string;
  setProjectId?: React.Dispatch<React.SetStateAction<string>>;
  projectList?: Array<any>;
};

export const useDocuments = (projectId?: string): UseDocumentsReturn => {
  // Local state for documents and inconsistency counts
  const [documents, setDocuments] = useState<Record<string, Document>>({});
  const [inconsistencyCounts, setInconsistencyCounts] = useState<Record<string, number>>({
    'Canvas': 0,
    'Strategy': 0,
    'Financial Projection': 0,
    'OKRs': 0
  });
  
  // Get the document context
  const context = useContext(DocumentContext);

  // Load documents from localStorage or API
  const loadDocuments = useCallback(async (pid: string) => {
    if (!pid || pid === 'default-project') return;
    
    try {
      // If context is available, try to use its loadProjectDocuments function
      if (context) {
        await context.loadProjectDocuments(pid);
      }
      
      // For demo purposes, load from localStorage
      if (typeof window !== 'undefined') {
        const savedDocs = localStorage.getItem(`neoDocuments_${pid}`);
        
        if (savedDocs) {
          const parsedDocs = JSON.parse(savedDocs);
          setDocuments(parsedDocs);
          
          // Update inconsistency counts
          const counts = {
            'Canvas': 0,
            'Strategy': 0,
            'Financial Projection': 0,
            'OKRs': 0
          };
          
          Object.entries(parsedDocs).forEach(([type, doc]: [string, any]) => {
            counts[type] = doc.inconsistencies?.length || 0;
          });
          
          setInconsistencyCounts(counts);
        } else {
          // Initialize with empty documents if none exist
          setDocuments({
            'Canvas': createEmptyDocument('Canvas'),
            'Strategy': createEmptyDocument('Strategy'),
            'Financial Projection': createEmptyDocument('Financial Projection'),
            'OKRs': createEmptyDocument('OKRs')
          });
        }
      }
    } catch (error) {
      console.error("Error loading documents:", error);
    }
  }, [context]);

  // Load documents when projectId changes
  useEffect(() => {
    if (projectId && projectId !== 'default-project') {
      loadDocuments(projectId);
    }
  }, [projectId, loadDocuments]);

  // Create an empty document
  const createEmptyDocument = (type: string): Document => ({
    id: `${type.toLowerCase()}_${Date.now()}`,
    type: type as any,
    content: {
      html: '',
      raw: {}
    },
    lastModified: new Date().toISOString(),
    inconsistencies: []
  });

  // Get a specific document
  const getDocument = (type: string): Document | null => {
    // First check local documents
    if (documents[type]) {
      return documents[type];
    }
    
    // If not found and context is available, try to get from context
    if (context && context.documents[type]) {
      return context.documents[type] as Document;
    }
    
    return null;
  };

  // Update a document
  const updateDocument = (type: string, content: DocumentContent) => {
    // Update local state
    setDocuments(prev => ({
      ...prev,
      [type]: {
        ...(prev[type] || createEmptyDocument(type)),
        content,
        lastModified: new Date().toISOString()
      }
    }));
    
    // If context is available, try to update document in context as well
    if (context) {
      try {
        context.updateDocument(type as DocumentType, content);
      } catch (error) {
        console.error(`Error updating document in context: ${error}`);
      }
    }
  };

  // Save documents to storage
  const saveDocuments = () => {
    if (typeof window !== 'undefined' && projectId && projectId !== 'default-project') {
      localStorage.setItem(`neoDocuments_${projectId}`, JSON.stringify(documents));
    }
    
    // If context is available and has a saveDocumentChanges function, we could use it here
    // But we'd need to iterate through all documents and save each one
  };

  // Combine local state with context values
  return {
    // Local state values
    documents,
    getDocument,
    updateDocument,
    saveDocuments,
    loadDocuments,
    inconsistencyCounts,
    
    // Context values if available
    activeDocument: context?.activeDocument,
    setActiveDocument: context?.setActiveDocument,
    lastSyncedAt: context?.lastSyncedAt,
    isSyncing: context?.isSyncing,
    hasDocuments: context?.hasDocuments,
    projectId: context?.projectId || projectId,
    setProjectId: context?.setProjectId,
    projectList: context?.projectList,
  };
};

export default useDocuments;