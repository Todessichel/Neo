// useFileSystem.ts
import { useState, useEffect } from 'react';
import { DocumentContent } from './useDocuments';

export interface FileSystemState {
  storageDirectory: string;
  showSettingsModal: boolean;
  showFileManagerModal: boolean;
  showIntegrationModal: boolean;
  activeTab: string;
}

export interface FileSystemActions {
  setStorageDirectory: (directory: string) => void;
  setShowSettingsModal: (show: boolean) => void;
  setShowFileManagerModal: (show: boolean) => void;
  setShowIntegrationModal: (show: boolean) => void;
  setActiveTab: (tab: string) => void;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  saveJsonToFileSystem: (jsonData: any, fileName: string) => string | null;
  getStoredFiles: () => Array<{path: string, content: any, lastModified: string}>;
  deleteFile: (path: string) => void;
  downloadFile: (path: string, content: any) => void;
}

interface StoredFile {
  content: any;
  lastModified: string;
}

export interface FileSystem {
  [path: string]: StoredFile;
}

export const useFileSystem = (
  setDocumentContent: (updater: (prev: DocumentContent) => DocumentContent) => void,
  setActiveDocument: (document: string) => void,
  setHasDocuments: (has: boolean) => void,
  setSuccessMessage: (message: string | null) => void
): [FileSystemState, FileSystemActions] => {
  const [storageDirectory, setStorageDirectory] = useState<string>('');
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showFileManagerModal, setShowFileManagerModal] = useState<boolean>(false);
  const [showIntegrationModal, setShowIntegrationModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('import');
  
  // Load storage directory from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    setStorageDirectory(localStorage.getItem('neoStorageDirectory') || '');
  }, []);
  
  // Save storage directory to localStorage when changed
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem('neoStorageDirectory', storageDirectory);
  }, [storageDirectory]);
  
  // Convert various file types to JSON
  const convertFileToJson = async (file: File, docType: string): Promise<any> => {
    if (typeof window === 'undefined') return null;
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    try {
      // CSV files
      if (fileExtension === 'csv') {
        return new Promise((resolve, reject) => {
          // @ts-ignore - Papa is imported dynamically
          if (typeof Papa === 'undefined') {
            reject(new Error('PapaParse library not available'));
            return;
          }
          
          Papa.parse(file, {
            header: true,
            dynamicTyping: true,
            complete: (results: any) => {
              resolve({
                type: docType,
                format: 'csv',
                fileName: file.name,
                data: results.data,
                meta: results.meta,
                lastModified: new Date().toISOString()
              });
            },
            error: (error: any) => {
              reject(error);
            }
          });
        });
      }
      
      // Excel files
      else if (['xlsx', 'xls'].includes(fileExtension || '')) {
        const arrayBuffer = await file.arrayBuffer();
        
        // @ts-ignore - XLSX is imported dynamically
        if (typeof XLSX === 'undefined') {
          throw new Error('SheetJS library not available');
        }
        
        // @ts-ignore - XLSX is imported dynamically
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // Convert to JSON
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        // @ts-ignore - XLSX is imported dynamically
        const data = XLSX.utils.sheet_to_json(worksheet);
        
        return {
          type: docType,
          format: 'excel',
          fileName: file.name,
          sheetName: firstSheetName,
          data: data,
          lastModified: new Date().toISOString()
        };
      }
      
      // Word documents
      else if (['docx', 'doc'].includes(fileExtension || '')) {
        const arrayBuffer = await file.arrayBuffer();
        
        // @ts-ignore - mammoth is imported dynamically
        if (typeof mammoth === 'undefined') {
          throw new Error('Mammoth library not available');
        }
        
        // @ts-ignore - mammoth is imported dynamically
        const result = await mammoth.extractRawText({ arrayBuffer });
        
        return {
          type: docType,
          format: 'word',
          fileName: file.name,
          content: result.value,
          lastModified: new Date().toISOString()
        };
      }
      
      // JSON files
      else if (fileExtension === 'json') {
        const text = await file.text();
        const data = JSON.parse(text);
        
        return {
          type: docType,
          format: 'json',
          fileName: file.name,
          data: data,
          lastModified: new Date().toISOString()
        };
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
  
  // Save JSON to "filesystem" (localStorage for prototype)
  const saveJsonToFileSystem = (jsonData: any, fileName: string): string | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      // Create directory structure if it doesn't exist
      if (!localStorage.getItem('neoFileSystem')) {
        localStorage.setItem('neoFileSystem', JSON.stringify({}));
      }
      
      const fileSystem = JSON.parse(localStorage.getItem('neoFileSystem') || '{}');
      const filePath = `${storageDirectory ? storageDirectory + '/' : ''}${fileName}`;
      
      // Store the file in our simulated filesystem
      fileSystem[filePath] = {
        content: jsonData,
        lastModified: new Date().toISOString()
      };
      
      localStorage.setItem('neoFileSystem', JSON.stringify(fileSystem));
      
      // Also create an actual downloadable file
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
      throw error;
    }
  };
  
  // Get all stored files
  const getStoredFiles = () => {
    if (typeof window === 'undefined') return [];
    
    try {
      const fileSystem = JSON.parse(localStorage.getItem('neoFileSystem') || '{}');
      return Object.entries(fileSystem).map(([path, data]: [string, any]) => ({
        path,
        content: data.content,
        lastModified: data.lastModified
      }));
    } catch (error) {
      console.error('Error getting stored files:', error);
      return [];
    }
  };
  
  // Delete a file
  const deleteFile = (path: string) => {
    if (typeof window === 'undefined') return;
    
    try {
      const fileSystem = JSON.parse(localStorage.getItem('neoFileSystem') || '{}');
      
      // Remove the file
      delete fileSystem[path];
      
      // Update localStorage
      localStorage.setItem('neoFileSystem', JSON.stringify(fileSystem));
      
      setSuccessMessage(`Deleted ${path}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting file:', error);
      setSuccessMessage(`Error deleting file: ${error}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };
  
  // Download a file
  const downloadFile = (path: string, content: any) => {
    if (typeof window === 'undefined') return;
    
    try {
      const json = JSON.stringify(content, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      // Create a downloadable link
      const a = document.createElement('a');
      a.href = url;
      a.download = path.split('/').pop() || 'file.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccessMessage(`Downloaded ${path}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error downloading file:', error);
      setSuccessMessage(`Error downloading file: ${error}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };
  
  // File upload handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processUploadedFile(files[0]);
    }
  };
  
  // File drop handler
  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processUploadedFile(files[0]);
    }
  };
  
  // Process an uploaded file
  const processUploadedFile = async (file: File) => {
    if (typeof window === 'undefined') return;
    
    try {
      // Get selected document type
      const docTypeSelect = document.querySelector('select') as HTMLSelectElement;
      const docType = docTypeSelect ? docTypeSelect.value : 'Strategy Document';
      
      // Map the UI document type to the internal type
      const docTypeMap: {[key: string]: string} = {
        'Strategy Document': 'Strategy',
        'Canvas': 'Canvas',
        'OKRs': 'OKRs',
        'Financial Projection': 'Financial Projection'
      };
      
      const internalDocType = docTypeMap[docType] || 'Strategy';
      
      // Convert file to JSON
      setSuccessMessage(`Converting ${file.name} to JSON format...`);
      const jsonData = await convertFileToJson(file, internalDocType.toLowerCase());
      
      // Save to filesystem
      setSuccessMessage(`Saving ${file.name} to filesystem...`);
      const filePath = saveJsonToFileSystem(jsonData, `${internalDocType.toLowerCase()}_${file.name}`);
      
      // Create placeholder content for display
      const placeholderContent = (
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">{internalDocType} - Imported from {file.name}</h2>
          <p className="mb-4">File successfully imported and saved to: {filePath}</p>
          <div className="p-4 bg-gray-100 rounded mb-4">
            <p className="font-medium mb-2">File Details:</p>
            <ul className="list-disc pl-5">
              <li><strong>Format:</strong> {jsonData.format}</li>
              <li><strong>Saved as:</strong> {filePath}</li>
              <li><strong>Last Modified:</strong> {new Date().toLocaleString()}</li>
            </ul>
          </div>
          <div className="p-4 bg-gray-100 rounded">
            <p className="font-mono text-sm mb-2">Preview of JSON data:</p>
            <div className="max-h-40 overflow-auto">
              <pre className="font-mono text-xs whitespace-pre-wrap">
                {JSON.stringify(jsonData, null, 2).substring(0, 500)}
                {JSON.stringify(jsonData, null, 2).length > 500 ? '...' : ''}
              </pre>
            </div>
          </div>
        </div>
      );
      
      // Update document content
      setDocumentContent(prevContent => ({
        ...prevContent,
        [internalDocType]: placeholderContent
      }));
      
      // Set hasDocuments to true since we now have at least one document
      setHasDocuments(true);
      
      // Set active document to the one we just imported
      setActiveDocument(internalDocType);
      
      // Show success message
      setSuccessMessage(`Successfully imported ${file.name} as ${internalDocType} and saved to ${filePath}`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      // Close the modal
      setShowIntegrationModal(false);
    } catch (error) {
      console.error('Error processing file:', error);
      setSuccessMessage(`Error: Failed to process ${file.name}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };
  
  return [
    {
      storageDirectory,
      showSettingsModal,
      showFileManagerModal,
      showIntegrationModal,
      activeTab
    },
    {
      setStorageDirectory,
      setShowSettingsModal,
      setShowFileManagerModal,
      setShowIntegrationModal,
      setActiveTab,
      handleFileSelect,
      handleFileDrop,
      saveJsonToFileSystem,
      getStoredFiles,
      deleteFile,
      downloadFile
    }
  ];
};