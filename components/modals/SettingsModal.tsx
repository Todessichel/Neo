import React, { useState } from 'react';

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
  fileCount
}) => {
  const [directoryInput, setDirectoryInput] = useState(storageDirectory);
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-96 max-w-md overflow-hidden">
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
            <h4 className="font-medium mb-2">File System Status</h4>
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