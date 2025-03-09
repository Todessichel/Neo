// components/modals/index.tsx
import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useUIState } from '../../hooks/useUIState';

/**
 * Login Modal Component
 */
export const LoginModal: React.FC = () => {
  const { 
    loginEmail, 
    setLoginEmail, 
    loginPassword, 
    setLoginPassword, 
    isLoading, 
    login,
    setShowLoginModal
  } = useAuth();
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-96 max-w-md overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Sign In to NEO</h2>
            <button 
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setShowLoginModal(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-4">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input 
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" 
              id="email" 
              type="email" 
              placeholder="Email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input 
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline" 
              id="password" 
              type="password" 
              placeholder="******************"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
            />
            <p className="text-xs text-gray-500">For demo: Use demo@example.com / password123</p>
          </div>
          <div className="flex items-center justify-between">
            <button 
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              onClick={() => login(loginEmail, loginPassword)}
              disabled={isLoading}
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Settings Modal Component
 */
export const SettingsModal: React.FC = () => {
  const { 
    storageDirectory, 
    setStorageDirectory, 
    setShowSettingsModal, 
    showSuccessMessage 
  } = useUIState();
  
  const [directoryInput, setDirectoryInput] = React.useState(storageDirectory);
  
  const fileCount = React.useMemo(() => {
    if (typeof window === 'undefined') return 0;
    const fileSystem = JSON.parse(localStorage.getItem('neoFileSystem') || '{}');
    return Object.keys(fileSystem).length;
  }, []);
  
  const saveSettings = () => {
    if (typeof window === 'undefined') return;
    
    setStorageDirectory(directoryInput);
    localStorage.setItem('neoStorageDirectory', directoryInput);
    setShowSettingsModal(false);
    showSuccessMessage('Settings saved successfully');
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-96 max-w-md overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Settings</h2>
            <button 
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setShowSettingsModal(false)}
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
              onClick={() => setShowSettingsModal(false)}
            >
              Cancel
            </button>
            <button 
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={saveSettings}
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * File Manager Modal Component
 */
export const FileManagerModal: React.FC = () => {
  const { 
    storageDirectory,
    setShowFileManagerModal,
    showSuccessMessage
  } = useUIState();
  
  const [files, setFiles] = React.useState<any[]>([]);
  
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Load files from localStorage
    const fileSystem = JSON.parse(localStorage.getItem('neoFileSystem') || '{}');
    const fileArray = Object.entries(fileSystem).map(([path, data]: [string, any]) => ({
      path,
      ...data
    }));
    
    setFiles(fileArray);
  }, []);
  
  const handleFileDelete = (path: string) => {
    if (typeof window === 'undefined') return;
    
    const fileSystem = JSON.parse(localStorage.getItem('neoFileSystem') || '{}');
    
    // Remove the file
    delete fileSystem[path];
    
    // Update localStorage
    localStorage.setItem('neoFileSystem', JSON.stringify(fileSystem));
    
    // Update state
    setFiles(files.filter(file => file.path !== path));
    
    showSuccessMessage(`Deleted ${path}`);
  };
  
  const handleFileDownload = (path: string, content: any) => {
    if (typeof window === 'undefined') return;
    
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
    
    showSuccessMessage(`Downloaded ${path}`);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-3/4 max-w-4xl max-h-90vh overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">File Manager</h2>
            <button 
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setShowFileManagerModal(false)}
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
              onClick={() => setShowFileManagerModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Integration Modal Component
 */
export const IntegrationModal: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    storageDirectory, 
    setShowIntegrationModal,
    setShowSettingsModal,
    handleFileSelect,
    handleFileDrop
  } = useUIState();
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-11/12 md:w-3/4 lg:w-1/2 max-h-90vh overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Integrations & File Management</h2>
            <button 
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setShowIntegrationModal(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-b">
          <button 
            className={`px-4 py-2 ${activeTab === 'import' ? 'bg-blue-50 border-b-2 border-blue-500 font-medium' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            Import
          </button>
          <button 
            className={`px-4 py-2 ${activeTab === 'export' ? 'bg-blue-50 border-b-2 border-blue-500 font-medium' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            Export
          </button>
          <button 
            className={`px-4 py-2 ${activeTab === 'webhooks' ? 'bg-blue-50 border-b-2 border-blue-500 font-medium' : ''}`}
            onClick={() => setActiveTab('webhooks')}
          >
            Webhooks
          </button>
        </div>
        
        {/* Tab Content */}
        <div className="p-4 max-h-96 overflow-y-auto">
          {/* Import Tab */}
          {activeTab === 'import' && (
            <div>
              <h3 className="font-medium mb-4">Import Files</h3>
              <div className="mb-4">
                <label className="block mb-2">Document Type</label>
                <select className="w-full p-2 border rounded">
                  <option>Strategy Document</option>
                  <option>Canvas</option>
                  <option>OKRs</option>
                  <option>Financial Projection</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block mb-2">File Type</label>
                <select className="w-full p-2 border rounded">
                  <option>Excel (.xlsx)</option>
                  <option>Word (.docx)</option>
                  <option>PDF (.pdf)</option>
                  <option>JSON (.json)</option>
                  <option>CSV (.csv)</option>
                  <option>Markdown (.md)</option>
                </select>
              </div>
              
              {/* Display storage directory info */}
              <div className="mb-4 p-3 bg-gray-100 rounded">
                <p className="text-sm">
                  <strong>Storage Directory:</strong> {storageDirectory || 'No directory set (files will be saved to root)'}
                </p>
                <p className="text-xs mt-1">
                  Files will be converted to JSON format and saved to this location.
                  <button 
                    className="ml-2 text-blue-500 underline"
                    onClick={() => {
                      setShowIntegrationModal(false);
                      setShowSettingsModal(true);
                    }}
                  >
                    Change
                  </button>
                </p>
              </div>
              
              <div 
                className="mb-4 p-4 border-2 border-dashed border-gray-300 text-center rounded cursor-pointer hover:bg-gray-50"
                onClick={() => document.getElementById('fileUpload')?.click()}
                onDrop={handleFileDrop}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={(e) => e.preventDefault()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p>Drag & drop files here or <span className="text-blue-500">browse</span></p>
                <p className="text-xs text-gray-500 mt-1">Files will be automatically converted to JSON format</p>
                <input 
                  id="fileUpload" 
                  type="file" 
                  className="hidden" 
                  onChange={handleFileSelect}
                />
              </div>
              
              <div className="mb-4">
                <h4 className="font-medium mb-2">Import from URL</h4>
                <div className="flex">
                  <input 
                    type="text" 
                    placeholder="https://" 
                    className="flex-1 p-2 border rounded-l"
                  />
                  <button className="bg-blue-500 text-white px-4 py-2 rounded-r">
                    Import
                  </button>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Import from Cloud Services</h4>
                <div className="grid grid-cols-3 gap-2">
                  <button className="p-2 border rounded flex items-center justify-center">
                    <span>Google Drive</span>
                  </button>
                  <button className="p-2 border rounded flex items-center justify-center">
                    <span>Dropbox</span>
                  </button>
                  <button className="p-2 border rounded flex items-center justify-center">
                    <span>OneDrive</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Export Tab */}
          {activeTab === 'export' && (
            <div>
              <h3 className="font-medium mb-4">Export Documents</h3>
              
              <div className="mb-4">
                <label className="block mb-2">Select Content to Export</label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input type="checkbox" id="exp-strategy" className="mr-2" defaultChecked />
                    <label htmlFor="exp-strategy">Strategy Document</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="exp-canvas" className="mr-2" />
                    <label htmlFor="exp-canvas">Canvas</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="exp-okrs" className="mr-2" />
                    <label htmlFor="exp-okrs">OKRs</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="exp-financial" className="mr-2" />
                    <label htmlFor="exp-financial">Financial Projection</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="exp-all" className="mr-2" />
                    <label htmlFor="exp-all">All Documents (Bundle)</label>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block mb-2">Export Format</label>
                <select className="w-full p-2 border rounded">
                  <option>PDF (.pdf)</option>
                  <option>Word (.docx)</option>
                  <option>Excel (.xlsx)</option>
                  <option>JSON (.json)</option>
                  <option>Markdown (.md)</option>
                  <option>PowerPoint (.pptx)</option>
                </select>
              </div>
              
              <div className="mb-4">
                <h4 className="font-medium mb-2">Export Options</h4>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input type="checkbox" id="exp-comments" className="mr-2" />
                    <label htmlFor="exp-comments">Include Comments</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="exp-version" className="mr-2" defaultChecked />
                    <label htmlFor="exp-version">Include Version History</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="exp-suggestions" className="mr-2" />
                    <label htmlFor="exp-suggestions">Include Improvement Suggestions</label>
                  </div>
                </div>
              </div>
              
              <div>
                <button className="bg-blue-500 text-white px-4 py-2 rounded">
                  Export Selected
                </button>
              </div>
            </div>
          )}
          
          {/* Webhooks Tab */}
          {activeTab === 'webhooks' && (
            <div>
              <h3 className="font-medium mb-4">Webhook Integrations</h3>
              
              <div className="mb-4">
                <h4 className="font-medium mb-2">Active Integrations</h4>
                <div className="border rounded divide-y">
                  <div className="p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium">Notion</p>
                      <p className="text-sm text-gray-500">Syncs Strategy & OKRs</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-2 py-1 border rounded text-sm">Configure</button>
                      <button className="px-2 py-1 border rounded text-sm text-red-500">Disconnect</button>
                    </div>
                  </div>
                  <div className="p-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium">Slack</p>
                      <p className="text-sm text-gray-500">Notifies on document changes</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="px-2 py-1 border rounded text-sm">Configure</button>
                      <button className="px-2 py-1 border rounded text-sm text-red-500">Disconnect</button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="font-medium mb-2">Connect New Integration</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <button className="p-3 border rounded flex flex-col items-center justify-center">
                    <span className="text-sm">Google Sheets</span>
                  </button>
                  <button className="p-3 border rounded flex flex-col items-center justify-center">
                    <span className="text-sm">Airtable</span>
                  </button>
                  <button className="p-3 border rounded flex flex-col items-center justify-center">
                    <span className="text-sm">Asana</span>
                  </button>
                  <button className="p-3 border rounded flex flex-col items-center justify-center">
                    <span className="text-sm">Jira</span>
                  </button>
                  <button className="p-3 border rounded flex flex-col items-center justify-center">
                    <span className="text-sm">Trello</span>
                  </button>
                  <button className="p-3 border rounded flex flex-col items-center justify-center">
                    <span className="text-sm">Microsoft Teams</span>
                  </button>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Custom Webhook</h4>
                <div className="space-y-2">
                  <input 
                    type="text" 
                    placeholder="Webhook Name" 
                    className="w-full p-2 border rounded"
                  />
                  <input 
                    type="text" 
                    placeholder="Webhook URL" 
                    className="w-full p-2 border rounded"
                  />
                  <select className="w-full p-2 border rounded">
                    <option>Trigger: Document Updated</option>
                    <option>Trigger: Comment Added</option>
                    <option>Trigger: Suggestion Implemented</option>
                    <option>Trigger: All Changes</option>
                  </select>
                  <button className="bg-blue-500 text-white px-4 py-2 rounded">
                    Add Webhook
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t flex justify-end">
          <button 
            className="text-gray-500 px-4 py-2 rounded mr-2"
            onClick={() => setShowIntegrationModal(false)}
          >
            Cancel
          </button>
          <button className="bg-blue-500 text-white px-4 py-2 rounded">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};