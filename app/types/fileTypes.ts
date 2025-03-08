// src/types/fileTypes.ts

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
  [key: string]: any; // For any additional properties
}

// Union type for all possible content formats
export type FileContent = CsvContent | ExcelContent | WordContent | JsonContent | TextContent;


// FileData interface that uses the FileContent type
export interface FileData {
  path: string;
  content: FileContent;
  lastModified: string;
}