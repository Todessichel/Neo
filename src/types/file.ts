export interface FileData {
  name: string;
  path: string;
  fullPath: string;
  docType: 'Canvas' | 'Strategy' | 'Financial Projection' | 'OKRs';
  content?: string;
  lastModified?: Date;
  size?: number;
} 