// src/types/fileTypes.ts

import { DocumentType } from './projectTypes';

// Define possible content shapes based on file formats
export interface CsvContent {
  format: 'csv';
  fileName: string;
  data: Record<string, any>[];
  meta: {
    fields?: string[];
    [key: string]: any;
  };
}

export interface ExcelContent {
  format: 'excel';
  fileName: string;
  sheetName: string;
  data: Record<string, any>[];
}

export interface WordContent {
  format: 'word';
  fileName: string;
  content: string;
}

export interface JsonContent {
  format: 'json';
  fileName: string;
  data: Record<string, any>;
}

export interface TextContent {
  format: 'text' | 'unknown';
  fileName: string;
  content: string;
}

export interface FileSystemEntry {
  content: FileContent;
  lastModified: string;
  docType?: DocumentType;
  [key: string]: any; // For any additional properties
}

// Union type for all possible content formats
export type FileContent = CsvContent | ExcelContent | WordContent | JsonContent | TextContent;


// FileData interface that uses the FileContent type
export interface FileData {
  fullPath: string;  // Full path including directory
  path: string;      // Display path without directory prefix
  content?: FileContent; // Make content optional since we don't need it for file listing
  lastModified: string | Date; // Allow Date object as well
  docType?: DocumentType;
}

export interface FileLocation {
  directory: string;
  files: {
    [key in DocumentType]?: string;
  };
}