import React, { createContext, useContext, useState, useEffect } from 'react';
import { fileService, StoredFile, FileConversionResult } from '../services/FileService';

interface FileSystemContextType {
  storageDirectory: string;
  setStorageDirectory: (directory: string) => void;
  showSettingsModal: boolean;
  setShowSettingsModal: (show: boolean) => void;
  showFileManagerModal: boolean;
  setShowFileManagerModal: (show: boolean) => void;
  showIntegrationModal: boolean;
  setShowIntegrationModal: (show: boolean) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  files: StoredFile[];
  loadFiles: () => Promise<void>;
  convertFileToJson: (file: File, docType: string) => Promise<FileConversionResult>;
  saveJsonToFileSystem: (jsonData: any, fileName: string) => Promise<string>;
  deleteFile: (path: string) => Promise<void>;
  processUploadedFile: (file: File) => Promise<void>;
}

const FileSystemContext = createContext<FileSystemContextType>({
  storageDirectory: '',
  setStorageDirectory: () => {},
  showSettingsModal: false,
  setShowSettingsModal: () => {},
  showFileManagerModal: false,
  setShowFileManagerModal: () => {},
  showIntegrationModal: false, 
  setShowIntegrationModal: () => {},
  activeTab: 'import',
  setActiveTab: () => {},
  files: [],
  loadFiles: async () => {},
  convertFileToJson: async () => ({ type: '', format: '', fileName: '', lastModified: '' }),
  saveJsonToFileSystem: async () => '',
  deleteFile: async () => {},
  processUploadedFile: async () => {},
});

export const FileSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State for file system settings and UI
  const [storageDirectory, setStorageDirectory] = useState<string>('');
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showFileManagerModal, setShowFileManagerModal] = useState<boolean>(false);
  const [showIntegrationModal, setShowIntegrationModal] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('import');
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Access document context to update document content
  const { setDocumentContent, setActiveDocument, setHasDocuments } = useContext(DocumentContext) || {
    setDocumentContent: () => {},
    setActiveDocument: () => {},
    setHasDocuments: () => {}
  };

  // Initialize storage directory from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDirectory = fileService.getStorageDirectory();
      setStorageDirectory(savedDirectory);
      loadFiles();
    }
  }, []);

  // Load files from storage
  const loadFiles = async () => {
    try {
      const storedFiles = await fileService.getStoredFiles();
      setFiles(storedFiles);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };

  // Update storage directory
  const updateStorageDirectory = (directory: string) => {
    setStorageDirectory(directory);
    fileService.setStorageDirectory(directory);
  };

  // Convert file to JSON format
  const convertFileToJson = async (file: File, docType: string): Promise<FileConversionResult> => {
    try {
      return await fileService.convertFileToJson(file, docType);
    } catch (error) {
      console.error('Error converting file to JSON:', error);
      throw error;
    }
  };

  // Save JSON data to file system
  const saveJsonToFileSystem = async (jsonData: any, fileName: string): Promise<string> => {
    try {
      const filePath = await fileService.saveJsonToFileSystem(jsonData, fileName);
      await loadFiles(); // Reload files to update UI
      return filePath;
    } catch (error) {
      console.error('Error saving JSON to file system:', error);
      throw error;
    }
  };

  // Delete file from file system
  const deleteFile = async (path: string): Promise<void> => {
    try {
      await fileService.deleteFile(path);
      setSuccessMessage(`Deleted ${path}`);
      setTimeout(() => setSuccessMessage(null), 3000);
      await loadFiles(); // Reload files to update UI
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  };

  // Process an uploaded file
  const processUploadedFile = async (file: File): Promise<void> => {
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
      const filePath = await saveJsonToFileSystem(jsonData, `${internalDocType.toLowerCase()}_${file.name}`);
      
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

  return (
    <FileSystemContext.Provider
      value={{
        storageDirectory,
        setStorageDirectory: updateStorageDirectory,
        showSettingsModal,
        setShowSettingsModal,
        showFileManagerModal,
        setShowFileManagerModal,
        showIntegrationModal,
        setShowIntegrationModal,
        activeTab,
        setActiveTab,
        files,
        loadFiles,
        convertFileToJson,
        saveJsonToFileSystem,
        deleteFile,
        processUploadedFile,
      }}
    >
      {children}
    </FileSystemContext.Provider>
  );
};

export const useFileSystem = () => useContext(FileSystemContext);