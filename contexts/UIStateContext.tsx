import React, { createContext, useState, useEffect, ReactNode } from 'react';

// Type for guided strategy state
interface GuidedStrategyState {
  active: boolean;
  step: number;
  inputs: Record<number, string>;
}

// Define the context type
interface UIStateContextType {
  // Modals
  showLoginModal: boolean;
  setShowLoginModal: React.Dispatch<React.SetStateAction<boolean>>;
  showIntegrationModal: boolean;
  setShowIntegrationModal: React.Dispatch<React.SetStateAction<boolean>>;
  showSettingsModal: boolean;
  setShowSettingsModal: React.Dispatch<React.SetStateAction<boolean>>;
  showFileManagerModal: boolean;
  setShowFileManagerModal: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Integration/Import/Export
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  
  // File system
  storageDirectory: string;
  setStorageDirectory: React.Dispatch<React.SetStateAction<string>>;
  
  // Messages and status
  successMessage: string | null;
  setSuccessMessage: React.Dispatch<React.SetStateAction<string | null>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  
  // Claude prompt
  claudePrompt: string | null;
  setClaudePrompt: React.Dispatch<React.SetStateAction<string | null>>;
  promptStage: 'idle' | 'pending' | 'completed';
  setPromptStage: React.Dispatch<React.SetStateAction<'idle' | 'pending' | 'completed'>>;
  
  // Guided strategy
  guidedStrategyState: GuidedStrategyState;
  setGuidedStrategyState: React.Dispatch<React.SetStateAction<GuidedStrategyState>>;
  
  // Helper functions
  showSuccessMessage: (message: string, duration?: number) => void;
  showErrorMessage: (message: string, duration?: number) => void;
  
  // File handlers
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  processUploadedFile: (file: File) => Promise<void>;
  convertFileToJson: (file: File, docType: string) => Promise<any>;
  saveJsonToFileSystem: (jsonData: any, fileName: string) => string | null;
}

// Create the context
export const UIStateContext = createContext<UIStateContextType | undefined>(undefined);

// Props for the provider component
interface UIStateProviderProps {
  children: ReactNode;
}

export const UIStateProvider: React.FC<UIStateProviderProps> = ({ children }) => {
  // State for modals
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFileManagerModal, setShowFileManagerModal] = useState(false);
  
  // State for active tab in integration modal
  const [activeTab, setActiveTab] = useState('import');
  
  // State for storage directory
  const [storageDirectory, setStorageDirectory] = useState('');
  
  // State for success message
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // State for loading indicator
  const [isLoading, setIsLoading] = useState(false);
  
  // State for Claude prompt
  const [claudePrompt, setClaudePrompt] = useState<string | null>(null);
  
  // State for prompt stage
  const [promptStage, setPromptStage] = useState<'idle' | 'pending' | 'completed'>('idle');
  
  // State for guided strategy
  const [guidedStrategyState, setGuidedStrategyState] = useState<GuidedStrategyState>({
    active: false,
    step: 0,
    inputs: {}
  });
  
  // Initialize storage directory from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setStorageDirectory(localStorage.getItem('neoStorageDirectory') || '');
    }
  }, []);
  
  /**
   * Shows a success message for a specified duration
   */
  const showSuccessMessage = (message: string, duration: number = 3000) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), duration);
  };
  
  /**
   * Shows an error message for a specified duration
   */
  const showErrorMessage = (message: string, duration: number = 5000) => {
    setSuccessMessage(`Error: ${message}`);
    setTimeout(() => setSuccessMessage(null), duration);
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
   * Process an uploaded file
   */
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
      showSuccessMessage(`Converting ${file.name} to JSON format...`);
      const jsonData = await convertFileToJson(file, internalDocType.toLowerCase());
      
      // Save to filesystem
      showSuccessMessage(`Saving ${file.name} to filesystem...`);
      const filePath = saveJsonToFileSystem(jsonData, `${internalDocType.toLowerCase()}_${file.name}`);
      
      // Show success message
      showSuccessMessage(`Successfully imported ${file.name} as ${internalDocType} and saved to ${filePath}`);
      
      // Close the modal
      setShowIntegrationModal(false);
    } catch (error) {
      console.error('Error processing file:', error);
      showErrorMessage(`Failed to process ${file.name}`);
    }
  };
  
  /**
   * Convert various file types to JSON
   */
  const convertFileToJson = async (file: File, docType: string): Promise<any> => {
    if (typeof window === 'undefined') return null;
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    try {
      // CSV files
      if (fileExtension === 'csv') {
        return new Promise((resolve, reject) => {
          // In a real app, you'd use a library like Papa Parse
          // For this example, we'll do a simplified parsing
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
        // In a real app, you'd use a library like SheetJS/xlsx
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
        // In a real app, you'd use a library like mammoth
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
      
      return filePath;
    } catch (error) {
      console.error('Error saving JSON to filesystem:', error);
      return null;
    }
  };
  
  // Context value
  const value = {
    showLoginModal,
    setShowLoginModal,
    showIntegrationModal,
    setShowIntegrationModal,
    showSettingsModal,
    setShowSettingsModal,
    showFileManagerModal,
    setShowFileManagerModal,
    activeTab,
    setActiveTab,
    storageDirectory,
    setStorageDirectory,
    successMessage,
    setSuccessMessage,
    isLoading,
    setIsLoading,
    claudePrompt,
    setClaudePrompt,
    promptStage,
    setPromptStage,
    guidedStrategyState,
    setGuidedStrategyState,
    showSuccessMessage,
    showErrorMessage,
    handleFileSelect,
    handleFileDrop,
    processUploadedFile,
    convertFileToJson,
    saveJsonToFileSystem
  };
  
  return (
    <UIStateContext.Provider value={value}>
      {children}
    </UIStateContext.Provider>
  );
};

// Custom hook to use the UI state context
export const useUIState = () => {
  const context = React.useContext(UIStateContext);
  if (context === undefined) {
    throw new Error('useUIState must be used within a UIStateProvider');
  }
  return context;
};