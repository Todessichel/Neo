import { DocumentType } from './projectTypes';

export interface Inconsistency {
  id: string;
  text: string;
  documentType: DocumentType;
  implementationDetails: {
    section: string;
    action: string;
  };
  severity?: 'low' | 'medium' | 'high';
  category?: string;
}

export interface Suggestion {
  id: string;
  text: string;
  documentType: DocumentType;
  implementationDetails: {
    section: string;
    action: string;
  };
  priority?: 'low' | 'medium' | 'high';
}