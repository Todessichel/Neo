import React, { useState, useEffect } from 'react';
import { FileData,FileSystemEntry, FileContent } from '../../types/fileTypes'


interface FileManagerModalProps {
  storageDirectory: string;
  isClient: boolean;
  onClose: () => void;
  onFileAction: (message: string) => void;
}

const FileManagerModal: React.FC<FileManagerModalProps> = ({
  storageDirectory,
  isClient,
  onClose,
  onFileAction
}) => {
  const [files, setFiles] = useState<FileData[]>([]);
  
  useEffect(() => {
    if (!isClient) return;
    
    // Load files from localStorage
    const fileSystem = JSON.parse(localStorage.getItem('neoFileSystem') || '{}') as Record<string, FileSystemEntry>;
    const fileArray = Object.entries(fileSystem).map(([path, data]: [string, FileSystemEntry]) => ({
      path,
      ...data
    }));
    
    setFiles(fileArray);
  }, [isClient]);
  
  const handleFileDelete = (path: string) => {
    if (!isClient) return;
    
    const fileSystem = JSON.parse(localStorage.getItem('neoFileSystem') || '{}');
    
    // Remove the file
    delete fileSystem[path];
    
    // Update localStorage
    localStorage.setItem('neoFileSystem', JSON.stringify(fileSystem));
    
    // Update state
    setFiles(files.filter(file => file.path !== path));
    
    onFileAction(`Deleted ${path}`);
  };
  
  const handleFileDownload = (path: string, content: FileContent) => {
    if (!isClient) return;
    
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
    
    onFileAction(`Downloaded ${path}`);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-3/4 max-w-4xl max-h-90vh overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">File Manager</h2>
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
        
        <div className="p-4 max-h-96 overflow-y-auto">
          <h3 className="font-medium mb-4">Stored Files</h3>
          
          {files.length === 0 ? (
            <div className="p-4 bg-gray-100 rounded text-center">
              <p>No files stored yet. Import some files to see them here.</p>
            </div>
          ) : (
            <div className="border rounded overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File Path</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Modified</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {files.map((file, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{file.path}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{file.content?.format || 'Unknown'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(file.lastModified).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button 
                          className="text-blue-600 hover:text-blue-800 mr-3"
                          onClick={() => handleFileDownload(file.path, file.content)}
                        >
                          Download
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-800"
                          onClick={() => handleFileDelete(file.path)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t">
          <p className="text-sm text-gray-600 mb-2">Storage Directory: {storageDirectory || 'No directory set (root)'}</p>
          <div className="flex justify-end">
            <button 
              className="text-gray-500 px-4 py-2 rounded"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileManagerModal;