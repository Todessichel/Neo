import React, { useState } from 'react';
import { FileService, FileLocation } from '../../services/FileService';
import { DocumentType } from '../../types/projectTypes';

interface FileSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSetupComplete: (location: FileLocation) => void;
}

export const FileSetupModal: React.FC<FileSetupModalProps> = ({
  isOpen,
  onClose,
  onSetupComplete,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelectDirectory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Starting directory selection...');
      const directory = await FileService.selectDirectory();
      console.log('Directory selection result:', directory);
      
      if (directory) {
        const location: FileLocation = {
          directory,
          files: {}
        };
        console.log('Saving file location:', location);
        await FileService.saveFileLocation(location);
        console.log('File location saved successfully');
        onSetupComplete(location);
      } else {
        setError('No directory was selected. Please try again.');
      }
    } catch (err) {
      console.error('Error in handleSelectDirectory:', err);
      setError(err instanceof Error ? err.message : 'Failed to select directory. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadFiles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const location = await FileService.uploadFiles();
      if (location) {
        onSetupComplete(location);
      }
    } catch (err) {
      setError('Failed to upload files. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6">Welcome to NEO Strategy Platform</h2>
        
        <p className="mb-6 text-gray-600">
          To get started, you can either:
        </p>

        <div className="space-y-4">
          <button
            onClick={handleSelectDirectory}
            disabled={isLoading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            Select Existing Directory
          </button>

          <button
            onClick={handleUploadFiles}
            disabled={isLoading}
            className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50"
          >
            Upload Files
          </button>

          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 disabled:opacity-50"
          >
            Create from Scratch
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="mt-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  );
}; 