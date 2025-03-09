'use client'
import { useState, useEffect, useCallback } from 'react';

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
};

export const useDocuments = (projectId?: string): UseDocumentsReturn => {
  const [documents, setDocuments] = useState<Record<string, Document>>({});
  const [inconsistencyCounts, setInconsistencyCounts] = useState<Record<string, number>>({
    'Canvas': 0,
    'Strategy': 0,
    'Financial Projection': 0,
    'OKRs': 0
  });

  // Load documents from localStorage or API
  const loadDocuments = useCallback(async (pid: string) => {
    if (!pid || pid === 'default-project') return;
    
    try {
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
      
      // In a real app, you would fetch from an API:
      // const response = await fetch(`/api/projects/${pid}/documents`);
      // const data = await response.json();
      // setDocuments(data);
      
    } catch (error) {
      console.error("Error loading documents:", error);
    }
  }, []);

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
    return documents[type] || null;
  };

  // Update a document
  const updateDocument = (type: string, content: DocumentContent) => {
    setDocuments(prev => ({
      ...prev,
      [type]: {
        ...(prev[type] || createEmptyDocument(type)),
        content,
        lastModified: new Date().toISOString()
      }
    }));
  };

  // Save documents to storage
  const saveDocuments = () => {
    if (typeof window !== 'undefined' && projectId && projectId !== 'default-project') {
      localStorage.setItem(`neoDocuments_${projectId}`, JSON.stringify(documents));
    }
    
    // In a real app:
    // fetch(`/api/projects/${projectId}/documents`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(documents)
    // });
  };

  return {
    documents,
    getDocument,
    updateDocument,
    saveDocuments,
    loadDocuments,
    inconsistencyCounts
  };
};