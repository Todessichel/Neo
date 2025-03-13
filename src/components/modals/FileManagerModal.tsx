import React, { useState, useEffect, useRef } from 'react';
import { DocumentType } from '../../types/projectTypes';
import { DocumentIcon, TrashIcon } from '@heroicons/react/24/outline';
import { FolderIcon } from '@heroicons/react/24/solid';
import { FileSystemService, FileData } from '../../services/FileSystemService';

interface FileManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (file: FileData) => void;
  storageDirectory: string;
  isClient: boolean;
  onFileAction: (message: string) => void;
  onDirectoryChange?: (newDirectory: string) => void;
}

const FileManagerModal: React.FC<FileManagerModalProps> = ({
  isOpen,
  onClose,
  onFileSelect,
  storageDirectory,
  isClient,
  onFileAction,
  onDirectoryChange
}) => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasDirectoryAccess, setHasDirectoryAccess] = useState(false);
  const checkAccessRef = useRef<boolean>(false);

  console.log('FileManagerModal rendered:', { isOpen, hasDirectoryAccess, isLoading, isClient, storageDirectory });

  useEffect(() => {
    console.log('FileManagerModal mounted');
    return () => {
      console.log('FileManagerModal unmounted');
    };
  }, []);

  // Add effect to check directory access and load files when modal opens
  useEffect(() => {
    if (isOpen && !checkAccessRef.current) {
      checkAccessRef.current = true;
      checkDirectoryAccess();
    }
  }, [isOpen]);

  const checkDirectoryAccess = async () => {
    try {
      console.log('Checking directory access...');
      const handle = await FileSystemService.requestDirectoryAccess();
      if (handle) {
        console.log('Directory access granted:', handle.name);
        setHasDirectoryAccess(true);
        if (onDirectoryChange) {
          onDirectoryChange(handle.name);
        }
        await loadFiles();
      } else {
        console.log('No directory access');
        setHasDirectoryAccess(false);
      }
    } catch (error) {
      console.error('Error checking directory access:', error);
      setHasDirectoryAccess(false);
    } finally {
      checkAccessRef.current = false;
    }
  };

  const requestAccess = async () => {
    console.log('requestAccess button clicked');
    setIsLoading(true);
    try {
      await checkDirectoryAccess();
    } catch (error: any) {
      console.error('Error requesting directory access:', error);
      onFileAction(`Failed to get directory access: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      console.log('Loading files...');
      const fileList = await FileSystemService.listFiles();
      console.log('Files loaded:', fileList);
      setFiles(fileList);
    } catch (error) {
      console.error('Error loading files:', error);
      onFileAction('Error loading files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileDelete = async (file: FileData) => {
    if (!file.handle) {
      onFileAction('Cannot delete file: no file handle available');
      return;
    }

    try {
      await FileSystemService.deleteFile(file.handle);
      setFiles(files.filter(f => f.fullPath !== file.fullPath));
      onFileAction('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      onFileAction('Error deleting file');
    }
  };

  const handleFileSelect = (file: FileData) => {
    onFileSelect(file);
    onClose();
  };

  const isDirectoryEmpty = files.length === 0;

  if (!hasDirectoryAccess) {
    console.log('Rendering directory access request UI');
    return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center ${isOpen ? '' : 'hidden'}`}>
        <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold mb-4">Directory Access Required</h2>
          <p className="text-gray-600 mb-4">
            To manage your files, please select a directory where your documents will be stored.
          </p>
          <button
            type="button"
            onClick={requestAccess}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center justify-center mx-auto cursor-pointer"
            disabled={isLoading}
            style={{ 
              opacity: isLoading ? 0.7 : 1,
              pointerEvents: isLoading ? 'none' : 'auto'
            }}
          >
            <FolderIcon className="h-5 w-5 mr-2" />
            {isLoading ? 'Requesting Access...' : 'Select Directory'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center ${isOpen ? '' : 'hidden'}`}>
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">File Manager</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <span className="sr-only">Close</span>
            ×
          </button>
        </div>

        <div className="mb-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Current Directory: <span className="font-medium">{storageDirectory}</span>
          </div>
          <button
            onClick={requestAccess}
            className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
          >
            <FolderIcon className="h-4 w-4 mr-1" />
            Change Directory
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-4">Loading files...</div>
        ) : isDirectoryEmpty ? (
          <div className="text-gray-500 text-center py-4">
            No files found in this directory
          </div>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <div
                key={file.fullPath}
                className="flex items-center justify-between p-2 hover:bg-gray-100 rounded cursor-pointer"
                onClick={() => handleFileSelect(file)}
              >
                <div className="flex items-center space-x-2">
                  <DocumentIcon className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="font-medium">{file.name}</div>
                    <div className="text-xs text-gray-500">
                      Type: {file.docType}
                      <br />
                      Last Modified: {file.lastModified.toLocaleString()}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFileDelete(file);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileManagerModal;