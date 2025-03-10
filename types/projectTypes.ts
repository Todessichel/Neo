// src/types/projectTypes.ts
export interface Project {
  id: string;
  name: string;
  ownerId: string;
  created: string; // ISO date string
  description?: string; // Optional description
}

export type DocumentType = 
  | 'Canvas' 
  | 'Strategy' 
  | 'Financial Projection' 
  | 'OKRs';