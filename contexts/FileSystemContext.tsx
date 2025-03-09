import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { DocumentType } from './DocumentContext';

// Define file interface
interface FileInfo {
  path: string;
  content: any;
  lastModified: string;
}

// Define context type
interface FileSystemContextType {
  files: FileInfo[];
  storageDirectory: string;
  setStorageDirectory: React.Dispatch<React.SetStateAction<string>>;
  saveFile: (path: string, content: any) => Promise<string>;
  loadFile: (path: string) => Promise<any>;
  deleteFile: (path: string) => Promise<boolean>;
  listFiles: () => Promise<FileInfo[]>;
  convertFileToJson: (file: File, docType: string) => Promise<any>;
  saveJsonToFileSystem: (jsonData: any, fileName: string) => string | null;
  processUploadedFile: (file: File) => Promise<void>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  exportFileAs: (content: any, fileName: string, format: string) => Promise<void>;
}

// Create the context
export const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined);

// Provider props
interface FileSystemProviderProps {
  children: ReactNode;
}

export const FileSystemProvider: React.FC<FileSystemProviderProps> = ({ children }) => {
  // State for files
  const [files, setFiles] = useState<FileInfo[]>([]);
  
  // State for storage directory
  const [storageDirectory, setStorageDirectory] = useState('');
  
  // State for selected document type (for imports)
  const [selectedDocType, setSelectedDocType] = useState<DocumentType>('Strategy');
  
  // Initialize on client-side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load storage directory from localStorage
      const savedDirectory = localStorage.getItem('neoStorageDirectory');
      if (savedDirectory) {
        setStorageDirectory(savedDirectory);
      }
      
      // Load files from the file system (localStorage)
      loadFiles();
    }
  }, []);
  
  /**
   * Load files from storage
   */
  const loadFiles = () => {
    if (typeof window === 'undefined') return;
    
    try {
      const fileSystem = JSON.parse(localStorage.getItem('neoFileSystem') || '{}');
      const fileArray = Object.entries(fileSystem).map(([path, data]: [string, any]) => ({
        path,
        ...data
      }));
      
      setFiles(fileArray);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };
  
  /**
   * Save a file to the file system
   */
  const saveFile = async (path: string, content: any): Promise<string> => {
    if (typeof window === 'undefined') return '';
    
    try {
      // Create directory structure if it doesn't exist
      if (!localStorage.getItem('neoFileSystem')) {
        localStorage.setItem('neoFileSystem', JSON.stringify({}));
      }
      
      const fileSystem = JSON.parse(localStorage.getItem('neoFileSystem') || '{}');
      const filePath = `${storageDirectory ? storageDirectory + '/' : ''}${path}`;
      
      // Store the file in our simulated filesystem
      fileSystem[filePath] = {
        content,
        lastModified: new Date().toISOString()
      };
      
      localStorage.setItem('neoFileSystem', JSON.stringify(fileSystem));
      
      // Reload files
      loadFiles();
      
      return filePath;
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  };
  
  /**
   * Load a file from the file system
   */
  const loadFile = async (path: string): Promise<any> => {
    if (typeof window === 'undefined') return null;
    
    try {
      const fileSystem = JSON.parse(localStorage.getItem('neoFileSystem') || '{}');
      return fileSystem[path]?.content || null;
    } catch (error) {
      console.error('Error loading file:', error);
      throw error;
    }
  };
  
  /**
   * Delete a file from the file system
   */
  const deleteFile = async (path: string): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    
    try {
      const fileSystem = JSON.parse(localStorage.getItem('neoFileSystem') || '{}');
      
      if (fileSystem[path]) {
        delete fileSystem[path];
        localStorage.setItem('neoFileSystem', JSON.stringify(fileSystem));
        
        // Reload files
        loadFiles();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  };
  
  /**
   * List all files in the file system
   */
  const listFiles = async (): Promise<FileInfo[]> => {
    if (typeof window === 'undefined') return [];
    
    try {
      const fileSystem = JSON.parse(localStorage.getItem('neoFileSystem') || '{}');
      
      return Object.entries(fileSystem).map(([path, data]: [string, any]) => ({
        path,
        ...data
      }));
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  };
  
  /**
   * Convert a file to JSON
   */
  const convertFileToJson = async (file: File, docType: string): Promise<any> => {
    if (typeof window === 'undefined') return null;
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    try {
      // CSV files
      if (fileExtension === 'csv') {
        return new Promise((resolve, reject) => {
          // In a real app, we'd use Papa Parse
          // For this demo, just create a simple representation
          const reader = new FileReader();
          reader.onload = (e) => {
            try {
              const text = e.target?.result as string;
              const lines = text.split('\n');
              const headers = lines[0].split(',');
              
              const data = lines.slice(1).map(line => {
                const values = line.split(',');
                const obj: {[key: string]: string} = {};
                
                headers.forEach((header, index) => {
                  obj[header.trim()] = values[index]?.trim() || '';
                });
                
                return obj;
              });
              
              resolve({
                type: docType,
                format: 'csv',
                fileName: file.name,
                data,
                meta: { headers },
                lastModified: new Date().toISOString()
              });
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = (error) => reject(error);
          reader.readAsText(file);
        });
      }
      
      // Excel files
      else if (['xlsx', 'xls'].includes(fileExtension || '')) {
        // In a real app, we'd use SheetJS/xlsx
        // For this demo, just create a placeholder
        return {
          type: docType,
          format: 'excel',
          fileName: file.name,
          sheetName: 'Sheet1',
          data: [{ placeholder: 'Excel data would be parsed here' }],
          lastModified: new Date().toISOString()
        };
      }
      
      // Word documents
      else if (['docx', 'doc'].includes(fileExtension || '')) {
        // In a real app, we'd use mammoth
        // For this demo, just create a placeholder
        return {
          type: docType,
          format: 'word',
          fileName: file.name,
          content: 'Word document content would be extracted here',
          lastModified: new Date().toISOString()
        };
      }
      
      // JSON files
      else if (fileExtension === 'json') {
        const text = await file.text();
        try {
          const data = JSON.parse(text);
          
          return {
            type: docType,
            format: 'json',
            fileName: file.name,
            data: data,
            lastModified: new Date().toISOString()
          };
        } catch (error) {
          throw new Error('Invalid JSON file');
        }
      }
      
      // Text files
      else if (['txt', 'md'].includes(fileExtension || '')) {
        const text = await file.text();
        
        return {
          type: docType,
          format: 'text',
          fileName: file.name,
          content: text,
          lastModified: new Date().toISOString()
        };
      }
      
      // Fallback for other file types
      else {
        const text = await file.text();
        
        return {
          type: docType,
          format: 'unknown',
          fileName: file.name,
          content: text,
          lastModified: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Error converting file to JSON:', error);
      throw error;
    }
  };
  
  /**
   * Save JSON to file system
   */
  const saveJsonToFileSystem = (jsonData: any, fileName: string): string | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const filePath = `${storageDirectory ? storageDirectory + '/' : ''}${fileName}`;
      
      // Save to file system
      saveFile(filePath, jsonData);
      
      // Create downloadable file
      const json = JSON.stringify(jsonData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a downloadable link
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return filePath;
    } catch (error) {
      console.error('Error saving JSON to filesystem:', error);
      return null;
    }
  };
  
  /**
   * Process an uploaded file
   */
  const processUploadedFile = async (file: File): Promise<void> => {
    if (typeof window === 'undefined') return;
    
    try {
      // Get selected document type from UI
      // In a real app, this would come from a form or state
      // For this demo, we'll use the selectedDocType state
      const docType = selectedDocType.toLowerCase();
      
      // Convert file to JSON
      const jsonData = await convertFileToJson(file, docType);
      
      // Save to filesystem
      const filePath = saveJsonToFileSystem(jsonData, `${docType}_${file.name}`);
      
      // In a real app, you'd now update the document in the DocumentContext
      // and show the file in the UI
    } catch (error) {
      console.error('Error processing file:', error);
      throw error;
    }
  };
  
  /**
   * Handle file selection from input
   */
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processUploadedFile(files[0]);
    }
  };
  
  /**
   * Handle file drop
   */
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processUploadedFile(files[0]);
    }
  };
  
  /**
   * Export a file in a specific format
   */
  const exportFileAs = async (content: any, fileName: string, format: string): Promise<void> => {
    if (typeof window === 'undefined') return;
    
    try {
      let blob: Blob;
      let mimeType: string;
      
      switch (format.toLowerCase()) {
        case 'json':
          blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
          mimeType = 'application/json';
          break;
          
        case 'txt':
        case 'text':
          // Convert to text if needed
          const text = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
          blob = new Blob([text], { type: 'text/plain' });
          mimeType = 'text/plain';
          break;
          
        case 'html':
          // Convert to HTML if needed
          const html = typeof content === 'string' ? content : `
            <!DOCTYPE html>
            <html>
              <head>
                <title>${fileName}</title>
                <style>
                  body { font-family: Arial, sans-serif; }
                  table { border-collapse: collapse; }
                  th, td { border: 1px solid #ddd; padding: 8px; }
                </style>
              </head>
              <body>
                <h1>${fileName}</h1>
                <pre>${JSON.stringify(content, null, 2)}</pre>
              </body>
            </html>
          `;
          
          blob = new Blob([html], { type: 'text/html' });
          mimeType = 'text/html';
          break;
          
        case 'csv':
          // In a real app, you'd convert JSON to CSV properly
          // For this demo, just create a simple CSV
          let csv = '';
          
          if (Array.isArray(content)) {
            // Get headers from first object
            const headers = Object.keys(content[0] || {});
            csv = headers.join(',') + '\n';
            
            // Add rows
            content.forEach(item => {
              const row = headers.map(header => item[header] || '').join(',');
              csv += row + '\n';
            });
          } else {
            // Just convert simple object
            csv = Object.entries(content)
              .map(([key, value]) => `${key},${value}`)
              .join('\n');
          }
          
          blob = new Blob([csv], { type: 'text/csv' });
          mimeType = 'text/csv';
          break;
          
        default:
          // Default to JSON
          blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
          mimeType = 'application/json';
      }
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${fileName}.${format.toLowerCase()}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting file:', error);
      throw error;
    }
  };
  
  // Context value
  const value = {
    files,
    storageDirectory,
    setStorageDirectory,
    saveFile,
    loadFile,
    deleteFile,
    listFiles,
    convertFileToJson,
    saveJsonToFileSystem,
    processUploadedFile,
    handleFileSelect,
    handleFileDrop,
    exportFileAs
  };
  
  return (
    <FileSystemContext.Provider value={value}>
      {children}
    </FileSystemContext.Provider>
  );
};