export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  collaborators?: string[];
  documents: {
    canvas?: DocumentData;
    strategy?: DocumentData;
    financialProjection?: DocumentData;
    okrs?: DocumentData;
  };
}

export interface DocumentData {
  content: string;
  lastModified: Date;
  version: number;
  modifiedBy: string;
} 