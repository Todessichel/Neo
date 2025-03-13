export type DocumentType = 'Strategy' | 'OKRs' | 'Financial Projection' | 'Canvas';

export interface Document {
  id: string;
  title: string;
  content: any;
  lastModified: Date;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  collaborators?: string[];
  documents: {
    [key in DocumentType]?: Document;
  };
} 