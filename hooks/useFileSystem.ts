import { useContext } from 'react';
import { FileSystemContext } from '../contexts/FileSystemContext';

/**
 * Custom hook for file system operations
 * @returns FileSystem context state and methods
 */
export const useFileSystem = () => {
  const context = useContext(FileSystemContext);
  
  if (!context) {
    throw new Error('useFileSystem must be used within a FileSystemProvider');
  }
  
  const {
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
  } = context;
  
  /**
   * Gets a file by its path
   * @param path - File path
   * @returns File content if found, null otherwise
   */
  const getFile = (path: string) => {
    return files.find(file => file.path === path)?.content || null;
  };
  
  /**
   * Checks if a file exists at the given path
   * @param path - File path
   * @returns True if file exists, false otherwise
   */
  const fileExists = (path: string) => {
    return files.some(file => file.path === path);
  };
  
  return {
    files,
    storageDirectory,
    setStorageDirectory,
    saveFile,
    loadFile,
    deleteFile,
    listFiles,
    getFile,
    fileExists,
    convertFileToJson,
    saveJsonToFileSystem,
    processUploadedFile,
    handleFileSelect,
    handleFileDrop,
    exportFileAs
  };
};

export default useFileSystem;