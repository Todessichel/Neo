import React, { useState, useEffect } from 'react';

interface SettingsModalProps {
  storageDirectory: string;
  onSave: (directory: string) => void;
  onClose: () => void;
  fileCount: number;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  storageDirectory,
  onSave,
  onClose,
  fileCount: initialFileCount
}) => {
  const [directoryInput, setDirectoryInput] = useState(storageDirectory);
  const [fileCount, setFileCount] = useState(initialFileCount);
  
  // Update file count whenever the modal is shown
  useEffect(() => {
    refreshFileCount();
  }, []);
  
  // Function to calculate the current file count
  const refreshFileCount = () => {
    try {
      if (typeof window === 'undefined') return;
      
      const fileSystem = JSON.parse(localStorage.getItem('neoFileSystem') || '{}');
      const count = Object.keys(fileSystem)
        .filter(path => {
          const cleanPath = path.replace(/^\/+|\/+$/g, '');
          const cleanStorageDir = storageDirectory ? storageDirectory.replace(/^\/+|\/+$/g, '') : '';
          
          if (!cleanStorageDir) {
            return !cleanPath.includes('/');
          }
          
          return cleanPath.startsWith(cleanStorageDir + '/') && 
            !cleanPath.slice(cleanStorageDir.length + 1).includes('/');
        }).length;
      
      setFileCount(count);
      console.log('Current file count:', count);
    } catch (error) {
      console.error('Error calculating file count:', error);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-96 max-w-md overflow-hidden shadow-xl">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Settings</h2>
            <button 
              className="text-gray-500 hover:text-gray-700"
              onClick={onClose}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-4">
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Storage Directory
            </label>
            <input 
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
              type="text" 
              placeholder="e.g., /User/Documents/NEO"
              value={directoryInput}
              onChange={(e) => setDirectoryInput(e.target.value)}
            />
            <p className="mt-1 text-xs text-gray-500">
              This is where your JSON files will be saved. For the prototype, files are also stored in browser localStorage.
            </p>
          </div>
          
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">File System Status</h4>
              <button 
                onClick={refreshFileCount}
                className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Count
              </button>
            </div>
            <div className="p-3 bg-gray-100 rounded text-sm">
              <p><strong>Current storage path:</strong> {storageDirectory || 'No directory set (root)'}</p>
              <p className="mt-1"><strong>Files stored:</strong> {fileCount}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-6">
            <button 
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={() => onSave(directoryInput)}
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;