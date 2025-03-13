/// <reference path="../types/file-system.d.ts" />
import { DocumentType } from '../types/projectTypes';
import { FileSystemDirectoryHandle, FileSystemFileHandle } from '../types/file-system';

export interface FileData {
  fullPath: string;
  path: string;
  name: string;
  docType: DocumentType;
  lastModified: Date;
  displayPath?: string;
  handle?: FileSystemFileHandle;
}

export class FileSystemService {
  private static directoryHandle: FileSystemDirectoryHandle | null = null;
  private static isRequestingAccess: boolean = false;
  private static documentAssignments: Record<DocumentType, string> = {
    'Canvas': '',
    'Strategy': '',
    'Financial Projection': '',
    'OKRs': ''
  };

  static setDirectoryHandle(handle: FileSystemDirectoryHandle) {
    console.log('FileSystemService: Setting directory handle:', handle.name);
    this.directoryHandle = handle;
    // Save directory handle to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('neoLastDirectory', handle.name);
    }
  }

  static getDirectoryHandle(): FileSystemDirectoryHandle | null {
    return this.directoryHandle;
  }

  static async requestDirectoryAccess(): Promise<FileSystemDirectoryHandle | null> {
    // If we're already requesting access, return the existing handle or null
    if (this.isRequestingAccess) {
      console.log('FileSystemService: Directory access request already in progress');
      return this.directoryHandle;
    }

    try {
      this.isRequestingAccess = true;

      // If we already have a directory handle, try to verify it's still valid
      if (this.directoryHandle) {
        try {
          // Try to list files to verify the handle is still valid
          await this.listFiles();
          console.log('FileSystemService: Existing directory handle is valid');
          return this.directoryHandle;
        } catch (error) {
          console.log('FileSystemService: Existing directory handle is invalid, requesting new access');
          this.directoryHandle = null;
        }
      }

      // Try to get the last directory from localStorage
      if (typeof window !== 'undefined') {
        const lastDirectory = localStorage.getItem('neoLastDirectory');
        if (lastDirectory) {
          console.log('FileSystemService: Found last directory in localStorage:', lastDirectory);
          // Note: We can't directly restore the handle from localStorage, but we can use this info
          // to potentially guide the user to the same directory
        }
      }

      console.log('FileSystemService: Requesting directory access...');
      console.log('FileSystemService: Checking window.showDirectoryPicker:', !!window.showDirectoryPicker);
      
      // Request directory access from user
      const handle = await window.showDirectoryPicker({
        mode: 'readwrite'
      });
      
      console.log('FileSystemService: Directory access granted:', handle);
      this.directoryHandle = handle;
      return handle;
    } catch (error) {
      console.error('FileSystemService: Error requesting directory access:', error);
      return null;
    } finally {
      this.isRequestingAccess = false;
    }
  }

  static async listFiles(directory: FileSystemDirectoryHandle | null = null): Promise<FileData[]> {
    const targetDirectory = directory || this.directoryHandle;
    
    if (!targetDirectory) {
      console.error('No directory handle available');
      throw new Error('No directory access. Please select a directory first.');
    }

    const files: FileData[] = [];
    
    try {
      console.log('Starting to list files in directory:', targetDirectory.name);
      for await (const entry of targetDirectory.values()) {
        console.log('Found entry:', entry.name, 'of type:', entry.kind);
        if (entry.kind === 'file') {
          const fileHandle = entry as FileSystemFileHandle;
          const file = await fileHandle.getFile();
          console.log('Processing file:', file.name);
          const docType = this.getDocumentType(file.name);
          
          files.push({
            fullPath: file.name,
            path: file.name,
            name: file.name,
            docType,
            lastModified: new Date(file.lastModified),
            handle: fileHandle
          });
        }
      }
      console.log('Total files found:', files.length);
      return files;
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  static async readFile(fileHandle: FileSystemFileHandle): Promise<string> {
    try {
      const file = await fileHandle.getFile();
      return await file.text();
    } catch (error) {
      console.error('Error reading file:', error);
      throw error;
    }
  }

  static async readFileContent(file: FileData): Promise<string> {
    if (!file.handle) {
      throw new Error('No file handle available');
    }
    return await this.readFile(file.handle);
  }

  static async writeFile(fileHandle: FileSystemFileHandle, content: string): Promise<void> {
    try {
      const writable = await fileHandle.createWritable();
      await writable.write(content);
      await writable.close();
    } catch (error) {
      console.error('Error writing file:', error);
      throw error;
    }
  }

  static async createFile(name: string, content: string = ''): Promise<FileSystemFileHandle> {
    if (!this.directoryHandle) {
      throw new Error('No directory access. Please select a directory first.');
    }

    try {
      const fileHandle = await this.directoryHandle.getFileHandle(name, { create: true });
      await this.writeFile(fileHandle, content);
      return fileHandle;
    } catch (error) {
      console.error('Error creating file:', error);
      throw error;
    }
  }

  static async deleteFile(fileHandle: FileSystemFileHandle): Promise<void> {
    if (!this.directoryHandle) {
      throw new Error('No directory access. Please select a directory first.');
    }

    try {
      await this.directoryHandle.removeEntry(fileHandle.name);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  private static getDocumentType(filename: string): DocumentType {
    const extension = filename.split('.').pop()?.toLowerCase();
    console.log('Processing file:', filename, 'with extension:', extension);
    
    // Handle Word documents
    if (extension === 'doc' || extension === 'docx') {
      console.log('Found Word document:', filename);
      return 'Strategy';
    }
    
    // Handle JSON files
    if (extension === 'json') {
      console.log('Found JSON file:', filename);
      return 'Financial Projection';
    }
    
    // Handle Markdown files
    if (extension === 'md') {
      console.log('Found Markdown file:', filename);
      if (filename.toLowerCase().includes('strategy')) return 'Strategy';
      if (filename.toLowerCase().includes('canvas')) return 'Canvas';
      if (filename.toLowerCase().includes('okr')) return 'OKRs';
      return 'Strategy'; // default for markdown files
    }
    
    console.log('Unknown file type:', filename);
    return 'Strategy'; // default type
  }

  // Add methods for document assignments
  static setDocumentAssignment(docType: DocumentType, filePath: string) {
    this.documentAssignments[docType] = filePath;
    if (typeof window !== 'undefined') {
      localStorage.setItem('neoDocumentAssignments', JSON.stringify(this.documentAssignments));
    }
  }

  static getDocumentAssignment(docType: DocumentType): string {
    return this.documentAssignments[docType];
  }

  static loadDocumentAssignments() {
    if (typeof window !== 'undefined') {
      const savedAssignments = localStorage.getItem('neoDocumentAssignments');
      if (savedAssignments) {
        try {
          this.documentAssignments = JSON.parse(savedAssignments);
          console.log('FileSystemService: Loaded document assignments:', this.documentAssignments);
        } catch (error) {
          console.error('FileSystemService: Error loading document assignments:', error);
        }
      }
    }
  }
} 